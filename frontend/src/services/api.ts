
import {
    Zone,
    ZoneListResponse,
    FareCalculationRequest,
    FareCalculationResponse,
    JourneyCountResponse
  } from '../types';
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  
  class FareService {
    private baseURL: string;
  
    constructor(baseURL: string = API_BASE_URL) {
      this.baseURL = baseURL;
    }
  
    /**
     * Fetch all active zones from the backend
     */
    async fetchZones(): Promise<Zone[]> {
      try {
        const response = await fetch(`${this.baseURL}/zones/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch zones: ${response.statusText}`);
        }
  
        const data: ZoneListResponse = await response.json();
  
        if (!data.success) {
          throw new Error('Failed to fetch zones from server');
        }
  
        return data.zones;
      } catch (error) {
        console.error('Error fetching zones:', error);
        throw error;
      }
    }
  
    /**
     * Get today's journey count for a specific user
     */
    async getUserJourneyCount(userId: string): Promise<number> {
      try {
        const response = await fetch(
          `${this.baseURL}/users/${userId}/journeys/count`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        if (!response.ok) {
          throw new Error(`Failed to fetch journey count: ${response.statusText}`);
        }
  
        const data: JourneyCountResponse = await response.json();
        return data.count;
      } catch (error) {
        console.error('Error fetching journey count:', error);
        // Return 0 if there's an error fetching the count
        return 0;
      }
    }
  
    /**
     * Calculate fares for a batch of journeys
     */
    async calculateFares(request: FareCalculationRequest): Promise<FareCalculationResponse> {
      try {
        const response = await fetch(`${this.baseURL}/calculate-fare/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
  
        const data: FareCalculationResponse = await response.json();
  
        // Handle different error status codes
        if (response.status === 429) {
          throw new Error(data.error || 'Maximum journeys per day exceeded');
        }
  
        if (!response.ok) {
          throw new Error(data.error || `Calculation failed: ${response.statusText}`);
        }
  
        return data;
      } catch (error) {
        console.error('Error calculating fares:', error);
        throw error;
      }
    }
  }
  
  // Export a singleton instance
  export const fareService = new FareService();
  
  // Also export the class for testing purposes
  export default FareService;