from django.urls import path
from .views import ConversationListAPIView, MessageListAPIView

# The app_name is useful for namespacing your URLs, 
# preventing conflicts with other apps.
app_name = 'chat_app'

urlpatterns = [
    # 1. API endpoint for fetching the list of all conversations for the logged-in user.
    # Frontend will hit this URL: /api/chat/conversations/
    path('conversations/', ConversationListAPIView.as_view(), name='conversation-list'),
    
    # 2. API endpoint for fetching historical messages for a specific conversation.
    # Frontend will hit this URL: /api/chat/messages/123/ (where 123 is the conversation ID)
    path('messages/<int:conversation_id>/', MessageListAPIView.as_view(), name='message-list'),
]
