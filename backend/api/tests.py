import pytest
import json
from rest_framework import status
from rest_framework.test import APIClient
from fare.models import Journey

@pytest.mark.django_db
class TestSingleJourneyAPISimple:
    '''Simple tests for single journey fare calculation.'''
    
    @pytest.fixture(autouse=True)
    def setup(self):
        '''Setup for each test.'''
        self.client = APIClient()
        self.url = '/api/calculate-fare/'
    
    def test_calculate_fare_zone_1_to_2(self):
        '''Test fare from Zone 1 to Zone 2 (should be 55).'''
        response = self.client.post(
            self.url,
            data={'user_id':'1', 'from_zone': '1', 'to_zone': '2'},
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['fare'] == 55
    
    def test_calculate_fare_same_zone(self):
        '''Test fare within same zone.'''
        response = self.client.post(
            self.url,
            data={'user_id':'1', 'from_zone': '1', 'to_zone': '1'},
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['data']['fare'] == 40
    
    def test_calculate_fare_invalid_zone(self):
        '''Test with invalid zone number.'''
        response = self.client.post(
            self.url,
            data={'user_id':'1', 'from_zone': '1', 'to_zone': '5'},
            format='json'
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
    
    def test_calculate_fare_missing_field(self):
        '''Test with missing required field.'''
        response = self.client.post(
            self.url,
            data={'from_zone': '1'},  # Missing to_zone
            format='json'
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
    
    def test_all_fare_combinations(self):
        '''Test all valid fare combinations.'''
        test_cases = [
            ('1', '1', 40),
            ('1', '2', 55),
            ('1', '3', 65),
            ('2', '2', 35),
            ('2', '3', 45),
            ('3', '3', 30),
            ('2', '1', 55),  # Bidirectional
            ('3', '1', 65),  # Bidirectional
            ('3', '2', 45),  # Bidirectional
        ]
        
        for from_zone, to_zone, expected_fare in test_cases:
            response = self.client.post(
                self.url,
                data={'user_id':'1','from_zone': from_zone, 'to_zone': to_zone},
                format='json'
            )
            
            assert response.status_code == 200
            data = response.json()
            actual_fare = data['data']['fare']
            assert actual_fare == expected_fare, \
                f'Zone {from_zone}→{to_zone}: expected {expected_fare}, got {actual_fare}'
            


@pytest.mark.django_db
class TestJourneyPersistence:
    '''Test that journeys are saved to database.'''
    
    @pytest.fixture(autouse=True)
    def setup(self):
        '''Setup for each test.'''
        self.client = APIClient()
        self.url = '/api/calculate-fare/'
    
    def test_journey_saved_on_fare_calculation(self):
        '''Test that calculating fare saves journey to database.'''
        # Check initial count
        initial_count = Journey.objects.count()
        
        # Make fare calculation request
        response = self.client.post(
            self.url,
            data={'user_id':'1', 'from_zone': '1', 'to_zone': '2'},
            format='json'
        )
        
        assert response.status_code == 200
        
        # Check journey was saved
        assert Journey.objects.count() == initial_count + 1
        
        # Get the saved journey
        journey = Journey.objects.latest('timestamp')
        assert journey.from_zone == '1'
        assert journey.to_zone == '2'
        assert journey.fare == 55 
    
    def test_journey_id_returned_in_response(self):
        '''Test that API returns journey ID in response.'''
        response = self.client.post(
            self.url,
            data={'user_id':'1', 'from_zone': '2', 'to_zone': '3'},
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'journey_id' in data['data']
        assert 'timestamp' in data['data']
        
        # Verify journey exists in database
        journey_id = data['data']['journey_id']
        journey = Journey.objects.get(id=journey_id)
        assert journey.fare == 45
    
    
    def test_multiple_journeys_saved(self):
        '''Test that multiple journey calculations are saved.'''
        # Make multiple fare calculations
        journeys_data = [
            {'user_id':'1', 'from_zone': '1', 'to_zone': '1'},  
            {'user_id':'1', 'from_zone': '1', 'to_zone': '2'},  
            {'user_id':'1', 'from_zone': '2', 'to_zone': '3'}, 
        ]
        
        initial_count = Journey.objects.count()
        
        for journey_data in journeys_data:
            response = self.client.post(
                self.url,
                data=journey_data,
                format='json'
            )
            assert response.status_code == 200
        
        # Check all journeys were saved
        assert Journey.objects.count() == initial_count + 3
        
        # Verify fares
        journeys = Journey.objects.order_by('-timestamp')[:3]
        fares = [j.fare for j in journeys]
        assert 40 in fares 
        assert 55 in fares  
        assert 45 in fares  

@pytest.mark.django_db
class TestUserJourneyAPI:
    '''Test user journey history endpoints.'''
    
    @pytest.fixture(autouse=True)
    def setup(self):
        '''Setup for each test.'''
        self.client = APIClient()
        
        # Create test journeys for different users
        self.user1_journeys = [
            Journey.objects.create(user_id='user123', from_zone='1', to_zone='2', fare=55),
            Journey.objects.create(user_id='user123', from_zone='2', to_zone='3', fare=45),
            Journey.objects.create(user_id='user123', from_zone='1', to_zone='1', fare=40),
        ]
        
        self.user2_journeys = [
            Journey.objects.create(user_id='user456', from_zone='1', to_zone='3', fare=65),
            Journey.objects.create(user_id='user456', from_zone='2', to_zone='2', fare=35),
        ]
        
        # Anonymous user journey
        Journey.objects.create(user_id='anonymous', from_zone='3', to_zone='3', fare=30)
    
    def test_calculate_fare_with_user_id(self):
        '''Test fare calculation saves user_id.'''
        response = self.client.post(
            '/api/calculate-fare/',
            data={
                'user_id': 'test_user',
                'from_zone': 1,
                'to_zone': 2
            },
            format='json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['user_id'] == 'test_user'
        
        # Verify saved in database
        journey = Journey.objects.get(id=data['data']['journey_id'])
        assert journey.user_id == 'test_user'
    
    def test_get_user_journey_history(self):
        '''Test retrieving journey history for specific user.'''
        # Test with URL path parameter
        response = self.client.get('/api/users/user123/journeys/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['user_id'] == 'user123'
        assert len(data['journeys']) == 3
