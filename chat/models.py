from django.db import models
from django.conf import settings 
from django.utils import timezone

# The ChatRoom model defines a conversation (e.g., between Freelancer X and Recruiter Y for Project Z)
class ChatRoom(models.Model):
    # You might want to link this to a Project model later, but for now, a unique name is enough.
    name = models.CharField(max_length=255, unique=True) 
    
    def __str__(self):
        return self.name

# The Message model stores the actual text content
class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    # Uses your custom user model defined by AUTH_USER_MODEL = "accounts.Users"
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        # Ensures messages are always displayed in chronological order
        ordering = ('timestamp',) 
        
    def __str__(self):
        return f'{self.sender.username}: {self.content[:30]}...'