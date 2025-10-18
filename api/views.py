#importing models from app
from Hello.models import Freelancer_detail 
from recruiter.models import Recruiter_detail 
from accounts.models import Users, LoginAttempt
from recruiter.models import Job
#importing serializers
from . serializers import FreelancersSerializer
from . serializers import RecruitersSerializer 
from . serializers import UserRegistrationSerializer 
from . serializers import UserLoginSerializer
from . serializers import ProfileSerializer
from . serializers import ChangePasswordSerializer
from . serializers import SendPasswordResetEmailSerializer
from . serializers import PasswordResetSerializer
from . serializers import LogoutSerializer
from . serializers import JobSerializer

from rest_framework.response import Response #used for json format response for API
from rest_framework import status,permissions #to return status.status=HttpErrors
from rest_framework.decorators import api_view #for function-based serializers
from rest_framework.views import APIView  # for class-based function serializers
from django.http import Http404
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import parser_classes, permission_classes
import json


# Create your views here.

@api_view(['GET','POST'])
def Freelancers(request):
    if request.method == 'GET':
        Freelancer = Freelancer_detail.objects.all()
        serializer = FreelancersSerializer(Freelancer, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        serializer = FreelancersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['GET','PUT','PATCH','DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def freelancer_details(request, user_id):

    try:
        Freelancer = Freelancer_detail.objects.get(user_id=user_id)
    except Freelancer_detail.DoesNotExist:
        return Response({'error': 'Freelancer not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = FreelancersSerializer(Freelancer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ('PUT', 'PATCH'):
        # copy so we can mutate (QueryDict from multipart)
        data = request.data.copy()

        # if languages sent as JSON string in FormData, parse it to list
        if 'languages' in data and isinstance(data['languages'], str):
            try:
                data['languages'] = json.loads(data['languages'])
            except Exception:
                # leave as-is or convert to single-item list
                data['languages'] = [data['languages']]

        partial = (request.method == 'PATCH')
        serializer = FreelancersSerializer(Freelancer, data=data, partial=partial)
        if serializer.is_valid():
            # ensure owner remains unchanged; serializer should have user as read_only
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        Freelancer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class Recruiters(APIView):
    def get(self, request):
        Recruiters = Recruiter_detail.objects.all()
        serializer = RecruitersSerializer(Recruiters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer =RecruitersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class recruiter_details(APIView):
    def get_object(self,user_id):
        try:
            return Recruiter_detail.objects.get(user_id=user_id)
        except Recruiter_detail.DoesNotExist:
            raise Http404
    def get(self,request,user_id):
        Recruiter = self.get_object(user_id)
        serializer = RecruitersSerializer(Recruiter)
        return Response(serializer.data,status=status.HTTP_200_OK)

    def put(self,request,user_id):
        Recruiter = self.get_object(user_id)
        serializer = RecruitersSerializer(Recruiter,data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    def delete(self,request,user_id):
        Recruiter = self.get_object(user_id)
        Recruiter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
#generating token manually 
def get_tokens_for_user(user):
    if not user.is_active:
      raise AuthenticationFailed("User is not active")

    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class UserRegistrationView(APIView):
    def post(self,request,format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            token = get_tokens_for_user(user)
            return Response({"token": token, "message": "Registration successful"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            email = serializer.validated_data.get('email')
            password = serializer.validated_data.get('password')
            user = authenticate(email=email, password=password)
            login_success = user is not None

            # Save login attempt
            LoginAttempt.objects.create(
                email=email,
                success=login_success,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )

            if login_success:
                token = get_tokens_for_user(user)
                # Set redirect_url based on user role
                if user.role == 'recruiter':
                    redirect_url = ('http://localhost:3001/recruiter-dashboard')
                    
                elif user.role == 'freelancer':
                    redirect_url = ('http://localhost:3001/freelancer-dashboard')
                else:
                    redirect_url = ('http://localhost:3001/home')
                #print("User role:", user.role, "Redirect URL:", redirect_url)
                return Response({
                    "token": token,
                    "message": "Login successful",
                    "redirect_url": redirect_url
                }, status=status.HTTP_200_OK)
                
            else:
                return Response({"error": {"detail": "Invalid email or password"}}, status=status.HTTP_401_UNAUTHORIZED)
            


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        user_serializer = ProfileSerializer(instance=user)

        try:
            freelancer = Freelancer_detail.objects.get(user=user)
            freelancer_serializer = FreelancersSerializer(instance=freelancer)
            payload = {
                "user": user_serializer.data,
                "freelancer": freelancer_serializer.data
            }
            return Response(payload, status=status.HTTP_200_OK)
        except Freelancer_detail.DoesNotExist:
            return Response({"user": user_serializer.data, "freelancer": None}, status=status.HTTP_200_OK)
    
    
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    

    def post(self, request, format=None):
        serializer = ChangePasswordSerializer(data=request.data, context={'user': request.user})
        if serializer.is_valid(raise_exception=True):
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SendPasswordResetEmailView(APIView):
    
    def post(self,request,format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            return Response({"message": "Password reset email sent"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):

    def post(self, request, uid, token, format=None):
        serializer = PasswordResetSerializer(data=request.data, context={'uid': uid, 'token': token})
        if serializer.is_valid(raise_exception=True):
            return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#logout funnctionality has to be fetched wiht Headers type as application/json body as Refresh token and the Authorization as bearer access token   
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            refresh_token = serializer.validated_data["refresh"]
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
            except TokenError:
                return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can post jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            recruiter = Recruiter_detail.objects.get(user=request.user)
        except Recruiter_detail.DoesNotExist:
            return Response({'error': 'Recruiter profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            # Save the job with the recruiter set from the token
            serializer.save(recruiter=recruiter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self,request):
        jobs = Job.objects.filter(created_at__isnull=False).all()
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    # permission_classes = [IsAuthenticated] # MUST be secured

    def get_queryset(self):
        # Only show conversations the current user is a participant in
        return self.queryset.filter(participants=self.request.user)

    @action(detail=False, methods=['post'])
    def create_conversation(self, request):
        # 1. Get IDs
        current_user = request.user
        other_user_id = request.data.get('participant_id')
        
        if not other_user_id:
            return Response({'detail': 'participant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Find the other user
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Participant not found'}, status=status.HTTP_404_NOT_FOUND)

        # 3. Check for existing conversation
        # This checks for conversations where (user1 and user2) OR (user2 and user1) are participants
        existing_conv = Conversation.objects.filter(
            participants=current_user
        ).filter(
            participants=other_user
        ).first()

        if existing_conv:
            # Conversation exists, return it
            serializer = self.get_serializer(existing_conv)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # 4. Create New Conversation
        new_conv = Conversation.objects.create()
        new_conv.participants.add(current_user, other_user)
        
        serializer = self.get_serializer(new_conv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)