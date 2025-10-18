import os
import django
# Temporarily commented out AuthMiddlewareStack to debug 500 error
# from channels.auth import AuthMiddlewareStack 
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

# 1. Set the Django settings module to your main project name 'Application'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Application.settings')
django_asgi_app = get_asgi_application()

# 2. Import the specific WebSocket URL patterns from your chat app
from chat.routing import websocket_urlpatterns 

# 3. Define the top-level application router
application = ProtocolTypeRouter({
    "http": django_asgi_app,

    # We are routing directly to URLRouter now, bypassing the complex AuthMiddlewareStack.
    "websocket": URLRouter(
        websocket_urlpatterns
    ),
})

