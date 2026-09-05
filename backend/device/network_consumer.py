import asyncio
import logging
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from api_mgt.models import APIKey
from . import network


logger = logging.getLogger(__name__)
NM = "org.freedesktop.NetworkManager"


class NetworkConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.tasks = []
        if not self.scope["user"].is_authenticated:
            await self.close(code=4401)
            return
        auth = self.scope.get("auth")
        if isinstance(auth, APIKey):
            allowed = await database_sync_to_async(auth.has_scope)("read:settings")
            if not allowed:
                await self.close(code=4403)
                return
        await self.accept()
        self.tasks.append(asyncio.create_task(self.stream()))
        expires = self.scope.get("auth_expires_at")
        if expires:
            self.tasks.append(asyncio.create_task(self.expire(expires)))

    async def expire(self, expires):
        await asyncio.sleep(max(0, expires - time.time()))
        await self.close(code=4401)

    async def disconnect(self, close_code):
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)

    async def stream(self):
        bus = None
        disconnected = None
        try:
            from dbus_next import BusType, Message, MessageType
            from dbus_next.aio import MessageBus

            changed = asyncio.Event()

            def on_signal(message):
                if message.message_type != MessageType.SIGNAL:
                    return
                if (
                    (message.path or "").startswith("/org/freedesktop/NetworkManager")
                    or (
                        message.interface == "org.freedesktop.DBus"
                        and message.member == "NameOwnerChanged"
                        and message.body[0] == NM
                    )
                ):
                    changed.set()

            bus = MessageBus(bus_type=BusType.SYSTEM)
            await asyncio.wait_for(bus.connect(), timeout=10)
            bus.add_message_handler(on_signal)
            for rule in (
                f"type='signal',sender='{NM}',path_namespace='/org/freedesktop/NetworkManager'",
                f"type='signal',sender='org.freedesktop.DBus',"
                f"interface='org.freedesktop.DBus',member='NameOwnerChanged',arg0='{NM}'",
            ):
                reply = await asyncio.wait_for(
                    bus.call(Message(
                        destination="org.freedesktop.DBus",
                        path="/org/freedesktop/DBus",
                        interface="org.freedesktop.DBus",
                        member="AddMatch",
                        signature="s",
                        body=[rule],
                    )),
                    timeout=10,
                )
                if reply.message_type == MessageType.ERROR:
                    raise RuntimeError("Network signal subscription denied")

            disconnected = asyncio.create_task(bus.wait_for_disconnect())
            disconnected.add_done_callback(lambda _: changed.set())
            changed.set()
            previous = None
            while True:
                await changed.wait()
                # Coalesce a burst of signals; this does not schedule periodic reads.
                await asyncio.sleep(0.25)
                changed.clear()
                if disconnected.done():
                    raise RuntimeError("System bus disconnected")
                try:
                    data = await asyncio.to_thread(network.snapshot)
                    event = {"type": "networks.snapshot", "data": data}
                except network.NetworkUnavailable as error:
                    event = {"type": "networks.error", "detail": str(error.detail)}
                if event != previous:
                    await self.send_json(event)
                    previous = event
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Network WebSocket stream failed")
            await self.send_json({
                "type": "networks.error",
                "detail": "Live network updates are unavailable. Reconnecting…",
            })
            await self.close(code=1011)
        finally:
            if bus is not None:
                bus.disconnect()
            if disconnected is not None:
                await asyncio.gather(disconnected, return_exceptions=True)
