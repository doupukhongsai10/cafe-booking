import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CafeOnboardingPage from './pages/CafeOnboardingPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/onboard"
        element={(
          <RoleProtectedRoute allowedRoles={['CAFE_ADMIN']}>
            <CafeOnboardingPage />
          </RoleProtectedRoute>
        )}
      />
      <Route
        path="/admin/dashboard"
        element={(
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </RoleProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
