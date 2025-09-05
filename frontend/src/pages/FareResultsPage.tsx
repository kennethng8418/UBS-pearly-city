// pages/FareResultsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FareCalculationState } from '../types';
import '../styles/FareResultsPage.css';

const FareResultsPage: React.FC = () => {
  const [calculationData, setCalculationData] = useState<FareCalculationState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve calculation results from sessionStorage
    const storedData = sessionStorage.getItem('fareCalculationResults');
    
    if (storedData) {
      try {
        const parsedData: FareCalculationState = JSON.parse(storedData);
        setCalculationData(parsedData);
      } catch (error) {
        console.error('Error parsing calculation data:', error);
        navigate('/');
      }
    } else {
      // No data available, redirect to input page
      navigate('/');
    }
  }, [navigate]);

  const handleNewCalculation = () => {
    // Clear the stored results
    sessionStorage.removeItem('fareCalculationResults');
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!calculationData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="fare-results-page">
      <div className="page-header">
        <h1>Fare Calculation Results</h1>
        <p className="page-description">Your journey fare breakdown</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total-fare-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Daily Fare</h3>
            <p className="total-amount">${calculationData.totalFare.toFixed(2)}</p>
          </div>
        </div>

        <div className="summary-card journeys-card">
          <div className="card-icon">🚇</div>
          <div className="card-content">
            <h3>Total Journeys</h3>
            <p className="journey-count">{calculationData.journeyCount}</p>
          </div>
        </div>

        <div className="summary-card average-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Average Fare</h3>
            <p className="average-amount">
              ${(calculationData.totalFare / calculationData.journeyCount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Journey Table */}
      <div className="results-table-container">
        <div className="table-header">
          <h2>Journey Breakdown</h2>
          <div className="table-actions">
            <button onClick={handlePrint} className="btn-secondary">
              🖨️ Print
            </button>
          </div>
        </div>

        <table className="results-table">
          <thead>
            <tr>
              <th>Journey #</th>
              <th>From Zone</th>
              <th>To Zone</th>
              <th>Route</th>
              <th className="text-right">Fare</th>
            </tr>
          </thead>
          <tbody>
            {calculationData.journeys.map((journey, index) => (
              <tr key={index}>
                <td className="journey-number">{index + 1}</td>
                <td>
                  <span className="zone-badge zone-from">
                    Zone {journey.from_zone}
                  </span>
                </td>
                <td>
                  <span className="zone-badge zone-to">
                    Zone {journey.to_zone}
                  </span>
                </td>
                <td className="route">
                  <div className="route-display">
                    <span className="route-from">Z{journey.from_zone}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-to">Z{journey.to_zone}</span>
                  </div>
                </td>
                <td className="fare-cell text-right">
                  <span className="fare-amount">${journey.fare.toFixed(2)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={4} className="text-right">
                <strong>Total Daily Fare</strong>
              </td>
              <td className="text-right">
                <strong className="total-fare-amount">
                  ${calculationData.totalFare.toFixed(2)}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Fare Distribution Chart (Visual Representation) */}
      <div className="fare-distribution">
        <h3>Fare Distribution</h3>
        <div className="distribution-bars">
          {calculationData.journeys.map((journey, index) => {
            const percentage = (journey.fare / calculationData.totalFare) * 100;
            return (
              <div key={index} className="bar-container">
                <div className="bar-label">J{index + 1}</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${percentage}%` }}
                    title={`Journey ${index + 1}: $${journey.fare.toFixed(2)} (${percentage.toFixed(1)}%)`}
                  >
                    <span className="bar-value">${journey.fare}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculation Info */}
      <div className="calculation-info-card">
        <div className="info-row">
          <span className="info-label">User ID:</span>
          <span className="info-value">{calculationData.userId}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Calculation Date:</span>
          <span className="info-value">{formatDate(calculationData.calculationDate)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="page-actions">
        <button onClick={handleNewCalculation} className="btn-primary">
          Calculate New Journeys
        </button>
      </div>
    </div>
  );
};

export default FareResultsPage;