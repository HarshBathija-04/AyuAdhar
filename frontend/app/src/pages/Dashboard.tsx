import PageSkeleton from '@/components/PageSkeleton';
// AyuAahar - Dietitian Dashboard (Stitch Digital Sanctuary Design)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowUpRight,
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
        backgroundColor: [
          '#1b4332',
          '#D68C45',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#a5d0b9',
        ],
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
        backgroundColor: ['#D68C45', '#1b4332', '#ba1a1a'],
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const getPrakritiColor = (prakriti: string) => {
    const colors: Record<string, string> = {
      'Vata': 'bg-forest-200/40 text-forest-900',
      'Pitta': 'bg-saffron-200/40 text-saffron-700',
      'Kapha': 'bg-blue-100/40 text-blue-800',
      'Vata-Pitta': 'bg-violet-100/40 text-violet-700',
      'Vata-Kapha': 'bg-pink-100/40 text-pink-700',
      'Pitta-Kapha': 'bg-cyan-100/40 text-cyan-700',
      'Tridosha': 'bg-sand-100 text-ink-700',
    };
    return colors[prakriti] || colors['Tridosha'];
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-forest-900/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 -z-10 w-[400px] h-[400px] bg-saffron-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-forest-950 to-forest-900 p-2 rounded-xl">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-forest-900 uppercase tracking-wider">Practice Overview</span>
          </div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-ink-500 mt-2 text-base">Here's what's happening in your practice today</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button 
            onClick={() => navigate('/patients/new')} 
            className="bg-gradient-to-r from-forest-950 to-forest-900 hover:from-forest-950 hover:to-forest-800 text-white rounded-full px-6 shadow-lg shadow-forest-900/20 font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Patients */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl hover:shadow-[0_16px_50px_rgba(28,28,26,0.07)] transition-all duration-500 group hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-forest-200/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-forest-900" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-forest-700" />
            </div>
            <div className="text-3xl font-extrabold text-ink tracking-tight">{stats?.total_patients || 0}</div>
            <p className="text-sm text-ink-500 mt-1 font-medium">Total Patients</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-bold text-forest-900 bg-forest-200/30 px-2 py-0.5 rounded-full">+{stats?.recent_patients || 0}</span>
              <span className="text-xs text-ink-500">this month</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl hover:shadow-[0_16px_50px_rgba(28,28,26,0.07)] transition-all duration-500 group hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-700" />
            </div>
            <div className="text-3xl font-extrabold text-ink tracking-tight">{stats?.total_appointments || 0}</div>
            <p className="text-sm text-ink-500 mt-1 font-medium">Appointments</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded-full">{stats?.upcoming_this_week || 0}</span>
              <span className="text-xs text-ink-500">this week</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Diet Plans */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl hover:shadow-[0_16px_50px_rgba(28,28,26,0.07)] transition-all duration-500 group hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-saffron-200/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Utensils className="h-5 w-5 text-saffron-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-saffron-600" />
            </div>
            <div className="text-3xl font-extrabold text-ink tracking-tight">{stats?.total_patients || 0}</div>
            <p className="text-sm text-ink-500 mt-1 font-medium">Active Diet Plans</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-bold text-saffron-600 bg-saffron-200/50 px-2 py-0.5 rounded-full">Active</span>
              <span className="text-xs text-ink-500">personalized plans</span>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl hover:shadow-[0_16px_50px_rgba(28,28,26,0.07)] transition-all duration-500 group hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-violet-700" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-violet-700" />
            </div>
            <div className="text-3xl font-extrabold text-ink tracking-tight">85%</div>
            <p className="text-sm text-ink-500 mt-1 font-medium">Success Rate</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-bold text-violet-700 bg-violet-100/50 px-2 py-0.5 rounded-full">↑ 12%</span>
              <span className="text-xs text-ink-500">patient adherence</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prakriti Distribution */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
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
                  <p className="text-ink-500 font-medium">No prakriti data available</p>
                  <p className="text-ink-300 text-sm mt-1">Add patients to see distribution</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
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
                          color: '#717973',
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
                    <p className="text-ink-500 font-medium">No appointment data</p>
                    <p className="text-ink-300 text-sm mt-1">Schedule appointments to see stats</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/patients/new')}
          className="p-5 rounded-[1.5rem] bg-gradient-to-r from-forest-200/30 to-transparent hover:from-forest-200/50 transition-all duration-300 flex items-center gap-4 group text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-forest-900/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus className="h-5 w-5 text-forest-900" />
          </div>
          <div>
            <p className="font-bold text-ink text-sm">Register Patient</p>
            <p className="text-ink-500 text-xs">Add a new patient profile</p>
          </div>
        </button>
        <button 
          onClick={() => navigate('/appointments/new')}
          className="p-5 rounded-[1.5rem] bg-gradient-to-r from-saffron-200/20 to-transparent hover:from-saffron-200/40 transition-all duration-300 flex items-center gap-4 group text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-saffron-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5 text-saffron-600" />
          </div>
          <div>
            <p className="font-bold text-ink text-sm">Schedule Consultation</p>
            <p className="text-ink-500 text-xs">Book a new appointment</p>
          </div>
        </button>
        <button 
          onClick={() => navigate('/food-database')}
          className="p-5 rounded-[1.5rem] bg-gradient-to-r from-blue-100/20 to-transparent hover:from-blue-100/40 transition-all duration-300 flex items-center gap-4 group text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="font-bold text-ink text-sm">Food Database</p>
            <p className="text-ink-500 text-xs">Browse Ayurvedic food items</p>
          </div>
        </button>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
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
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-sand-100/80 cursor-pointer transition-all duration-300 group"
                    onClick={() => navigate(`/patients/${patient.id}`)}
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
                    <Badge className={`${getPrakritiColor(patient.prakriti)} border-0 rounded-full px-3 py-1 text-xs font-bold`}>
                      {patient.prakriti}
                    </Badge>
                  </div>
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
                    Add First Patient
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
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
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-sand-100/80 transition-all duration-300"
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
                    <Badge 
                      className={`border-0 rounded-full px-3 py-1 text-xs font-bold ${
                        appointment.status === 'pending' 
                          ? 'bg-saffron-200/40 text-saffron-700' 
                          : appointment.status === 'completed'
                          ? 'bg-forest-200/40 text-forest-900'
                          : 'bg-danger-soft/40 text-danger'
                      }`}
                    >
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
                    className="mt-3 rounded-full bg-saffron-500 hover:bg-saffron-700 text-white text-xs px-5"
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
