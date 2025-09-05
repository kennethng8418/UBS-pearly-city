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
from django.utils import timezone

from .serializers import (
    JourneyInputSerializer,
    JourneyCalculationSerializer,
    JourneySerializer,
    ZoneSerializer,
    FareRuleSerializer,
    JourneyHistorySerializer,
    FareCalculationResponseSerializer,
)
ZONE = {'1','2','3'}

MAX_JOURNEYS_PER_DAY = 20

class CalculateFareAPIView(APIView):
    '''
    Calculate fare for a single journey.
    
    POST /api/calculate-fare/
    
    Request:
        {   'user_id': '1',
            journeys: [{'from_zone': '1','to_zone': '2'},
                {'from_zone': '2','to_zone': '2'}
            ]
        }
    
    Response:
        {
            'success': true,
            'data': {
                'user_id': '1',
                journeys:[...],
                total_fare: 90,
            }
        }
    '''
    
    def post(self, request):
        '''Handle single fare calculation request.'''
        # Validate input
        serializer = JourneyCalculationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        journeys = serializer.validated_data['journeys']
        user_id = serializer.validated_data['user_id']

        # Count how many journeys this user has already made today
        today = timezone.now().date()

        existing_journeys_count = Journey.objects.filter(
            user_id=user_id,
            timestamp__date=today
        ).count()
        new_journeys_count = len(journeys)
        if existing_journeys_count+new_journeys_count > MAX_JOURNEYS_PER_DAY:
            return Response(
                {
                    "success": False,
                    "error": f"Maximum {MAX_JOURNEYS_PER_DAY} journeys per day exceeded. "
                            f"You already have {existing_journeys_count} journeys today."
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            # Calculate fare using SimpleFareCalculator
            result = SimpleFareCalculator.calculate_batch_fares(journeys)
            result['user_id'] = user_id
            for jour in result['journeys']:
                # Extract zones
                from_zone = jour.get('from_zone')
                to_zone = jour.get('to_zone')
                fare = jour.get('fare')
                if from_zone not in ZONE or to_zone not in ZONE:
                    return Response(
                    {
                        'success': False,
                        'error': 'zone is invalid'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                journey = Journey.objects.create(
                    user_id = str(user_id), #extend requirement to make storage as user_id 
                    from_zone=str(from_zone),
                    to_zone=str(to_zone),
                    fare=int(fare),  # Store as integer
                )


            # Prepare response data
            response_serializer = FareCalculationResponseSerializer(result)

            return Response(
                {
                    'success': True,
                    'data': response_serializer.data
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
    
class UserJourneyHistoryCountAPIView(APIView):
    '''
    Get journey history for a specific user.
    
    GET /api/users/{user_id}/journeys/count
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
        today = timezone.now().date()
        journeysCount = Journey.objects.filter(
            user_id=user_id, 
            timestamp__date=today).count()
        
        return Response({
            'count': journeysCount
        }, status=status.HTTP_200_OK)