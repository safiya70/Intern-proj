from django.db import models
from django.conf import settings

# Get the custom User model (assuming it's settings.AUTH_USER_MODEL)
User = settings.AUTH_USER_MODEL 

class Conversation(models.Model):
    # Participants in the chat. A Conversation must have at least two.
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        # Ensures a conversation between two specific users can only be created once
        # Requires a check in the view though, M2M constraints are complex
        # constraints = [
        #     models.UniqueConstraint(fields=['participant_1', 'participant_2'], name='unique_conversation')
        # ] 

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']