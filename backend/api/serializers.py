"""
Serializers for API request/response validation.
Simple and focused on the fare calculation use case.
"""
from rest_framework import serializers
from zones.models import Zone
from fare.models import Journey
class JourneyInputSerializer(serializers.Serializer):
    """
    Validates a single journey input.
    """
    from_zone = serializers.CharField(required=True)
    to_zone = serializers.CharField(required=True)

class JourneyCalculationSerializer(serializers.Serializer):
    """Serializer for fare calculation request"""
    user_id = serializers.CharField(required=True)
    journeys = JourneyInputSerializer(many=True, max_length=20)
class JourneyResultSerializer(serializers.Serializer):
    """Serializer for journey with calculated fare"""
    from_zone = serializers.IntegerField()
    to_zone = serializers.IntegerField()
    fare = serializers.IntegerField()
    error = serializers.CharField(required=False)
class FareCalculationResponseSerializer(serializers.Serializer):
    """Serializer for fare calculation response"""
    journeys = JourneyResultSerializer(many=True)
    total_fare = serializers.IntegerField()
    journey_count = serializers.IntegerField()
    user_id = serializers.CharField(required=False)

class ZoneSerializer(serializers.ModelSerializer):
    """
    Serializer for Zone model.
    """
    class Meta:
        model = Zone
        fields = ['zone_number', 'name', 'description', 'is_active']


class FareRuleSerializer(serializers.Serializer):
    """
    Serializer for displaying fare rules.
    No model needed - data comes from SimpleFareCalculator.
    """
    from_zone = serializers.IntegerField(read_only=True)
    to_zone = serializers.IntegerField(read_only=True)
    fare = serializers.FloatField(read_only=True)
    route = serializers.CharField(read_only=True)

class JourneySerializer(serializers.ModelSerializer):
    """
    Serializer for Journey model.
    Returns journey with fare.
    """
    fare_display = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Journey
        fields = [
            'id',
            'user_id',
            'from_zone',
            'to_zone',
            'fare',
            'timestamp',

        ]
        read_only_fields = ['id', 'timestamp']
    
class JourneyCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a Journey.
    """
    class Meta:
        model = Journey
        fields = ['from_zone', 'to_zone', 'fare']


class JourneyHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for journey history listing.
    """

    class Meta:
        model = Journey
        fields = [
            'id',
            'user_id',
            'from_zone',
            'to_zone',
            'fare',
            'timestamp',

        ]
        read_only_fields = ['id', 'timestamp']

