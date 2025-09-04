// components/JourneyForm.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Zone, JourneyInput, JourneyResult } from '../../types';
import { fareService } from '../../services/api';
import './JourneyForm.css';


const JourneyForm: React.FC = () => {
  // State Management
  const [zones, setZones] = useState<Zone[]>([]);
  const [journeys, setJourneys] = useState<JourneyInput[]>([
    { from_zone: '', to_zone: '' }
  ]);
  const [fareResults, setFareResults] = useState<JourneyResult[] | null>(null);
  const [totalFare, setTotalFare] = useState<number>(0);
  const [existingJourneyCount, setExistingJourneyCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Constants
  const MAX_JOURNEYS_PER_DAY = 20;
  const remainingJourneys = MAX_JOURNEYS_PER_DAY - existingJourneyCount;
  const canAddMoreJourneys = journeys.length < remainingJourneys;
  const USERID = '1'


  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const fetchedZones = await fareService.fetchZones();
      const activeZones = fetchedZones
        .filter(zone => zone.is_active)
        .sort((a, b) => parseInt(a.zone_number) - parseInt(b.zone_number));
      setZones(activeZones);
    } catch (error) {
      setError('Failed to load zones. Please refresh the page.');
      // Set default zones as fallback
      setZones([
        { id: 1, zone_number: '1', zone_name: 'Zone 1', is_active: true },
        { id: 2, zone_number: '2', zone_name: 'Zone 2', is_active: true },
        { id: 3, zone_number: '3', zone_name: 'Zone 3', is_active: true },
      ]);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // Load user journey count using useCallback
  const loadUserJourneyCount = useCallback(async () => {
    try {
      const count = await fareService.getUserJourneyCount(USERID);
      setExistingJourneyCount(count);
      
      // Adjust initial journeys if user has reached the limit
      if (count >= MAX_JOURNEYS_PER_DAY) {
        setJourneys([]);
        setError(`You have already made ${count} journeys today. Maximum ${MAX_JOURNEYS_PER_DAY} journeys allowed per day.`);
      }
    } catch (error) {
      console.error('Error loading journey count:', error);
      setExistingJourneyCount(0);
    }
  }, []); // USERID is a constant, so we don't need it in dependencies

  // Load zones and journey count on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load zones
        await loadZones();
        // Load existing journey count for the user
        await loadUserJourneyCount();
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [loadZones, loadUserJourneyCount]); // Include the memoized functions in dependencies


  const addJourney = () => {
    if (canAddMoreJourneys) {
      setJourneys([...journeys, { from_zone: '', to_zone: '' }]);
      setError(null);
    } else {
      setError(`Cannot add more journeys. You have ${existingJourneyCount} existing journeys today. Maximum ${MAX_JOURNEYS_PER_DAY} allowed.`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Filter out empty journeys
    const validJourneys = journeys.filter(j => j.from_zone && j.to_zone);

    if (validJourneys.length === 0) {
      setError('Please enter at least one valid journey');
      return;
    }

    // Check if adding these journeys would exceed the limit
    if (existingJourneyCount + validJourneys.length > MAX_JOURNEYS_PER_DAY) {
      setError(
        `Cannot submit ${validJourneys.length} journeys. ` +
        `You have ${existingJourneyCount} existing journeys today. ` +
        `Maximum ${MAX_JOURNEYS_PER_DAY} journeys allowed per day.`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fareService.calculateFares({
        user_id: USERID,
        journeys: validJourneys
      });

      if (response.success && response.data) {
        setFareResults(response.data.journeys);
        setTotalFare(response.data.total_fare);
        setSuccessMessage('Fares calculated successfully!');
        
        // Update journey count after successful submission
        setExistingJourneyCount(existingJourneyCount + validJourneys.length);
        
        // Reset form after successful submission
        setTimeout(() => {
          if (existingJourneyCount + validJourneys.length >= MAX_JOURNEYS_PER_DAY) {
            setJourneys([]);
            setError(`Daily limit of ${MAX_JOURNEYS_PER_DAY} journeys reached.`);
          } else {
            setJourneys([{ from_zone: '', to_zone: '' }]);
          }
        }, 2000);
      } else {
        setError(response.error || 'Failed to calculate fares');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to calculate fares');
      setFareResults(null);
      setTotalFare(0);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJourneys([{ from_zone: '', to_zone: '' }]);
    setFareResults(null);
    setTotalFare(0);
    setError(null);
    setSuccessMessage(null);
    loadUserJourneyCount(); // Refresh journey count
  };

  const isFormValid = journeys.some(j => j.from_zone && j.to_zone);

  return (
    <div className="journey-form-container">
      <div className="form-section">
        <div className="form-header">
          <h2>Journey Entry Form</h2>
          <div className="journey-stats">
            <div className="stat-item">
              <span className="stat-label">Today's Journeys:</span>
              <span className="stat-value">{existingJourneyCount}/{MAX_JOURNEYS_PER_DAY}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">{remainingJourneys}</span>
            </div>
          </div>
        </div>

        {/* Warning if approaching limit */}
        {remainingJourneys > 0 && remainingJourneys <= 5 && (
          <div className="warning-banner">
            ⚠️ You can only add {remainingJourneys} more journey{remainingJourneys !== 1 ? 's' : ''} today
          </div>
        )}

        {/* Zone availability */}
        {!zonesLoading && zones.length > 0 && (
          <div className="zones-available">
            <strong>Available Zones:</strong> {zones.map(z => z.zone_name || `Zone ${z.zone_number}`).join(', ')}
          </div>
        )}

        {/* Journey Form */}
        <form onSubmit={handleSubmit}>
          <div className="journeys-list">
            {journeys.map((journey, index) => (
              <div key={index} className="journey-item">
                <span className="journey-number">#{index + 1}</span>
                
                <div className="form-field">
                  <label>From Zone</label>
                  {zonesLoading ? (
                    <div className="loading-select">Loading...</div>
                  ) : (
                    <select
                      value={journey.from_zone}
                      onChange={(e) => updateJourney(index, 'from_zone', e.target.value)}
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

                <div className="form-field">
                  <label>To Zone</label>
                  {zonesLoading ? (
                    <div className="loading-select">Loading...</div>
                  ) : (
                    <select
                      value={journey.to_zone}
                      onChange={(e) => updateJourney(index, 'to_zone', e.target.value)}
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

                {journeys.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeJourney(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={addJourney}
              disabled={!canAddMoreJourneys || remainingJourneys === 0}
              className="btn btn-secondary"
            >
              Add Journey
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid || loading || zonesLoading}
              className="btn btn-primary"
            >
              {loading ? 'Calculating...' : 'Calculate Fares'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="message success-message">
            {successMessage}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="results-section">
        <h2>Fare Calculation Results</h2>
        
        {!fareResults ? (
          <div className="empty-results">
            <p>No calculations yet</p>
            <small>Submit journeys to see fare calculations</small>
          </div>
        ) : (
          <>
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>From Zone</th>
                  <th>To Zone</th>
                  <th>Fare ($)</th>
                </tr>
              </thead>
              <tbody>
                {fareResults.map((result, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>Zone {result.from_zone}</td>
                    <td>Zone {result.to_zone}</td>
                    <td className="fare-amount">${result.fare.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={3}>Total Daily Fare</td>
                  <td className="total-fare">${totalFare.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="results-summary">
              <p>User ID: {USERID}</p>
              <p>Total Journeys Calculated: {fareResults.length}</p>
              <p>Total Journeys Today: {existingJourneyCount}/{MAX_JOURNEYS_PER_DAY}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JourneyForm;