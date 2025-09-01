/**
 * Type definitions for the PearlCard application
 */

export interface Zone {
  zone_number: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ZoneListResponse {
  success: boolean;
  zones: Zone[];
  count: number;
}

export interface FareCalculationRequest {
  from_zone: number;
  to_zone: number;
  user_id?: string;
}

export interface FareCalculationResponse {
  success: boolean;
  data: {
    from_zone: number;
    to_zone: number;
    fare: number;
    journey_id?: number;
    timestamp?: string;
    user_id?: string;
  };
  journey?: {
    id: number;
    user_id?: string;
    from_zone: string;
    to_zone: string;
    fare: number;
    fare_display: number;
    timestamp: string;
  };
}

