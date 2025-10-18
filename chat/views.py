# chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

# IMPORTANT: Ensure the models in .models and serializers in .serializers 
# are correctly defined and accessible.

class ConversationListAPIView(APIView):
    """
    API to fetch all conversations for the authenticated user.
    This powers the left-hand panel of the chat interface.
    """
    def get(self, request, *args, **kwargs):
        # The request.user object is provided by Django's authentication middleware.
        # It filters for conversations where the current user is listed as a participant.
        conversations = Conversation.objects.filter(
            participants=request.user
        ).order_by('-updated_at').prefetch_related('participants')
        
        # Serialize the queryset into JSON
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data)

class MessageListAPIView(APIView):
    """
    API to fetch historical messages for a specific conversation.
    This loads the chat history when a user clicks on a conversation.
    """
    def get(self, request, conversation_id, *args, **kwargs):
        # 1. Find the conversation by ID, but only if the current user is a participant.
        # This acts as a security check.
        conversation = get_object_or_404(
            Conversation.objects.prefetch_related(
                # Prefetch the messages, ordering them by timestamp for correct history display
                Prefetch('messages', queryset=Message.objects.order_by('timestamp'))
            ),
            id=conversation_id,
            participants=request.user
        )
        
        # 2. Extract the messages and serialize them.
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


