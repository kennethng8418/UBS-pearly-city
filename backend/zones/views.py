
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework import viewsets
from django.shortcuts import render, get_object_or_404
from .models import Zone
from .serializers import ZoneSerializer

def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")


class ZoneAPIView(APIView):
    """
    Simple, practical view for the PearlCard zone management.
    """
    
    def get(self, request):
        """
        Get all active zones for the fare calculator.
        Used by frontend to populate dropdown menus.
        """
        zones = Zone.objects.filter(is_active=True).order_by('zone_number')
        serializer = ZoneSerializer(zones, many=True)
        
        return Response({
            'success': True,
            'zones': serializer.data,
            'count': zones.count()
        })
    
    def post(self, request):
        """
        Create a new zone (admin functionality).
        """
        serializer = ZoneSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check if zone_number already exists
            if Zone.objects.filter(zone_number=serializer.validated_data['zone_number']).exists():
                return Response(
                    {'error': 'Zone with this number already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            zone = serializer.save()
            return Response({
                'success': True,
                'message': f'Zone {zone.zone_number} created successfully',
                'zone': ZoneSerializer(zone).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)