"""
URL routing for API.
"""
from django.urls import path
from .views import (
    CalculateFareAPIView,
    ZoneListAPIView,
    FareRulesAPIView,
    JourneyHistoryAPIView,
)

app_name = 'api'

urlpatterns = [
    # Main endpoints
    path('calculate-fare/', CalculateFareAPIView.as_view(), name='calculate-fare'),
    path('zones/', ZoneListAPIView.as_view(), name='zone-list'),
    path('fare-rules/', FareRulesAPIView.as_view(), name='fare-rules'),
    path('journeys/', JourneyHistoryAPIView.as_view(), name='journey-history'),

]

