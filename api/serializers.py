from rest_framework import serializers
from Hello.models import Freelancer_detail
from recruiter.models import Recruiter_detail
from accounts.models import Users 
from recruiter.models import Job
#imports required for reset password via email
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from .utils import Util  # Make sure utils.py is in the same directory, or adjust the import as needed
import json
import re

class LanguagesField(serializers.Field):
    def to_internal_value(self, data):
        # Accept list/dict -> store JSON string
        if isinstance(data, (list, dict)):
            try:
                return json.dumps(data)
            except Exception:
                return json.dumps([str(x) for x in data]) if isinstance(data, list) else json.dumps(str(data))
        # Accept JSON-string representing list/dict -> normalize to JSON string
        if isinstance(data, str):
            s = data.strip()
            if not s:
                return ''
            try:
                parsed = json.loads(s)
                if isinstance(parsed, (list, dict)):
                    return json.dumps(parsed)
            except Exception:
                # keep raw string (single-language text)
                return s
        return str(data)

    def to_representation(self, value):
        if value is None:
            return None
        if isinstance(value, (list, dict)):
            return value
        if isinstance(value, str):
            s = value.strip()
            if not s:
                return []
            try:
                parsed = json.loads(s)
                return parsed
            except Exception:
                return value
        return value

class FreelancersSerializer(serializers.ModelSerializer):
    # make file fields optional so FormData uploads don't fail when file not provided
    profile_photo = serializers.ImageField(required=False, allow_null=True, use_url=True)
    resume = serializers.FileField(required=False, allow_null=True, use_url=True)

    # model.languages is TextField: custom field accepts array/string and stores string
    languages = LanguagesField(required=False, allow_null=True)

    # accept phone as char, validate/normalize in validate_phone
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Freelancer_detail
        fields = '__all__'
        read_only_fields = ['user']  # ensure user is set from view (serializer.save(user=request.user))

    def validate_languages(self, value):
        # Accept a list or a JSON string; always return a string for storage in TextField.
        if value is None:
            return None

        # If frontend sent an actual list, convert to JSON string
        if isinstance(value, list):
            try:
                return json.dumps(value)
            except Exception:
                return json.dumps([str(v) for v in value])

        # If it's already a string, check if it's JSON for a list and normalize to JSON string
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return json.dumps(parsed)
            except Exception:
                # keep plain string as-is (single-language)
                return value

        # Fallback: convert to string
        return str(value)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        langs = rep.get('languages')
        if isinstance(langs, str) and langs:
            try:
                parsed = json.loads(langs)
                rep['languages'] = parsed
            except Exception:
                rep['languages'] = langs
        return rep
        
    def validate_phone(self, value):
        if value is None:
            return None
        s = str(value).strip()
        if not s:
            return None

        # Prefer strong validation if python-phonenumbers installed
        try:
            import phonenumbers
            try:
                parsed = phonenumbers.parse(s, None if s.startswith('+') else "US")
                if phonenumbers.is_valid_number(parsed):
                    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            except Exception:
                pass
        except Exception:
            pass

        
        digits = re.sub(r'\D', '', s)
        if not digits:
            raise serializers.ValidationError("Phone must contain digits.")
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Phone number length looks invalid.")
        return '+' + digits

   
class RecruitersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter_detail
        fields ='__all__'
        
class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type':'password'},write_only=True)
    class Meta:
        model= Users
        fields=['email','name','role','password','password2','tc']
        extra_kwargs = {'password':{'write_only':True},'password2':{'write_only':True}}
        
    def validate(self,attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        role = attrs.get('role', None)
        if password != password2:
            raise serializers.ValidationError("Password and Confirm Password doesn't match")
        if not role:
            raise serializers.ValidationError("Role is required Field")
        return attrs

    def create(self,validate_data):
        return Users.objects.create_user(**validate_data)


class UserLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        model = Users
        fields = ['email','password']
        

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'
        
class ChangePasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=255,style={'input_type':'password'},write_only=True)
    password2 = serializers.CharField(max_length=255,style={'input_type':'password'},write_only=True)
    class Meta:
        model = Users
        fields=['password','password2']
        
    def validate(self,attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        user = self.context.get('user')
        if password != password2:
            raise serializers.ValidationError("Password and Confirm Password doesn't match")
        user.set_password(password)
        user.save()
        return attrs
    
class SendPasswordResetEmailSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        model = Users
        fields = ['email']
        
    def validate(self,attrs):
        email = attrs.get('email')
        if Users.objects.filter(email=email).exists():
            user = Users.objects.get(email=email)
            uid = urlsafe_base64_encode(smart_bytes(user.id))
            print('Encoded UID', uid)
            token = PasswordResetTokenGenerator().make_token(user)
            print('Password Reset Token', token)
            link = 'http://localhost:3000/api/accounts/reset/'+uid+'/'+token
            print('Password Reset Link', link)
            #sending email
            body = 'Click Following Link to Reset Your Password \n ' + link
            data = {
                'subject': 'TALENT-LOOP | Reset Password Link',
                'body': body,
                'to_email': user.email
            }
            Util.send_email(data)
            
            return attrs
        else:
            raise ValidationError("You are not a Registered User")
    
class PasswordResetSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=255,style={'input_type':'password'},write_only=True)
    password2 = serializers.CharField(max_length=255,style={'input_type':'password'},write_only=True)
    class Meta:
        model = Users
        fields=['password','password2']
        
    def validate(self,attrs):
        try:
            password = attrs.get('password')
            password2 = attrs.get('password2')
            uid = self.context.get('uid')
            token = self.context.get('token')
            if password != password2:
                raise serializers.ValidationError("Password and Confirm Password doesn't match")
            id = smart_str(urlsafe_base64_decode(uid))
            user = Users.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise ValidationError("Token is not Valid or Expired")
            user.set_password(password)
            user.save()
            return attrs
        except DjangoUnicodeDecodeError as identifier:
            PasswordResetTokenGenerator().check_token(user, token)
            raise ValidationError("Token is not Valid or Expired")
        
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    

class JobSerializer(serializers.ModelSerializer):
    recruiter_id = serializers.IntegerField(source='recruiter.user_id', read_only=True)
    class Meta:
        model = Job
        fields = ['title','description','Responsibilities','skills_required','experience_required','recruiter_id']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'role') # Ensure 'role' is on your User model

class ConversationSerializer(serializers.ModelSerializer):
    # Use the custom serializer for participants
    participants = UserSerializer(many=True, read_only=True) 

    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'updated_at')
        # You will need to add 'unread_count' logic in the ViewSet or a custom method later

