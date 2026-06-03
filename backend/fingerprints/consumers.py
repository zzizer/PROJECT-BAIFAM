import json
import threading
from uuid import uuid4

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer

from daemon.manager import fingerprint_manager


class FingerprintConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = f"scanner_{uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps(
                {
                    "type": "status",
                    "message": "Connected. Ready to scan.",
                }
            )
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        command = data.get("command")

        if command == "start_enroll":
            staff_base_uuid = data.get("staff_base_uuid")

            if not staff_base_uuid:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": "Missing staff_base_uuid.",
                        }
                    )
                )
                return

            threading.Thread(
                target=self._enroll_process,
                args=(staff_base_uuid,),
                daemon=True,
            ).start()

    def _enroll_process(self, staff_base_uuid: str):
        try:
            slot = fingerprint_manager.enroll(
                on_message=lambda kind, message: self._send_message(kind, message),
            )

            self._send_message(
                "success",
                f"Fingerprint enrolled successfully at slot {slot}",
                slot=slot,
                staff_base_uuid=staff_base_uuid,
            )

        except Exception as e:
            self._send_message("error", f"Enrollment failed: {str(e)}")

    def _send_message(self, msg_type: str, message: str, **extra):
        payload = {
            "type": "scanner_message",
            "message_type": msg_type,
            "message": message,
        }
        payload.update(extra)

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            payload,
        )

    async def scanner_message(self, event):
        payload = {
            "type": event["message_type"],
            "message": event["message"],
        }

        if "slot" in event:
            payload["slot"] = event["slot"]

        if "staff_base_uuid" in event:
            payload["staff_base_uuid"] = event["staff_base_uuid"]

        await self.send(text_data=json.dumps(payload))
