// AppContainer.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

function AppContainer() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppContainer;
