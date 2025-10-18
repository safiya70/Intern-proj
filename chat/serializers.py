from rest_framework import serializers
from .models import Conversation, Message
# Assuming your User model is the default or imported from django.contrib.auth
from django.contrib.auth import get_user_model

# Get the active User model defined in your Django settings
User = get_user_model()

# --- User Serializer ---
class UserSerializer(serializers.ModelSerializer):
    """Serializes the user details needed for displaying participants and senders."""
    
    # This field maps the ForeignKey 'sender' to a simple 'senderId' integer
    # for easy use in the React frontend (e.g., checking if it's the current user).
    id = serializers.IntegerField(read_only=True) 

    class Meta:
        model = User
        # Adjust 'username' field based on what you use for the user's display name
        fields = ['id', 'username']

# --- Message Serializer ---
class MessageSerializer(serializers.ModelSerializer):
    """Serializes a single chat message for historical views and WebSocket broadcast."""
    
    # Nested serialization: use the UserSerializer to display the sender's details
    sender = UserSerializer(read_only=True)
    
    # Add a dedicated 'senderId' field for easy access in the frontend (as used in React logic)
    senderId = serializers.IntegerField(source='sender.id', read_only=True)
    
    # Format the timestamp for better readability if needed, otherwise use default
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Message
        # The fields should match the data structure expected by the React component
        fields = ['id', 'sender', 'senderId', 'content', 'timestamp']

# --- Conversation Serializer ---
class ConversationSerializer(serializers.ModelSerializer):
    """Serializes the conversation list for the left panel."""
    
    # Nested serialization: list all participants using the UserSerializer
    participants = UserSerializer(many=True, read_only=True)
    
    # Custom field to rename 'last_message_content' (from the model) to 'last_message'
    last_message = serializers.CharField(source='last_message_content', read_only=True)
    
    # Custom field for better frontend display, showing only the other participant's username
    # NOTE: This requires custom logic in the View or the Serializer if you want
    # to exclude the current user's name, but keeping 'participants' is safer.
    
    class Meta:
        model = Conversation
        # Note: 'updated_at' is used for sorting in views.py
        fields = ['id', 'participants', 'updated_at', 'last_message']