import json
import threading
from uuid import uuid4

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import close_old_connections, transaction
from django.utils import timezone

from daemon.manager import fingerprint_manager
from .serializers import FingerprintSerializer


class FingerprintConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.scope["user"].is_authenticated:
            await self.close(code=4401)
            return

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
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "message": "Invalid WebSocket message.",
                    }
                )
            )
            return

        command = data.get("command")

        if command == "start_enroll":
            staff_base_uuid = data.get("staff_base_uuid")
            finger_index = data.get("finger_type")
            label = data.get("label") or ""

            if not staff_base_uuid or finger_index is None:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": (
                                "Missing staff member or finger selection."
                            ),
                        }
                    )
                )
                return

            threading.Thread(
                target=self._enroll_process,
                args=(
                    staff_base_uuid,
                    finger_index,
                    label,
                    self.scope["user"].pk,
                ),
                daemon=True,
            ).start()
            return

        await self.send(
            text_data=json.dumps(
                {
                    "type": "error",
                    "message": "Unsupported scanner command.",
                }
            )
        )

    def _enroll_process(
        self,
        staff_base_uuid: str,
        finger_index: int,
        label: str,
        enrolled_by_id: int,
    ):
        close_old_connections()

        def save_record(slot: int) -> None:
            serializer = FingerprintSerializer(
                data={
                    "staff": staff_base_uuid,
                    "finger_index": finger_index,
                    "slot": slot,
                    "label": label,
                }
            )
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                serializer.save(
                    enrolled_at=timezone.now(),
                    enrolled_by_id=enrolled_by_id,
                )

        try:
            slot = fingerprint_manager.enroll(
                on_message=lambda kind, message: self._send_message(kind, message),
                on_template_stored=save_record,
            )

            self._send_message(
                "success",
                f"Fingerprint saved successfully at slot {slot}",
                slot=slot,
                staff_base_uuid=staff_base_uuid,
            )

        except Exception as e:
            self._send_message("error", f"Enrollment failed: {str(e)}")
        finally:
            close_old_connections()

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
