// services/apiService.ts

import {
    Zone,
    ZoneListResponse,
    FareCalculationRequest,
    FareCalculationResponse,
    JourneyCountResponse
  } from '../types';
  
  // API Base URL - can be configured via environment variable
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  
  // Journey History Types
  interface JourneyRecord {
    id: string;
    user_id: string;
    from_zone: string;
    to_zone: string;
    fare: number;
    timestamp: string;
  }
  
  interface JourneyHistoryResponse {
    success: boolean;
    user_id: string;
    journeys: JourneyRecord[];
    count: number;
  }
  
  /**
   * API Service Class
   * Handles all communication with the Django backend
   */
  class ApiService {
    private baseURL: string;
  
    constructor(baseURL: string = API_BASE_URL) {
      this.baseURL = baseURL;
    }
  
    /**
     * Helper method to handle API responses
     */
    private async handleResponse<T>(response: Response): Promise<T> {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  
    /**
     * Fetch all active zones from the backend
     * GET /api/zones/
     */
    async fetchZones(): Promise<Zone[]> {
      try {
        const response = await fetch(`${this.baseURL}/zones/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        const data: ZoneListResponse = await this.handleResponse(response);
  
        if (!data.success) {
          throw new Error('Failed to fetch zones from server');
        }
  
        return data.zones || [];
      } catch (error) {
        console.error('Error fetching zones:', error);
        throw error;
      }
    }
  
    /**
     * Get today's journey count for a specific user
     * GET /api/users/{user_id}/journeys/count
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
          console.warn(`Failed to fetch journey count: ${response.statusText}`);
          return 0;
        }
  
        const data: JourneyCountResponse = await response.json();
        return data.count || 0;
      } catch (error) {
        console.error('Error fetching journey count:', error);
        // Return 0 if there's an error to allow the app to continue functioning
        return 0;
      }
    }
  
    /**
     * Get complete journey history for a specific user
     * GET /api/users/{user_id}/journeys/
     */
    async getUserJourneyHistory(userId: string): Promise<JourneyHistoryResponse> {
      try {
        const response = await fetch(
          `${this.baseURL}/users/${userId}/journeys/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        const data: JourneyHistoryResponse = await this.handleResponse(response);
  
        if (!data.success) {
          throw new Error('Failed to fetch journey history from server');
        }
  
        // Ensure journeys is always an array
        return {
          ...data,
          journeys: data.journeys || []
        };
      } catch (error) {
        console.error('Error fetching journey history:', error);
        throw error;
      }
    }
  
    /**
     * Calculate fares for a batch of journeys
     * POST /api/calculate-fare/
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
  
        // Handle specific error status codes
        if (response.status === 429) {
          throw new Error(data.error || 'Maximum journeys per day exceeded');
        }
  
        if (!response.ok) {
          throw new Error(
            data.error || 
            data.errors ? JSON.stringify(data.errors) : 
            `Calculation failed: ${response.statusText}`
          );
        }
  
        if (!data.success) {
          throw new Error(data.error || 'Fare calculation failed');
        }
  
        return data;
      } catch (error) {
        console.error('Error calculating fares:', error);
        throw error;
      }
    }
  
    /**
     * Get fare rules (optional - if you have this endpoint)
     * GET /api/fare-rules/
     */
    async getFareRules(): Promise<any> {
      try {
        const response = await fetch(`${this.baseURL}/api/fare-rules/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        const data = await this.handleResponse(response);
        return data;
      } catch (error) {
        console.error('Error fetching fare rules:', error);
        throw error;
      }
    }
  
    /**
     * Health check endpoint (optional)
     * Can be used to verify API connectivity
     */
    async healthCheck(): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseURL}/api/health/`, {
          method: 'GET',
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }
  
  // Create and export a singleton instance
  export const apiService = new ApiService();
  
  // Also export the class for testing or creating custom instances
  export default ApiService;