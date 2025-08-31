import pytest
import json
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestSingleJourneyAPISimple:
    """Simple tests for single journey fare calculation."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test."""
        self.client = APIClient()
        self.url = '/api/calculate-fare/'
    
    def test_calculate_fare_zone_1_to_2(self):
        """Test fare from Zone 1 to Zone 2 (should be 55)."""
        response = self.client.post(
            self.url,
            data={'from_zone': "1", 'to_zone': "2"},
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['fare'] == 55
    
    def test_calculate_fare_same_zone(self):
        """Test fare within same zone."""
        response = self.client.post(
            self.url,
            data={'from_zone': "1", 'to_zone': "1"},
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['data']['fare'] == 40
    
    def test_calculate_fare_invalid_zone(self):
        """Test with invalid zone number."""
        response = self.client.post(
            self.url,
            data={'from_zone': "1", 'to_zone': "5"},
            format='json'
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
    
    def test_calculate_fare_missing_field(self):
        """Test with missing required field."""
        response = self.client.post(
            self.url,
            data={'from_zone': "1"},  # Missing to_zone
            format='json'
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
    
    def test_all_fare_combinations(self):
        """Test all valid fare combinations."""
        test_cases = [
            ("1", "1", 40),
            ("1", "2", 55),
            ("1", "3", 65),
            ("2", "2", 35),
            ("2", "3", 45),
            ("3", "3", 30),
            ("2", "1", 55),  # Bidirectional
            ("3", "1", 65),  # Bidirectional
            ("3", "2", 45),  # Bidirectional
        ]
        
        for from_zone, to_zone, expected_fare in test_cases:
            response = self.client.post(
                self.url,
                data={'from_zone': from_zone, 'to_zone': to_zone},
                format='json'
            )
            
            assert response.status_code == 200
            data = response.json()
            actual_fare = data['data']['fare']
            assert actual_fare == expected_fare, \
                f"Zone {from_zone}→{to_zone}: expected {expected_fare}, got {actual_fare}"