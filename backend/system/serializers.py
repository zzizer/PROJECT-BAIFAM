from .models import Scope
from utils.helpers import BaseSerializer

class ScopeSerializer(BaseSerializer):
    class Meta:
        model = Scope
        fields = "__all__"