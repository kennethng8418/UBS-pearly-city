'''
API views using SimpleFareCalculator.
Clean, simple, and efficient.
'''
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from fare import SimpleFareCalculator
from zones.models import Zone
from fare.models import Journey  # Add this import

from .serializers import (
    JourneyInputSerializer,
    JourneySerializer,
    ZoneSerializer,
    FareRuleSerializer,
    JourneyHistorySerializer
)


class CalculateFareAPIView(APIView):
    '''
    Calculate fare for a single journey.
    
    POST /api/calculate-fare/
    
    Request:
        {   'user_id': '1',
            'from_zone': '1',
            'to_zone': '2'
        }
    
    Response:
        {
            'success': true,
            'data': {
                'from_zone': '1',
                'to_zone': '2',
                'fare': 55
            }
        }
    '''
    
    def post(self, request):
        '''Handle single fare calculation request.'''
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
        user_id = serializer.validated_data['user_id']

        try:
            # Calculate fare using SimpleFareCalculator
            fare = SimpleFareCalculator.calculate_single_fare(from_zone, to_zone)
            journey = Journey.objects.create(
                user_id = str(user_id), #extend requirement to make storage as user_id 
                from_zone=str(from_zone),
                to_zone=str(to_zone),
                fare=int(fare),  # Store as integer
            )

            journey_serializer = JourneySerializer(journey)

            # Prepare response data
            response_data = {
                'user_id': journey.user_id,
                'journey_id': journey.id,
                'from_zone': from_zone,
                'to_zone': to_zone,
                'fare': fare,
                'timestamp': journey.timestamp
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
    '''
    List all active zones.
    
    GET /api/zones/
    '''
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request):
        '''Get all active zones.'''
        zones = Zone.objects.filter(is_active=True).order_by('zone_number')
        serializer = ZoneSerializer(zones, many=True)
        
        return Response({
            'success': True,
            'zones': serializer.data,
            'count': zones.count()
        }, status=status.HTTP_200_OK)


class FareRulesAPIView(APIView):
    '''
    List all fare rules.
    
    GET /api/fare-rules/
    
    Note: This doesn't use a database model - rules come from SimpleFareCalculator.
    '''
    
    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour (rules don't change)
    def get(self, request):
        '''Get all fare rules.'''
        rules = SimpleFareCalculator.get_all_fare_rules()
        serializer = FareRuleSerializer(rules, many=True)
        
        return Response({
            'success': True,
            'fare_rules': serializer.data,
            'count': len(rules)
        }, status=status.HTTP_200_OK)

class JourneyHistoryAPIView(APIView):
    '''
    Get journey history.
    
    GET /api/journeys/
    '''
    
    def get(self, request):
        '''Get journey history '''
        # Get journey history
        journeys = Journey.objects.all()
        serializer = JourneyHistorySerializer(journeys, many=True)
        return Response({
            'success': True,
            'journeys': serializer.data,
            'count': journeys.count()
        }, status=status.HTTP_200_OK)
    
class UserJourneyHistoryAPIView(APIView):
    '''
    Get journey history for a specific user.
    
    GET /api/users/{user_id}/journeys/
    GET /api/user-journeys/?user_id={user_id}
    '''
    
    def get(self, request, user_id=None):
        '''Get journey history for a specific user.'''
        # Get user_id from URL path or query parameters
        if not user_id:
            user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {
                    'success': False,
                    'error': 'user_id is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        journeys = Journey.objects.filter(user_id=user_id)
        
        
        # Serialize journeys
        serializer = JourneyHistorySerializer(journeys, many=True)
        

        
        return Response({
            'success': True,
            'user_id': user_id,
            'journeys': serializer.data,
            'count': journeys.count()
        }, status=status.HTTP_200_OK)