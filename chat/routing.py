from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # 
    # The integer pattern is recommended for production (e.g., /ws/chat/123/), but 
    # we comment it out temporarily to match your test URL 'room1'.
    # re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),

    # This pattern now matches strings (like 'room1') for conversation_id:
    re_path(r'ws/chat/(?P<conversation_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    
]
