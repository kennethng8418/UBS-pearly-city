import React from 'react';
import FareCalculator from './components/FareCalculator/FareCalculator';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>🚇 PearlCard Metro System</h1>
        <p>Welcome to Pearly City's Metro Fare Calculator</p>
      </header>
      <main className="app-main">
        <FareCalculator />
      </main>
      <footer className="app-footer">
        <p>© 2024 PearlCard Metro System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
