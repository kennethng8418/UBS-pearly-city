// App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import JourneyInputPage from './pages/JourneyInputPage';
import FareResultsPage from './pages/FareResultsPage';
import JourneyHistoryPage from './pages/JourneyHistoryPage';
import './App.css';

// Navigation component with active link highlighting
const Navigation: React.FC<{ userId: string }> = ({ userId }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };
  
  return (
    <nav className="app-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🚇 PearlCard Metro</h1>
        </div>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>
            Journey Entry
          </Link>
          <Link to="/results" className={isActive('/results')}>
            Results
          </Link>
          <Link to="/history" className={isActive('/history')}>
            History
          </Link>
        </div>
        <div className="nav-user">
          <span className="user-badge">
            ID: {userId ? userId.substring(0, 12) + '...' : 'Loading...'}
          </span>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const userId = '1';


  return (
    <Router>
      <div className="app">
        {/* Navigation Header */}
        <Navigation userId={userId} />

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={
                userId ? (
                  <JourneyInputPage userId={userId} />
                ) : (
                  <div className="loading-page">Loading...</div>
                )
              } 
            />
            <Route 
              path="/results" 
              element={<FareResultsPage />} 
            />
            <Route 
              path="/history" 
              element={
                userId ? (
                  <JourneyHistoryPage userId={userId} />
                ) : (
                  <div className="loading-page">Loading...</div>
                )
              } 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-content">
              <div className="footer-section">
                <h4>Quick Actions</h4>
                <ul className="footer-links">
                  <li><Link to="/">New Journey</Link></li>
                  <li><Link to="/results">View Last Results</Link></li>
                  <li><Link to="/history">Journey History</Link></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Fare Information</h4>
                <div className="fare-grid">
                  <div className="fare-item">
                    <span className="fare-route">Zone 1 → 1</span>
                    <span className="fare-price">$40</span>
                  </div>
                  <div className="fare-item">
                    <span className="fare-route">Zone 1 ↔ 2</span>
                    <span className="fare-price">$55</span>
                  </div>
                  <div className="fare-item">
                    <span className="fare-route">Zone 1 ↔ 3</span>
                    <span className="fare-price">$65</span>
                  </div>
                  <div className="fare-item">
                    <span className="fare-route">Zone 2 → 2</span>
                    <span className="fare-price">$35</span>
                  </div>
                  <div className="fare-item">
                    <span className="fare-route">Zone 2 ↔ 3</span>
                    <span className="fare-price">$45</span>
                  </div>
                  <div className="fare-item">
                    <span className="fare-route">Zone 3 → 3</span>
                    <span className="fare-price">$30</span>
                  </div>
                </div>
              </div>
              
              <div className="footer-section">
                <h4>System Information</h4>
                <p className="system-info">
                  • Maximum 20 journeys per day<br />
                  • 3 zones available<br />
                  • Automatic fare calculation<br />
                  • Journey history tracking
                </p>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>© 2024 PearlCard Metro System | All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;