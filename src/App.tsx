import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamView from './pages/ExamView';
import ResultsView from './pages/ResultsView';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import AccessDenied from './pages/AccessDenied';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AboutUs from './pages/AboutUs';
import { useSecurity } from './hooks/useSecurity';
import './styles/index.css';

const AppRoutes = () => {
  const { user } = useAuth();
  useSecurity();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={(user.role === 'teacher' || user.role === 'management') ? '/admin' : '/dashboard'} /> : <Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/exam/:year" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ExamView />
        </ProtectedRoute>
      } />

      <Route path="/results" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ResultsView />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['teacher', 'management']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/unauthorized" element={<AccessDenied />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/" element={<Navigate to="/login" />} />
      
      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeToggle />
        <AppRoutes />
        <div id="privacy-protector" className="privacy-overlay" />
      </Router>
    </AuthProvider>
  );
}

export default App;
