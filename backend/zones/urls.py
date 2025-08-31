from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = [

    
    # Class-based views
    path('', views.ZoneAPIView.as_view(), name='zone-list'),

    
]