import json

from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .dashboard import DASHBOARD_GROUP


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.scope["user"].is_authenticated:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(DASHBOARD_GROUP, self.channel_name)
        await self.accept()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "connection.ready",
                    "timestamp": timezone.now().isoformat(),
                }
            )
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            DASHBOARD_GROUP,
            self.channel_name,
        )

    async def dashboard_event(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": event["event_type"],
                    "data": event["data"],
                    "timestamp": event["timestamp"],
                }
            )
        )
