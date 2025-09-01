"""
URL routing for API.
"""
from django.urls import path
from .views import (
    CalculateFareAPIView,
    ZoneListAPIView,
    FareRulesAPIView,
    JourneyHistoryAPIView,
    UserJourneyHistoryAPIView,
)

app_name = 'api'

urlpatterns = [
    # Main endpoints
    path('calculate-fare/', CalculateFareAPIView.as_view(), name='calculate-fare'),
    path('zones/', ZoneListAPIView.as_view(), name='zone-list'),
    path('fare-rules/', FareRulesAPIView.as_view(), name='fare-rules'),
    path('journeys/', JourneyHistoryAPIView.as_view(), name='journey-history'),
    path('users/<str:user_id>/journeys/', UserJourneyHistoryAPIView.as_view(), name='user-journeys'),
]

