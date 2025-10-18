from django.urls import path,include
from . import views
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet

router = DefaultRouter()
# Register the viewset for general conversation listing and retrieval
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('Freelancers/',views.Freelancers,name='Freelancers'),
    path('Freelancers/<int:user_id>/',views.freelancer_details,name='freelancer_details'),
    path('recruiters/',views.Recruiters.as_view(),name='Recruiters'),
    path('recruiters/<int:user_id>/',views.recruiter_details.as_view(),name='recruiter_details'),
    path('accounts/register/',views.UserRegistrationView.as_view(),name='registration'),
    path('accounts/login/',views.UserLoginView.as_view(),name='login_user'),
    path('accounts/profile/',views.ProfileView.as_view(),name='profile'),
    path('accounts/passwordchange/',views.ChangePasswordView.as_view(),name='change_password'),
    path('accounts/passwordreset/',views.SendPasswordResetEmailView.as_view(),name='send_reset_password_email'),
    path('accounts/reset/<uid>/<token>/',views.PasswordResetView.as_view(),name='reset_password'),
    path('accounts/logout/',views.LogoutView.as_view(),name='logout'),
    path('accounts/jobs/',views.JobListCreateView.as_view(),name='job_postings'),
    path('conversations/create/', 
         ConversationViewSet.as_view({'post': 'create_conversation'}), 
         name='conversation-create'),
    path('', include(router.urls)),
]