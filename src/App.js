import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import BranchManager from './components/BranchManager';
import SuperAdmin from './components/SuperAdmin';
import BranchList from './components/BranchList';
import BranchDetails from './components/BranchDetails';
import './App.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/manager" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <Routes>
        <Route path="/" element={<BranchList />} /> {/* Main public route - branch list */}
        <Route path="/branches" element={<BranchList />} /> {/* Alternative route to branch list */}
        <Route path="/branch/:slug" element={<BranchDetails />} /> {/* Individual branch page */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/manager'} replace />}
        />
        <Route
          path="/manager"
          element={
            !user ? (
              <Login />
            ) : isAdmin ? (
              <ProtectedRoute>
                <SuperAdmin />
              </ProtectedRoute>
            ) : (
              <ProtectedRoute>
                <BranchManager />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
      </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;