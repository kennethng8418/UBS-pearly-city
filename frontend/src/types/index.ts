export interface Zone {
  id: number;
  zone_number: string;
  zone_name: string;
  is_active: boolean;
}

export interface ZoneListResponse {
  success: boolean;
  zones: Zone[];
  count: number;
}

export interface JourneyInput {
  from_zone: string;
  to_zone: string;
}

export interface JourneyResult {
  from_zone: string;
  to_zone: string;
  fare: number;
}

export interface FareCalculationRequest {
  user_id: string;
  journeys: JourneyInput[];
}

export interface FareCalculationResponse {
  success: boolean;
  data?: {
    user_id: string;
    journeys: JourneyResult[];
    total_fare: number;
  };
  error?: string;
  errors?: any;
}

export interface JourneyCountResponse {
  count: number;
}

export interface ErrorResponse {
  success: boolean;
  error?: string;
  errors?: any;
}