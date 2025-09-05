// pages/JourneyInputPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zone, JourneyInput } from '../types';
import { apiService } from '../services/api';
import '../styles/JourneyInputPage.css';

interface JourneyInputPageProps {
  userId: string;
}

const JourneyInputPage: React.FC<JourneyInputPageProps> = ({ userId }) => {
  // State Management
  const [zones, setZones] = useState<Zone[]>([]);
  const [journeys, setJourneys] = useState<JourneyInput[]>([
    { from_zone: '', to_zone: '' }
  ]);
  const [existingJourneyCount, setExistingJourneyCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Constants
  const MAX_JOURNEYS_PER_DAY = 20;
  const remainingJourneys = MAX_JOURNEYS_PER_DAY - existingJourneyCount;
  const canAddMoreJourneys = journeys.length < remainingJourneys;

  // Load zones
  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const fetchedZones = await apiService.fetchZones();
      const activeZones = fetchedZones
        .filter(zone => zone.is_active)
        .sort((a, b) => parseInt(a.zone_number) - parseInt(b.zone_number));
      setZones(activeZones);
    } catch (error) {
      setError('Failed to load zones. Using default zones.');
      setZones([
        { id: 1, zone_number: '1', zone_name: 'Zone 1', is_active: true },
        { id: 2, zone_number: '2', zone_name: 'Zone 2', is_active: true },
        { id: 3, zone_number: '3', zone_name: 'Zone 3', is_active: true },
      ]);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // Load user journey count
  const loadUserJourneyCount = useCallback(async () => {
    try {
      const count = await apiService.getUserJourneyCount(userId);
      setExistingJourneyCount(count);
      
      if (count >= MAX_JOURNEYS_PER_DAY) {
        setJourneys([]);
        setError(`You have reached the daily limit of ${MAX_JOURNEYS_PER_DAY} journeys.`);
      }
    } catch (error) {
      console.error('Error loading journey count:', error);
      setExistingJourneyCount(0);
    }
  }, [userId]);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await loadZones();
      await loadUserJourneyCount();
    };
    loadInitialData();
  }, [loadZones, loadUserJourneyCount]);

  // Journey Management Functions
  const addJourney = () => {
    if (canAddMoreJourneys) {
      setJourneys([...journeys, { from_zone: '', to_zone: '' }]);
      setError(null);
    } else {
      setError(`Cannot add more journeys. Daily limit: ${MAX_JOURNEYS_PER_DAY}, Remaining: ${remainingJourneys}`);
    }
  };

  const removeJourney = (index: number) => {
    if (journeys.length > 1) {
      setJourneys(journeys.filter((_, i) => i !== index));
      setError(null);
    }
  };

  const updateJourney = (index: number, field: 'from_zone' | 'to_zone', value: string) => {
    const updated = [...journeys];
    updated[index][field] = value;
    setJourneys(updated);
  };

  const clearAll = () => {
    setJourneys([{ from_zone: '', to_zone: '' }]);
    setError(null);
    setSuccessMessage(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate journeys
    const validJourneys = journeys.filter(j => j.from_zone && j.to_zone);

    if (validJourneys.length === 0) {
      setError('Please enter at least one valid journey');
      return;
    }

    // Check limit
    if (existingJourneyCount + validJourneys.length > MAX_JOURNEYS_PER_DAY) {
      setError(
        `Cannot submit ${validJourneys.length} journeys. ` +
        `You have ${existingJourneyCount} existing journeys today. ` +
        `Maximum ${MAX_JOURNEYS_PER_DAY} allowed per day.`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.calculateFares({
        user_id: userId,
        journeys: validJourneys
      });

      if (response.success && response.data) {
        setSuccessMessage('Fares calculated successfully! Redirecting to results...');
        
        // Store the calculation results in sessionStorage for the results page
        const calculationData = {
          journeys: response.data.journeys,
          totalFare: response.data.total_fare,
          userId: response.data.user_id,
          calculationDate: new Date().toISOString(),
          journeyCount: validJourneys.length
        };
        
        sessionStorage.setItem('fareCalculationResults', JSON.stringify(calculationData));
        
        // Navigate to results page after a short delay
        setTimeout(() => {
          navigate('/results');
        }, 1500);
      } else {
        setError(response.error || 'Failed to calculate fares');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to calculate fares');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = journeys.some(j => j.from_zone && j.to_zone);

  return (
    <div className="journey-input-page">
      <div className="page-header">
        <h1>Journey Entry</h1>
        <p className="page-description">Enter your daily metro journeys to calculate fares</p>
      </div>

      <div className="journey-stats-bar">
        <div className="stat-card">
          <span className="stat-label">Today's Journeys</span>
          <span className="stat-value">{existingJourneyCount}/{MAX_JOURNEYS_PER_DAY}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Remaining</span>
          <span className="stat-value" data-warning={remainingJourneys <= 5}>
            {remainingJourneys}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Form</span>
          <span className="stat-value">{journeys.filter(j => j.from_zone && j.to_zone).length}</span>
        </div>
      </div>

      {/* Warning Banner */}
      {remainingJourneys > 0 && remainingJourneys <= 5 && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <span>Only {remainingJourneys} journey{remainingJourneys !== 1 ? 's' : ''} remaining for today</span>
        </div>
      )}

      {/* Zone Information */}
      {!zonesLoading && zones.length > 0 && (
        <div className="zones-info-card">
          <h3>Available Zones</h3>
          <div className="zones-grid">
            {zones.map(zone => (
              <div key={zone.id} className="zone-chip">
                {zone.zone_name || `Zone ${zone.zone_number}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey Form */}
      <form onSubmit={handleSubmit} className="journey-form">
        <div className="form-header">
          <h2>Journey Details</h2>
          <button
            type="button"
            onClick={clearAll}
            className="btn-text"
          >
            Clear All
          </button>
        </div>

        <div className="journeys-container">
          {journeys.map((journey, index) => (
            <div key={index} className="journey-card">
              <div className="journey-header">
                <span className="journey-number">Journey {index + 1}</span>
                {journeys.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeJourney(index)}
                    className="btn-icon-remove"
                    aria-label="Remove journey"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="journey-fields">
                <div className="field-group">
                  <label htmlFor={`from-${index}`}>From Zone</label>
                  {zonesLoading ? (
                    <div className="loading-placeholder">Loading zones...</div>
                  ) : (
                    <select
                      id={`from-${index}`}
                      value={journey.from_zone}
                      onChange={(e) => updateJourney(index, 'from_zone', e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="">Select Zone</option>
                      {zones.map(zone => (
                        <option key={`from-${zone.id}`} value={zone.zone_number}>
                          {zone.zone_name || `Zone ${zone.zone_number}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="journey-arrow">→</div>

                <div className="field-group">
                  <label htmlFor={`to-${index}`}>To Zone</label>
                  {zonesLoading ? (
                    <div className="loading-placeholder">Loading zones...</div>
                  ) : (
                    <select
                      id={`to-${index}`}
                      value={journey.to_zone}
                      onChange={(e) => updateJourney(index, 'to_zone', e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="">Select Zone</option>
                      {zones.map(zone => (
                        <option key={`to-${zone.id}`} value={zone.zone_number}>
                          {zone.zone_name || `Zone ${zone.zone_number}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Journey Button */}
        <div className="add-journey-section">
          <button
            type="button"
            onClick={addJourney}
            disabled={!canAddMoreJourneys || remainingJourneys === 0}
            className="btn-add-journey"
          >
            <span className="btn-icon">+</span>
            Add Another Journey
          </button>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={!isFormValid || loading || zonesLoading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Calculating...
              </>
            ) : (
              'Calculate Fares'
            )}
          </button>
        </div>
      </form>

      {/* Messages */}
      {error && (
        <div className="message message-error">
          <span className="message-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="message message-success">
          <span className="message-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default JourneyInputPage;