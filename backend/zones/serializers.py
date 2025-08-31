from rest_framework import serializers
from zones.models import Zone

class ZoneSerializer(serializers.ModelSerializer):
    """
    Essential serializer for Zone model.
    Handles serialization and deserialization of Zone data.
    """
    
    class Meta:
        model = Zone
        fields = ['zone_number', 'name', 'description', 'is_active']
    
    def validate_zone_number(self, value):
        """Ensure zone_number is positive."""
        if value < 1 and value > 3:
            raise serializers.ValidationError("Zone number must be at least 1 and less than 4.")
        return value