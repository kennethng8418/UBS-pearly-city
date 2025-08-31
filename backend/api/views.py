"""
API views using SimpleFareCalculator.
Clean, simple, and efficient.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from fare import SimpleFareCalculator
from zones.models import Zone
from .serializers import (
    JourneyInputSerializer,
    ZoneSerializer,
    FareRuleSerializer
)


class CalculateFareAPIView(APIView):
    """
    Calculate fare for a single journey.
    
    POST /api/v1/calculate-fare/
    
    Request:
        {
            "from_zone": 1,
            "to_zone": 2
        }
    
    Response:
        {
            "success": true,
            "data": {
                "from_zone": 1,
                "to_zone": 2,
                "fare": 55
            }
        }
    """
    
    def post(self, request):
        """Handle single fare calculation request."""
        # Validate input
        serializer = JourneyInputSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        from_zone = serializer.validated_data['from_zone']
        to_zone = serializer.validated_data['to_zone']
        
        try:
            # Calculate fare using SimpleFareCalculator
            journey = SimpleFareCalculator.calculate_single_fare(from_zone, to_zone)
            
            # Prepare response data
            response_data = {
                'from_zone': from_zone,
                'to_zone': to_zone,
                'fare': journey['fare']
            }
            
            return Response(
                {
                    'success': True,
                    'data': response_data
                },
                status=status.HTTP_200_OK
            )
            
        except ValueError as e:
            # Handle calculation errors
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class ZoneListAPIView(APIView):
    """
    List all active zones.
    
    GET /api/zones/
    """
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        """Get all active zones."""
        zones = Zone.objects.filter(is_active=True).order_by('zone_number')
        serializer = ZoneSerializer(zones, many=True)
        
        return Response({
            'success': True,
            'zones': serializer.data,
            'count': zones.count()
        }, status=status.HTTP_200_OK)


class FareRulesAPIView(APIView):
    """
    List all fare rules.
    
    GET /api/fare-rules/
    
    Note: This doesn't use a database model - rules come from SimpleFareCalculator.
    """
    
    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour (rules don't change)
    def get(self, request):
        """Get all fare rules."""
        rules = SimpleFareCalculator.get_all_fare_rules()
        serializer = FareRuleSerializer(rules, many=True)
        
        return Response({
            'success': True,
            'fare_rules': serializer.data,
            'count': len(rules)
        }, status=status.HTTP_200_OK)

