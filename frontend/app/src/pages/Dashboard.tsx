import { prakritiBadge, prakritiChart, statusBadge } from '@/lib/utils';
import PageSkeleton from '@/components/PageSkeleton';
// AyuAahar - Dietitian dashboard (patients see PatientDashboard)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import type { DashboardStats, Patient, Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Utensils, 
  TrendingUp, 
  ChevronRight,
  Activity,
  Stethoscope,
  PieChart,
  Clock,
  UserPlus,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import PatientDashboard from './PatientDashboard';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const STATUS_COLORS: Record<string, string> = { pending: '#d68c45', completed: '#1b4332', cancelled: '#ba1a1a' };

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role === 'patient') {
      setIsLoading(false);
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, navigate, user?.role]);

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [patientStats, appointmentStats, patientsResponse, appointmentsResponse] = await Promise.all([
        api.getPatientStats(),
        api.getAppointmentStats(),
        api.getPatients(),
        api.getAppointments({ status: 'pending', date_from: new Date().toISOString().slice(0, 16) }),
      ]);
      setStats({ ...patientStats, ...appointmentStats });
      setRecentPatients(patientsResponse.patients.slice(0, 5));
      setUpcomingAppointments(appointmentsResponse.appointments.slice(0, 5));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your dashboard'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  // Chart data for prakriti distribution
  const prakritiChartData = {
    labels: stats?.prakriti_distribution.map(p => p.prakriti) || [],
    datasets: [
      {
        data: stats?.prakriti_distribution.map(p => p.count) || [],
        backgroundColor: stats?.prakriti_distribution.map((p) => prakritiChart(p.prakriti)) || [],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  // Chart data for appointment status
  const appointmentChartData = {
    labels: stats?.status_breakdown.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)) || [],
    datasets: [
      {
        label: 'Appointments',
        data: stats?.status_breakdown.map(s => s.count) || [],
        // Colour by meaning, not by position: pending = saffron, completed = forest, cancelled = danger
        backgroundColor: stats?.status_breakdown.map((s) => STATUS_COLORS[s.status] ?? '#5d6560') || [],
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };


  return (
    <div className="relative mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 lg:px-10">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-forest-900/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 -z-10 w-[400px] h-[400px] bg-saffron-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-forest-950 to-forest-900 p-2 rounded-xl">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-forest-900 uppercase tracking-wider">Practice Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Welcome back, {user?.name}</h1>
          <p className="text-ink-500 mt-2 text-base">Here's what's happening in your practice today</p>
        </div>
        <div className="shrink-0">
          <Button 
            onClick={() => navigate('/patients/new')} 
            className="bg-gradient-to-r from-forest-950 to-forest-900 hover:from-forest-950 hover:to-forest-800 text-white rounded-full px-6 shadow-lg shadow-forest-900/20 font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total patients', value: stats?.total_patients ?? 0, icon: Users, tone: 'bg-forest-200/40 text-forest-900', note: `+${stats?.recent_patients ?? 0} in the last 30 days` },
          { label: 'Appointments', value: stats?.total_appointments ?? 0, icon: Calendar, tone: 'bg-blue-100/60 text-blue-700', note: `${stats?.upcoming_this_week ?? 0} pending in the next 7 days` },
          { label: 'Active diet plans', value: stats?.active_diet_plans ?? 0, icon: Utensils, tone: 'bg-saffron-200/50 text-saffron-700', note: 'One current plan per patient' },
          { label: 'Average adherence', value: stats?.average_adherence != null ? `${stats.average_adherence}%` : '–', icon: TrendingUp, tone: 'bg-violet-100/60 text-violet-700', note: 'Across all weekly check-ins' },
        ].map(({ label, value, icon: Icon, tone, note }) => (
          <Card key={label} className="border-0 shadow-soft rounded-[2rem] bg-white/70 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className={`w-12 h-12 mb-4 rounded-2xl flex items-center justify-center ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-3xl font-extrabold text-ink tracking-tight tabular-nums">{value}</p>
              <p className="text-sm text-ink-700 mt-1 font-semibold">{label}</p>
              <p className="mt-2 text-xs text-ink-500">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prakriti Distribution */}
        <Card className="border-0 shadow-soft rounded-[2rem] bg-white/70 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-forest-200/30 flex items-center justify-center">
                <PieChart className="h-4 w-4 text-forest-900" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">Prakriti Distribution</CardTitle>
                <CardDescription className="text-ink-500">Patient body constitution types</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {stats?.prakriti_distribution && stats.prakriti_distribution.length > 0 ? (
                <Doughnut 
                  data={prakritiChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          padding: 16,
                          font: {
                            family: 'Manrope',
                            size: 12,
                            weight: 600,
                          },
                          color: '#414844',
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3">
                    <PieChart className="h-7 w-7 text-ink-300" />
                  </div>
                  <p className="text-ink-700 font-medium">No patients yet</p>
                  <p className="text-ink-500 text-sm mt-1">Their prakriti mix will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card className="border-0 shadow-soft rounded-[2rem] bg-white/70 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-saffron-200/30 flex items-center justify-center">
                <Activity className="h-4 w-4 text-saffron-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">Appointment Status</CardTitle>
                <CardDescription className="text-ink-500">Overview of consultation statuses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.status_breakdown && stats.status_breakdown.length > 0 ? (
                <Bar 
                  data={appointmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: { family: 'Manrope', size: 11, weight: 500 },
                          color: '#5d6560',
                        },
                        grid: { color: 'rgba(193,200,194,0.15)' },
                        border: { display: false },
                      },
                      x: {
                        ticks: {
                          font: { family: 'Manrope', size: 11, weight: 600 },
                          color: '#414844',
                        },
                        grid: { display: false },
                        border: { display: false },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-7 w-7 text-ink-300" />
                    </div>
                    <p className="text-ink-700 font-medium">No appointments yet</p>
                    <p className="text-ink-500 text-sm mt-1">Pending, completed and cancelled counts will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/patients/new', title: 'Register patient', text: 'Add a new patient profile', icon: UserPlus, tone: 'from-forest-200/30 hover:from-forest-200/60 text-forest-900' },
          { to: '/appointments/new', title: 'Schedule consultation', text: 'Book a new appointment', icon: Clock, tone: 'from-saffron-200/30 hover:from-saffron-200/60 text-saffron-700' },
          { to: '/food-database', title: 'Food database', text: 'Browse Ayurvedic food items', icon: FileText, tone: 'from-blue-100/40 hover:from-blue-100/80 text-blue-700' },
        ].map(({ to, title, text, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className={`p-5 rounded-[1.5rem] bg-gradient-to-r to-transparent transition-colors duration-200 flex items-center gap-4 ${tone}`}
          >
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-white/70 flex items-center justify-center">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold text-ink text-sm">{title}</span>
              <span className="block text-ink-500 text-xs">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="border-0 shadow-soft rounded-[2rem] bg-white/70 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-forest-200/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-forest-900" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">Recent Patients</CardTitle>
                <CardDescription className="text-ink-500">Latest registrations</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/patients')}
              className="text-forest-900 hover:bg-forest-900/5 rounded-full font-medium text-sm"
            >
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl hover:bg-sand-100/80 transition-colors duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-forest-950 to-forest-900 flex items-center justify-center shadow-md shadow-forest-900/20">
                        <span className="text-white font-bold text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-ink text-sm group-hover:text-forest-900 transition-colors">{patient.name}</p>
                        <p className="text-xs text-ink-500">
                          {patient.age} years • {patient.gender}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${prakritiBadge(patient.prakriti)} border-0 rounded-full px-3 py-1 text-xs font-bold`}>
                      {patient.prakriti}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-7 w-7 text-ink-300" />
                  </div>
                  <p className="text-ink-500 font-medium">No patients yet</p>
                  <Button 
                    onClick={() => navigate('/patients/new')}
                    className="mt-3 rounded-full bg-forest-900 hover:bg-forest-800 text-white text-xs px-5"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add your first patient
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-soft rounded-[2rem] bg-white/70 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-saffron-200/30 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-saffron-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">Upcoming Appointments</CardTitle>
                <CardDescription className="text-ink-500">Scheduled consultations</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')}
              className="text-saffron-600 hover:bg-saffron-500/5 rounded-full font-medium text-sm"
            >
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100/40 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-bold text-ink text-sm">{appointment.patient_name}</p>
                        <p className="text-xs text-ink-500">
                          {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                          {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`border-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadge(appointment.status)}`}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-7 w-7 text-ink-300" />
                  </div>
                  <p className="text-ink-500 font-medium">No upcoming appointments</p>
                  <Button 
                    onClick={() => navigate('/appointments/new')}
                    className="mt-3 rounded-full bg-saffron-700 hover:bg-saffron-600 text-white text-xs px-5"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Schedule Consultation
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
