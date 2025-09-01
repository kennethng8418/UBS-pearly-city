import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Zone, FareCalculationRequest, FareCalculationResponse } from '../../types';
import './FareCalculator.css';

const FareCalculator: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [fromZone, setFromZone] = useState<string>('');
  const [toZone, setToZone] = useState<string>('');
  const [userId, setUserId] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [result, setResult] = useState<FareCalculationResponse | null>(null);
  const [error, setError] = useState<string>('');

  // Fetch zones on component mount
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getZones();
      if (response.success) {
        setZones(response.zones);
      } else {
        setError('Failed to load zones');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please ensure the API is running.');
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromZone || !toZone) {
      setError('Please select both from and to zones');
      return;
    }
    setUserId('1')
    setCalculating(true);
    setError('');
    setResult(null);

    const request: FareCalculationRequest = {
      from_zone: parseInt(fromZone),
      to_zone: parseInt(toZone),
    };

    if (userId.trim()) {
      request.user_id = userId.trim();
    }

    try {
      const response = await apiService.calculateFare(request);
      setResult(response);
    } catch (err) {
        const message = String(err);
        if (message.includes("429") ) {
            setError('User has reach 20 requests per day. Please retry the next day.');
            console.error("Too many requests. Please retry later.");
        }
        else {
            setError('Failed to calculate fare. Please try again.');
            console.error('Error calculating fare:', err);
        }
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    setFromZone('');
    setToZone('');
    setResult(null);
    setError('');
  };

  return (
    <div className="fare-calculator">
      <div className="calculator-card">
        <h2 className="calculator-title">🚇 PearlCard Fare Calculator</h2>
        <p className="calculator-subtitle">Calculate your journey fare between zones</p>

        <form onSubmit={handleSubmit} className="fare-form">

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fromZone" className="form-label">
                From Zone *
              </label>
              <select
                id="fromZone"
                className="form-select"
                value={fromZone}
                onChange={(e) => setFromZone(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select starting zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_number} value={zone.zone_number}>
                    Zone {zone.zone_number} - {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="toZone" className="form-label">
                To Zone *
              </label>
              <select
                id="toZone"
                className="form-select"
                value={toZone}
                onChange={(e) => setToZone(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select destination zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_number} value={zone.zone_number}>
                    Zone {zone.zone_number} - {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={calculating || loading}
            >
              {calculating ? 'Calculating...' : 'Calculate Fare'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={calculating}
            >
              Reset
            </button>
          </div>
        </form>

        {result && result.success && (
          <div className="result-card">
            <h3 className="result-title">Journey Fare</h3>
            <div className="result-content">
              <div className="journey-route">
                <span className="zone-badge from">Zone {result.data.from_zone}</span>
                <span className="arrow">→</span>
                <span className="zone-badge to">Zone {result.data.to_zone}</span>
              </div>
              <div className="fare-amount">
                {result.data.fare}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FareCalculator;