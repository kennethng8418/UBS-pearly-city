/**
 * API service for communicating with the Django backend
 */
import {ZoneListResponse, FareCalculationRequest, FareCalculationResponse } from '../types/index';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getZones(): Promise<ZoneListResponse> {
    return this.request<ZoneListResponse>('/zones/', {
        method: 'GET',
      });
  }

  async calculateFare(request: FareCalculationRequest): Promise<FareCalculationResponse> {
    return this.request<FareCalculationResponse>('/calculate-fare/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService();