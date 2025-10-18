import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist # Import to handle exceptions cleanly

# 1. 🚀 CORRECTED IMPORTS: Using the actual model names from chat/models.py
from .models import ChatRoom, Message 
# Map the consumer's expected variable names to the real model names
Conversation = ChatRoom # Renaming for cleaner use in the consumer logic

# 2. Get the custom User model
MyUser = get_user_model() 

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Handles real-time WebSocket communication for a specific chat conversation.
    """

    async def connect(self):
        """
        Accepts the connection, extracts the conversation ID from the URL,
        and adds the user to a channel group specific to that conversation.
        """
        # 1. Get the conversation ID from the URL route
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        # Define the group name for this conversation (e.g., 'chat_room1')
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # 2. Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # 3. Accept the connection
        await self.accept()
        print(f"WebSocket Connected: Joining group {self.room_group_name}")


    async def disconnect(self, close_code):
        """
        Removes the user from the channel group when the connection is closed.
        """
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket Disconnected: Leaving group {self.room_group_name}")


    async def receive(self, text_data):
        """
        Handles incoming JSON messages from the client.
        Triggers the save and broadcast process.
        """
        try:
            # Safely attempt to parse the incoming text as JSON
            data = json.loads(text_data)
        except json.JSONDecodeError:
            # Handle non-JSON data gracefully
            print(f"ERROR: Received non-JSON data from client. Ignoring message.")
            return

        # Now we know 'data' is a dictionary. We can proceed safely.
        command = data.get('command')
        content = data.get('content')
        sender_id = data.get('sender_id') 
        
        if command == 'new_message' and content and sender_id:
            await self.save_and_broadcast_message(content, sender_id)
        else:
            print(f"ERROR: Missing required fields (command, content, or sender_id) in message: {data}")


    async def chat_message(self, event):
        """
        Receives a message from the channel layer group (broadcasted by another consumer)
        and sends it over the WebSocket to the client.
        """
        message_data = event['message']

        # Send the message data back to the WebSocket client
        await self.send(text_data=json.dumps(message_data))


    @database_sync_to_async
    def create_message_and_get_data(self, content, sender_id):
        """
        Synchronous function to save the message to the database.
        """
        try:
            # 1. Look up User
            sender = MyUser.objects.get(pk=sender_id)
            
            # 2. FIX: Look up ChatRoom by the unique 'name' field, not by primary key 'pk'.
            conversation_room = Conversation.objects.get(name=self.conversation_id) 
            
            # 3. Create and save the new Message object
            new_message = Message.objects.create(
                room=conversation_room, 
                sender=sender,
                content=content,
                timestamp=timezone.now()
            )
            
            # 4. Prepare the data to be broadcasted
            return {
                'id': new_message.id,
                'sender_id': new_message.sender.id,
                'content': new_message.content,
                'timestamp': new_message.timestamp.isoformat(), 
            }
        except MyUser.DoesNotExist:
            print(f"Error saving message: Sender with ID {sender_id} does not exist.")
            return None
        except ObjectDoesNotExist:
            # This handles both MyUser.DoesNotExist and Conversation.DoesNotExist (ChatRoom.DoesNotExist)
            # The error message now reflects the lookup by name.
            print(f"Error saving message: Sender ID {sender_id} or ChatRoom with name '{self.conversation_id}' does not exist.")
            return None
        except Exception as e:
            # Catch all other database/ORM errors
            print(f"Critical error saving message to database: {type(e).__name__}: {e}")
            return None


    async def save_and_broadcast_message(self, content, sender_id):
        """
        Awaits the DB save operation and then sends the result to the channel group.
        """
        message_data = await self.create_message_and_get_data(content, sender_id)

        if message_data:
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat.message', # Calls the 'chat_message' handler
                    'message': message_data # The payload
                }
            )
