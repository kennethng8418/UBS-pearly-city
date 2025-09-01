"""
Test Zone model with missing name using Django test database.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from zones.models import Zone 


@pytest.mark.django_db
class TestZoneMissingName:
    """Test Zone model behavior when name is missing."""
    
    @pytest.mark.parametrize(
        "zone_data,should_fail,error_type,error_message",
        [
            # Empty string as name (should be valid if CharField allows blank)
            (
                {"zone_number": "Zone_1", "name": ""},
                False,  # This depends on your model's blank=True setting
                None,
                None
            ),
            # Whitespace only name
            (
                {"zone_number": "Zone_1", "name": "   "},
                False,  # Valid but might want to add custom validation
                None,
                None
            ),
            # Valid name (control case)
            (
                {"zone_number": "Zone_1", "name": "Central"},
                False,
                None,
                None
            ),
        ],
        ids=[
            "empty_string_name",
            "whitespace_only_name",
            "valid_name"
        ]
    )
    def test_zone_missing_name(self, zone_data, should_fail, error_type, error_message):
        """
        Test Zone creation with various name scenarios.
        
        Args:
            zone_data: Dictionary with zone fields
            should_fail: Whether the test should raise an exception
            error_type: Expected exception type
            error_message: Part of expected error message
        """
        if should_fail:
            with pytest.raises(error_type) as exc_info:
                Zone.objects.create(**zone_data)
            
            if error_message:
                assert error_message in str(exc_info.value).lower()
        else:
            # Should create successfully
            zone = Zone.objects.create(**zone_data)
            assert zone.id is not None
            assert zone.zone_number == zone_data["zone_number"]
            
            # Clean up
            zone.delete()


    
    def test_zone_name_required_validation(self):
        """Test that name field is required at validation level."""
        zone = Zone(zone_number=1)
        
        with pytest.raises(ValidationError) as exc_info:
            zone.full_clean()
        
        # Check that 'name' field has validation error
        assert 'name' in exc_info.value.message_dict
        error_messages = exc_info.value.message_dict['name']
        assert any('required' in str(msg).lower() or 'blank' in str(msg).lower() 
                  for msg in error_messages)
    
    @pytest.mark.parametrize(
        "zone_number,name",
        [
            ("1", "Valid Zone"),
            ("1", "A"),  # Single character
            ("3", "Zone 3 - Outer Ring with Description"),  # Long but valid
        ]
    )
    def test_zone_valid_names(self, zone_number, name):
        """Test that valid names work correctly."""
        zone = Zone.objects.create(
            zone_number=zone_number,
            name=name
        )
        
        assert zone.name == name
        assert zone.zone_number == zone_number
        assert str(zone) == f"Zone {zone_number}: {name}"
        
        # Clean up
        zone.delete()


