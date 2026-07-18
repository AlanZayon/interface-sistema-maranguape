import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from '@features/auth';
import { TenantProvider } from '@shared/context/TenantContext';
import App from '@app/App';

function AppContainer() {
  return (
    <AuthProvider>
      <Router>
        <TenantProvider>
          <App />
        </TenantProvider>
      </Router>
    </AuthProvider>
  );
}

export default AppContainer;
