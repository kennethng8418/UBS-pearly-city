"""
Simple fare calculator for PearlCard system.
No database required - uses hardcoded fare rules as per requirements.
"""
from typing import List, Dict, Tuple
from decimal import Decimal


class SimpleFareCalculator:
    """
    Simple, efficient fare calculator for PearlCard system.
    
    Fare Rules (as per requirements):
    - Zone 1 to 1: 40
    - Zone 1 to 2 (bidirectional): 55
    - Zone 1 to 3 (bidirectional): 65
    - Zone 2 to 2: 35
    - Zone 2 to 3 (bidirectional): 45
    - Zone 3 to 3: 30
    
    This implementation:
    - Uses no database queries (fast)
    - Easy to test
    - Clear business logic
    - Can be extended if requirements change
    """
    
    # Valid zone numbers
    VALID_ZONES = {"1", "2", "3"}
    
    # Fare for same zone travel
    SAME_ZONE_FARES = {
        "1": 40,
        "2": 35,
        "3": 30
    }
    
    # Fare for different zone travel (bidirectional)
    DIFFERENT_ZONE_FARES = {
        ("1", "2"): 55,  # Zone 1 <-> Zone 2
        ("1", "3"): 65,  # Zone 1 <-> Zone 3
        ("2", "3"): 45,  # Zone 2 <-> Zone 3
    }
    
    @classmethod
    def calculate_single_fare(cls, from_zone: int, to_zone: int) -> int:
        """
        Calculate fare for a single journey.
        
        Args:
            from_zone: Starting zone number (1-3)
            to_zone: Destination zone number (1-3)
            
        Returns:
                    {
            "from_zone": "1",
            "to_zone": "2",
            "fare": 55,

        }
            
        Raises:
            ValueError: If zones are invalid
        """
        # Validate zones
        if from_zone not in cls.VALID_ZONES:
            raise ValueError(f"Invalid from_zone: {from_zone}. Must be 1, 2, or 3")
        if to_zone not in cls.VALID_ZONES:
            raise ValueError(f"Invalid to_zone: {to_zone}. Must be 1, 2, or 3")
        
        # Same zone travel
        if from_zone == to_zone:
            return cls.SAME_ZONE_FARES[from_zone]
        
        
        # Different zone travel (handle bidirectional by sorting)
        zone_pair = tuple(sorted([from_zone, to_zone]))
        return cls.DIFFERENT_ZONE_FARES[zone_pair]

    @classmethod
    def calculate_batch_fares(cls, journeys: List[Dict]) -> Dict:
        """
        Calculate fares for multiple journeys (max 20).
        
        Args:
            journeys: List of journey dicts with 'from_zone' and 'to_zone'
            
        Returns:
            Dictionary containing:
            - journeys: List of journey details with calculated fares
            - fare: Sum of all fares
            - journey_count: Number of journeys processed
            
        Example:
            Input: [{'from_zone': 1, 'to_zone': 2}, {'from_zone': 2, 'to_zone': 3}]
            Output: {
                'journeys': [
                    {'journey_number': 1, 'from_zone': 1, 'to_zone': 2, 'fare': 55, 'status': 'success'},
                    {'journey_number': 2, 'from_zone': 2, 'to_zone': 3, 'fare': 45, 'status': 'success'}
                ],
                'fare': 100,
                'journey_count': 2
            }
        """
        # Limit to 20 journeys as per requirements
        if len(journeys) > 20:
            journeys = journeys[:20]
        
        results = []
        total_fare = 0
        
        for idx, journey in enumerate(journeys, 1):
            try:
                # Extract zones
                from_zone = journey.get('from_zone')
                to_zone = journey.get('to_zone')
                
                # Validate input exists
                if from_zone is None or to_zone is None:
                    raise ValueError("Missing from_zone or to_zone")
                
                # Calculate fare
                fare = cls.calculate_single_fare(from_zone, to_zone)
                
                # Add to results
                results.append({
                    'journey_number': idx,
                    'from_zone': from_zone,
                    'to_zone': to_zone,
                    'fare': fare,
                    'status': 'success'
                })
                total_fare += fare
                
            except (ValueError, TypeError, KeyError) as e:
                # Handle errors gracefully
                results.append({
                    'journey_number': idx,
                    'from_zone': journey.get('from_zone'),
                    'to_zone': journey.get('to_zone'),
                    'fare': 0.0,
                    'status': 'error',
                    'error_message': str(e)
                })
        
        return {
            'journeys': results,
            'total_fare': total_fare,
            'journey_count': len(results)
        }
    
    @classmethod
    def get_all_fare_rules(cls) -> List[Dict]:
        """
        Get all fare rules in a structured format.
        Useful for displaying fare table in UI.
        
        Returns:
            List of fare rules
        """
        rules = []
        
        # Add same zone fares
        for zone, fare in cls.SAME_ZONE_FARES.items():
            rules.append({
                'from_zone': zone,
                'to_zone': zone,
                'fare': fare,
                'route': f"Zone {zone} → Zone {zone}"
            })
        
        # Add different zone fares
        for (from_zone, to_zone), fare in cls.DIFFERENT_ZONE_FARES.items():
            # Add both directions since fares are bidirectional
            rules.append({
                'from_zone': from_zone,
                'to_zone': to_zone,
                'fare': fare,
                'route': f"Zone {from_zone} → Zone {to_zone}"
            })
            rules.append({
                'from_zone': to_zone,
                'to_zone': from_zone,
                'fare': fare,
                'route': f"Zone {to_zone} → Zone {from_zone}"
            })
        
        return sorted(rules, key=lambda x: (x['from_zone'], x['to_zone']))

