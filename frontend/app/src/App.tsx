// AyuAahar - App shell with role-based routing (pages are code-split)
import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import WakeUpBanner from '@/components/WakeUpBanner';
import PageSkeleton from '@/components/PageSkeleton';
import Landing from '@/pages/Landing';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientForm = lazy(() => import('@/pages/PatientForm'));
const PatientDetail = lazy(() => import('@/pages/PatientDetail'));
const DietPlan = lazy(() => import('@/pages/DietPlan'));
const Appointments = lazy(() => import('@/pages/Appointments'));
const FoodDatabase = lazy(() => import('@/pages/FoodDatabase'));
const Profile = lazy(() => import('@/pages/Profile'));
const Assistant = lazy(() => import('@/pages/Assistant'));

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-sand-50" role="status" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-forest-950 to-forest-900">
          <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-ink-500">Loading AyuAahar...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function DietitianRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'patient' ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
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

        <Route
          element={
            <ProtectedRoute>
              <Layout fallback={<PageSkeleton />} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<Appointments />} />
          <Route path="/food-database" element={<FoodDatabase />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="/patients"
            element={
              <DietitianRoute>
                <Patients />
              </DietitianRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <DietitianRoute>
                <PatientForm />
              </DietitianRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <DietitianRoute>
                <PatientDetail />
              </DietitianRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <DietitianRoute>
                <PatientForm />
              </DietitianRoute>
            }
          />
          <Route
            path="/patients/:id/diet-plan"
            element={
              <DietitianRoute>
                <DietPlan />
              </DietitianRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <WakeUpBanner />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
