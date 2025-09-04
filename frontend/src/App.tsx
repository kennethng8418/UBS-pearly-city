// App.tsx

import React from 'react';
import JourneyForm from './components/FareCalculator/JourneyForm';
import './App.css';

// Utility function to get or generate user ID


const App: React.FC = () => {
  const userId = '1';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>PearlCard Metro Fare Calculator</h1>
          <p className="header-subtitle">Calculate your daily journey fares</p>
          {userId && (
            <div className="user-info">
              <span className="user-label">User ID:</span>
              <span className="user-id">{userId}</span>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {userId ? (
          <JourneyForm />
        ) : (
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;