// pages/JourneyHistoryPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/api';
import '../styles/JourneyHistoryPage.css';

interface JourneyRecord {
  id: string;
  user_id: string;
  from_zone: string;
  to_zone: string;
  fare: number;
  timestamp: string;
}

interface FilterConfig {
  operator: '>' | '<' | '=' | '';
  value: string;
}

interface SortConfig {
  key: keyof JourneyRecord | null;
  direction: 'asc' | 'desc';
}

interface JourneyHistoryPageProps {
  userId: string;
}

const JourneyHistoryPage: React.FC<JourneyHistoryPageProps> = ({ userId }) => {
  const [journeys, setJourneys] = useState<JourneyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc'
  });
  
  // Filter state
  const [priceFilter, setPriceFilter] = useState<FilterConfig>({
    operator: '',
    value: ''
  });
  const [zoneFilter, setZoneFilter] = useState<{
    fromZone: string;
    toZone: string;
  }>({
    fromZone: '',
    toZone: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Load user journey count


  const loadJourneyHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserJourneyHistory(userId);
      setJourneys(response.journeys || []);
    } catch (err) {
      setError('Failed to load journey history. Please try again.');
      console.error('Error loading journey history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Sorting function
  const handleSort = (key: keyof JourneyRecord) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await loadJourneyHistory();
    };
    loadInitialData();
  }, [loadJourneyHistory]);
  // Apply filters and sorting
  const processedJourneys = useMemo(() => {
    let filtered = [...journeys];
    
    // Apply price filter
    if (priceFilter.operator && priceFilter.value) {
      const filterValue = parseFloat(priceFilter.value);
      if (!isNaN(filterValue)) {
        filtered = filtered.filter(journey => {
          switch (priceFilter.operator) {
            case '>':
              return journey.fare > filterValue;
            case '<':
              return journey.fare < filterValue;
            case '=':
              return journey.fare === filterValue;
            default:
              return true;
          }
        });
      }
    }
    
    // Apply zone filters
    if (zoneFilter.fromZone) {
      filtered = filtered.filter(j => j.from_zone === zoneFilter.fromZone);
    }
    if (zoneFilter.toZone) {
      filtered = filtered.filter(j => j.to_zone === zoneFilter.toZone);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [journeys, sortConfig, priceFilter, zoneFilter]);

  // Pagination
  const paginatedJourneys = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedJourneys.slice(startIndex, endIndex);
  }, [processedJourneys, currentPage]);

  const totalPages = Math.ceil(processedJourneys.length / itemsPerPage);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = processedJourneys.reduce((sum, j) => sum + j.fare, 0);
    const average = processedJourneys.length > 0 ? total / processedJourneys.length : 0;
    
    const zoneFrequency = processedJourneys.reduce((acc, j) => {
      const route = `${j.from_zone}-${j.to_zone}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonRoute = Object.entries(zoneFrequency)
      .sort(([, a], [, b]) => b - a)[0];
    
    return {
      totalFare: total,
      averageFare: average,
      journeyCount: processedJourneys.length,
      mostCommonRoute: mostCommonRoute ? mostCommonRoute[0] : 'N/A'
    };
  }, [processedJourneys]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setPriceFilter({ operator: '', value: '' });
    setZoneFilter({ fromZone: '', toZone: '' });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'From Zone', 'To Zone', 'Fare'];
    const rows = processedJourneys.map(j => [
      formatDate(j.timestamp),
      `Zone ${j.from_zone}`,
      `Zone ${j.to_zone}`,
      `$${j.fare.toFixed(2)}`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading journey history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadJourneyHistory} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="journey-history-page">
      <div className="page-header">
        <h1>Journey History</h1>
        <p className="page-description">View and analyze your travel history</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>Total Journeys</h4>
            <p className="stat-value">{statistics.journeyCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h4>Total Spent</h4>
            <p className="stat-value">${statistics.totalFare.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Average Fare</h4>
            <p className="stat-value">${statistics.averageFare.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚇</div>
          <div className="stat-content">
            <h4>Most Common Route</h4>
            <p className="stat-value">{statistics.mostCommonRoute}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Price Filter</label>
            <div className="filter-controls">
              <select
                value={priceFilter.operator}
                onChange={(e) => setPriceFilter({
                  ...priceFilter,
                  operator: e.target.value as FilterConfig['operator']
                })}
                className="filter-select"
              >
                <option value="">No filter</option>
                <option value=">">Greater than</option>
                <option value="<">Less than</option>
                <option value="=">Equal to</option>
              </select>
              <input
                type="number"
                value={priceFilter.value}
                onChange={(e) => setPriceFilter({
                  ...priceFilter,
                  value: e.target.value
                })}
                placeholder="Amount"
                className="filter-input"
                disabled={!priceFilter.operator}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>From Zone</label>
            <select
              value={zoneFilter.fromZone}
              onChange={(e) => setZoneFilter({
                ...zoneFilter,
                fromZone: e.target.value
              })}
              className="filter-select"
            >
              <option value="">All zones</option>
              <option value="1">Zone 1</option>
              <option value="2">Zone 2</option>
              <option value="3">Zone 3</option>
            </select>
          </div>

          <div className="filter-group">
            <label>To Zone</label>
            <select
              value={zoneFilter.toZone}
              onChange={(e) => setZoneFilter({
                ...zoneFilter,
                toZone: e.target.value
              })}
              className="filter-select"
            >
              <option value="">All zones</option>
              <option value="1">Zone 1</option>
              <option value="2">Zone 2</option>
              <option value="3">Zone 3</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn-clear">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table Actions */}
      <div className="table-actions">
        <div className="results-count">
          Showing {paginatedJourneys.length} of {processedJourneys.length} journeys
        </div>
        <button onClick={exportToCSV} className="btn-export">
          📥 Export CSV
        </button>
      </div>

      {/* Journey Table */}
      <div className="table-container">
        <table className="journey-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')} className="sortable">
                Date/Time
                {sortConfig.key === 'timestamp' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('from_zone')} className="sortable">
                From Zone
                {sortConfig.key === 'from_zone' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('to_zone')} className="sortable">
                To Zone
                {sortConfig.key === 'to_zone' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Route</th>
              <th onClick={() => handleSort('fare')} className="sortable text-right">
                Fare
                {sortConfig.key === 'fare' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedJourneys.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-message">
                  No journeys found matching your filters
                </td>
              </tr>
            ) : (
              paginatedJourneys.map((journey, index) => (
                <tr key={`${journey.id}-${index}`}>
                  <td>{formatDate(journey.timestamp)}</td>
                  <td>
                    <span className="zone-badge from-zone">Zone {journey.from_zone}</span>
                  </td>
                  <td>
                    <span className="zone-badge to-zone">Zone {journey.to_zone}</span>
                  </td>
                  <td>
                    <div className="route-display">
                      <span>Z{journey.from_zone}</span>
                      <span className="route-arrow">→</span>
                      <span>Z{journey.to_zone}</span>
                    </div>
                  </td>
                  <td className="text-right fare-cell">
                    <span className="fare-amount">${journey.fare.toFixed(2)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return page === 1 || 
                       page === totalPages || 
                       Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] < page - 1 && (
                    <span className="page-ellipsis">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JourneyHistoryPage;