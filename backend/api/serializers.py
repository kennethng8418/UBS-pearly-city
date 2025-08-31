"""
Serializers for API request/response validation.
Simple and focused on the fare calculation use case.
"""
from rest_framework import serializers
from zones.models import Zone


class JourneyInputSerializer(serializers.Serializer):
    """
    Validates a single journey input.
    """
    from_zone = serializers.CharField(required=True)
    to_zone = serializers.CharField(required=True)

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