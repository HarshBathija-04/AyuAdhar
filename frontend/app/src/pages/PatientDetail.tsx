// AyuAahar - Patient Detail Page
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import type { Patient, DietPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Edit, 
  Utensils, 
  Calendar, 
  Activity,
  Loader2,
  FileText,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeDietPlan, setActiveDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [newProgress, setNewProgress] = useState({
    week_number: 1,
    adherence_score: 50,
    weight: 0,
    notes: '',
    symptoms: ''
  });

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPatient(Number(id));
      setPatient(response.patient);
      
      // Get active diet plan
      const dietPlanResponse = await api.getPatientDietPlan(Number(id));
      setActiveDietPlan(dietPlanResponse.diet_plan);
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDietPlan = async () => {
    try {
      setIsLoading(true);
      const response = await api.generateDietPlan(Number(id), 'Personalized Diet Plan');
      setActiveDietPlan(response.diet_plan);
      toast.success('Diet plan generated successfully');
    } catch (error) {
      console.error('Error generating diet plan:', error);
      toast.error('Failed to generate diet plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProgress = async () => {
    if (!patient) return;
    try {
      setIsLoading(true);
      await api.createProgressLog({
        ...newProgress,
        patient_id: patient.id
      });
      toast.success('Progress log added successfully');
      setIsProgressModalOpen(false);
      // Reset form
      setNewProgress({
        week_number: patient.progress_logs && patient.progress_logs.length > 0 ? patient.progress_logs.length + 1 : 1,
        adherence_score: 50,
        weight: patient.progress_logs && patient.progress_logs.length > 0 ? patient.progress_logs[patient.progress_logs.length - 1].weight || 0 : 0,
        notes: '',
        symptoms: ''
      });
      fetchPatientData(); // Refresh to show new log
    } catch (error) {
      console.error('Error adding progress:', error);
      toast.error('Failed to add progress log');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrakritiColor = (prakriti: string) => {
    const colors: Record<string, string> = {
      'Vata': 'bg-green-100 text-green-800',
      'Pitta': 'bg-amber-100 text-amber-800',
      'Kapha': 'bg-blue-100 text-blue-800',
      'Vata-Pitta': 'bg-purple-100 text-purple-800',
      'Vata-Kapha': 'bg-pink-100 text-pink-800',
      'Pitta-Kapha': 'bg-cyan-100 text-cyan-800',
      'Tridosha': 'bg-gray-100 text-gray-800',
    };
    return colors[prakriti] || 'bg-gray-100 text-gray-800';
  };

  // Prepare progress chart data
  const progressData = patient?.progress_logs ? {
    labels: patient.progress_logs.map(log => `Week ${log.week_number}`),
    datasets: [
      {
        label: 'Adherence Score',
        data: patient.progress_logs.map(log => log.adherence_score),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{patient.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getPrakritiColor(patient.prakriti)}>
                {patient.prakriti}
              </Badge>
              <span className="text-gray-500">
                {patient.age} years • {patient.gender}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={() => navigate(`/patients/${id}/diet-plan`)} className="bg-green-600 hover:bg-green-700">
            <Utensils className="mr-2 h-4 w-4" />
            Diet Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diet-plan">Diet Plan</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Health Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Health Conditions</Label>
                  <p className="mt-1">{patient.condition || 'None specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Lifestyle</Label>
                  <p className="mt-1">{patient.lifestyle || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {patient.diet_plans?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Diet Plans</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {patient.appointments?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Appointments</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {patient.progress_logs?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Progress Logs</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {new Date(patient.created_at || '').toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Registered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Diet Plan Tab */}
        <TabsContent value="diet-plan">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Diet Plan</CardTitle>
                <CardDescription>
                  {activeDietPlan ? 'Current personalized diet plan' : 'No active diet plan'}
                </CardDescription>
              </div>
              <Button onClick={generateDietPlan} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Utensils className="mr-2 h-4 w-4" />
                )}
                {activeDietPlan ? 'Regenerate Plan' : 'Generate Plan'}
              </Button>
            </CardHeader>
            <CardContent>
              {activeDietPlan ? (
                <div className="space-y-6">
                  {/* Nutritional Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(activeDietPlan.total_calories)}
                      </p>
                      <p className="text-sm text-gray-600">Calories</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(activeDietPlan.total_protein)}g
                      </p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {Math.round(activeDietPlan.total_carbs)}g
                      </p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(activeDietPlan.total_fats)}g
                      </p>
                      <p className="text-sm text-gray-600">Fats</p>
                    </div>
                  </div>

                  {/* Meal Plan */}
                  {activeDietPlan.plan_data?.meal_plan && (
                    <div className="space-y-4">
                      {Object.entries(activeDietPlan.plan_data.meal_plan).map(([meal, data]) => (
                        <div key={meal} className="border rounded-lg p-4">
                          <h4 className="font-semibold capitalize mb-2">{meal}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {data.foods.map((f: { name: string }) => f.name).join(', ')}
                          </p>
                          <p className="text-sm text-green-600">
                            {Math.round(data.total_calories)} calories
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Utensils className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Diet Plan</h3>
                  <p className="mt-1 text-gray-500">
                    Generate a personalized Ayurvedic diet plan for this patient
                  </p>
                  <Button onClick={generateDietPlan} className="mt-4 bg-green-600 hover:bg-green-700">
                    <Utensils className="mr-2 h-4 w-4" />
                    Generate Diet Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Appointments</CardTitle>
                <CardDescription>Consultation history</CardDescription>
              </div>
              <Button onClick={() => navigate('/appointments/new', { state: { patientId: id } })}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {patient.appointments && patient.appointments.length > 0 ? (
                <div className="space-y-3">
                  {patient.appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                        className={appointment.status === 'pending' ? 'bg-amber-500' : appointment.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No appointments scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Tracking
                </CardTitle>
                <CardDescription>Diet adherence and health metrics</CardDescription>
              </div>
              <Dialog open={isProgressModalOpen} onOpenChange={setIsProgressModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setNewProgress(prev => ({ 
                      ...prev, 
                      week_number: patient.progress_logs && patient.progress_logs.length > 0
                          ? Math.max(...patient.progress_logs.map(l => l.week_number)) + 1 
                          : 1
                    }))}>
                    <Activity className="mr-2 h-4 w-4" />
                    Add Log
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Progress Log</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="week_number">Week Number</Label>
                        <Input 
                          id="week_number" 
                          type="number" 
                          min={1}
                          value={newProgress.week_number}
                          onChange={(e) => setNewProgress({...newProgress, week_number: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input 
                          id="weight" 
                          type="number" 
                          step="0.1"
                          value={newProgress.weight}
                          onChange={(e) => setNewProgress({...newProgress, weight: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label>Adherence Score (%)</Label>
                        <span className="font-bold text-green-600">{newProgress.adherence_score}%</span>
                      </div>
                      <Slider
                        value={[newProgress.adherence_score]}
                        onValueChange={(vals) => setNewProgress({...newProgress, adherence_score: vals[0]})}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="How did the patient feel this week?"
                        value={newProgress.notes}
                        onChange={(e) => setNewProgress({...newProgress, notes: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="symptoms">Symptoms (if any)</Label>
                      <Textarea 
                        id="symptoms" 
                        placeholder="Any new or recurring symptoms..."
                        value={newProgress.symptoms}
                        onChange={(e) => setNewProgress({...newProgress, symptoms: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsProgressModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddProgress} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Progress
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {patient.progress_logs && patient.progress_logs.length > 0 ? (
                <div className="space-y-6">
                  {/* Progress Chart */}
                  {progressData && (
                    <div className="h-64">
                      <Line 
                        data={progressData}
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
                              max: 100,
                            },
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* Progress Logs */}
                  <div className="space-y-3">
                    {patient.progress_logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Week {log.week_number}</p>
                          {log.notes && (
                            <p className="text-sm text-gray-500">{log.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{log.adherence_score}%</p>
                          <p className="text-xs text-gray-500">Adherence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No progress logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

