import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import BranchManager from './components/BranchManager';
import SuperAdmin from './components/SuperAdmin';
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
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/manager'} replace />}
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <BranchManager />
          </ProtectedRoute>
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
      <Route path="/" element={<Navigate to={user ? (isAdmin ? '/admin' : '/manager') : '/login'} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;