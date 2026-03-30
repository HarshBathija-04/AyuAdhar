// AyuAahar - Main App Component with Role-Based Routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import PatientForm from '@/pages/PatientForm';
import PatientDetail from '@/pages/PatientDetail';
import DietPlan from '@/pages/DietPlan';
import Appointments from '@/pages/Appointments';
import FoodDatabase from '@/pages/FoodDatabase';
import Profile from '@/pages/Profile';
import Layout from '@/components/Layout';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcf9f5]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-[#717973] font-medium text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Loading AyuAahar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcf9f5]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-[#717973] font-medium text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Loading AyuAahar...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Dietitian-only Route Guard
function DietitianRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user?.role === 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth Routes - redirect to dashboard if already logged in */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - require authentication */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Shared routes - both roles */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/new" element={<Appointments />} />
        <Route path="/food-database" element={<FoodDatabase />} />
        <Route path="/profile" element={<Profile />} />

        {/* Dietitian-only routes */}
        <Route path="/patients" element={
          <DietitianRoute><Patients /></DietitianRoute>
        } />
        <Route path="/patients/new" element={
          <DietitianRoute><PatientForm /></DietitianRoute>
        } />
        <Route path="/patients/:id" element={
          <DietitianRoute><PatientDetail /></DietitianRoute>
        } />
        <Route path="/patients/:id/edit" element={
          <DietitianRoute><PatientForm /></DietitianRoute>
        } />
        <Route path="/patients/:id/diet-plan" element={
          <DietitianRoute><DietPlan /></DietitianRoute>
        } />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
