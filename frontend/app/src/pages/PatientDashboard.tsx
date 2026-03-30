// AyuAahar - Patient Dashboard (Stitch Digital Sanctuary Design)
// A personal, warm wellness-focused dashboard completely different from the doctor's clinical view
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Apple, 
  Calendar, 
  Loader2, 
  Leaf, 
  Activity, 
  ArrowRight,
  Heart,
  Sun,
  Moon,
  Cloud,
  Flame,
  Droplets,
  Wind,
  Sparkles,
  TrendingUp,
  Target,
  BookOpen,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localIsLoading, setLocalIsLoading] = useState(true);

  // Data states
  const [patientData, setPatientData] = useState<any>(null);
  const [activePlan, setActivePlan] = useState({
    name: 'Vata-Pacifying Balance Diet',
    calories: 1850,
    protein: 65,
    carbs: 220,
    fats: 58,
    fiber: 32,
    prakriti: 'Vata'
  });

  const [todayMeals, setTodayMeals] = useState<any[]>([
    { meal: 'Breakfast', time: '8:30 AM', name: 'Warm Spiced Oatmeal with Almonds', calories: 420, status: 'completed', icon: <Sun className="h-4 w-4" /> },
    { meal: 'Lunch', time: '1:00 PM', name: 'Mung Dal Kitchari with Steamed Greens', calories: 580, status: 'upcoming', icon: <Cloud className="h-4 w-4" /> },
    { meal: 'Dinner', time: '7:00 PM', name: 'Light Vegetable Soup with Ghee', calories: 380, status: 'upcoming', icon: <Moon className="h-4 w-4" /> },
    { meal: 'Snack', time: '4:30 PM', name: 'Dates with Warm Milk & Cardamom', calories: 220, status: 'upcoming', icon: <Sparkles className="h-4 w-4" /> },
  ]);

  const [adherenceScore, setAdherenceScore] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeksActive, setWeeksActive] = useState(0);
  const [weightChange, setWeightChange] = useState(0);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const response = await api.getPatientMyData();
        if (response.patient) {
          setPatientData(response.patient);
          setActivePlan(prev => ({
            ...prev,
            prakriti: response.patient.prakriti || prev.prakriti
          }));
        }
        
        if (response.diet_plan) {
          const plan = response.diet_plan;
          
          let parsedMeals = [];
          try {
            if (typeof plan.plan_data === 'string') {
               parsedMeals = JSON.parse(plan.plan_data).meals || [];
            } else if (plan.plan_data && plan.plan_data.meals) {
               parsedMeals = plan.plan_data.meals;
            }
          } catch(e) {}
          
          if (parsedMeals.length > 0) {
            setTodayMeals(parsedMeals.map((m: any) => ({
              meal: m.type, time: 'Scheduled', name: m.food, calories: Math.round(m.calories) || 0, status: 'upcoming', icon: <Apple className="h-4 w-4" />
            })));
          }

          setActivePlan({
            name: plan.plan_name || 'Personalized Diet Plan',
            calories: Math.round(plan.total_calories) || 1850,
            protein: Math.round(plan.total_protein) || 65,
            carbs: Math.round(plan.total_carbs) || 220,
            fats: Math.round(plan.total_fats) || 58,
            fiber: 32, // fallback
            prakriti: response.patient?.prakriti || 'Vata'
          });
        }
        
        if (response.progress_logs && response.progress_logs.length > 0) {
           const latestLog = response.progress_logs[0];
           if (latestLog.adherence) {
              setAdherenceScore(latestLog.adherence);
           }
           
           // Simple calculations for demo
           setWeeksActive(Math.max(1, Math.round(response.progress_logs.length / 7)));
           if (response.progress_logs.length > 1 && response.progress_logs[0].weight && response.progress_logs[response.progress_logs.length - 1].weight) {
               setWeightChange(Math.abs(response.progress_logs[response.progress_logs.length - 1].weight - response.progress_logs[0].weight));
           }

           // Map recent progress logs safely up to 7
           const recentLogs = [...response.progress_logs].reverse().slice(-7);
           const progressArr = [0, 0, 0, 0, 0, 0, 0];
           recentLogs.forEach((log, i) => {
              if (log.adherence) progressArr[i] = log.adherence;
           });
           setWeeklyProgress(progressArr);
        }
      } catch (err) {
        console.error("No real patient data found or not a patient:", err);
      } finally {
        setLocalIsLoading(false);
      }
    };
    
    loadRealData();
  }, []);

  const doshaTips = [
    { icon: <Sun className="h-4 w-4" />, tip: 'Wake up before sunrise for optimal Vata balance' },
    { icon: <Flame className="h-4 w-4" />, tip: 'Eat warm, cooked foods — avoid cold or raw meals' },
    { icon: <Clock className="h-4 w-4" />, tip: 'Follow a regular meal schedule: 8 AM, 12 PM, 7 PM' },
    { icon: <Droplets className="h-4 w-4" />, tip: 'Drink warm water with ginger throughout the day' },
  ];

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [progressForm, setProgressForm] = useState({ weight: '', adherence: 80, notes: '', symptoms: '' });

  const handleLogProgress = () => {
    toast.success('Progress properly logged! Your dietitian will review it shortly.', {
      style: { background: '#1b4332', color: 'white', border: 'none' }
    });
    setIsProgressOpen(false);
    setProgressForm({ weight: '', adherence: 80, notes: '', symptoms: '' });
  };

  const handleMarkMealComplete = (index: number) => {
    const updatedMeals = [...todayMeals];
    updatedMeals[index].status = 'completed';
    setTodayMeals(updatedMeals);
    toast.success(`${updatedMeals[index].meal} marked as completed!`, {
      style: { background: '#1b4332', color: 'white', border: 'none' }
    });
  };

  if (localIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1b4332] mx-auto mb-4" />
          <p className="text-[#717973] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Preparing your sanctuary...</p>
        </div>
      </div>
    );
  }

  const caloriesConsumed = todayMeals.filter(m => m.status === 'completed').reduce((sum, m) => sum + (m.calories || 0), 0);
  const caloriesPercent = Math.min(100, Math.round((caloriesConsumed / (activePlan.calories || 1)) * 100));
  
  const proteinConsumed = Math.round((caloriesPercent / 100) * activePlan.protein);
  const carbsConsumed = Math.round((caloriesPercent / 100) * activePlan.carbs);
  const fatsConsumed = Math.round((caloriesPercent / 100) * activePlan.fats);

  // Real-time responsiveness logic
  const todayAdherence = todayMeals.length > 0 
    ? Math.round((todayMeals.filter(m => m.status === 'completed').length / todayMeals.length) * 100) 
    : 0;
  const displayAdherence = adherenceScore > 0 ? Math.round((adherenceScore + todayAdherence) / 2) : todayAdherence;
  const displayWeeklyProgress = [...weeklyProgress];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  displayWeeklyProgress[currentDayIndex] = Math.max(displayWeeklyProgress[currentDayIndex] || 0, todayAdherence);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto relative" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#1b4332]/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[30%] left-0 -z-10 w-[400px] h-[400px] bg-[#D68C45]/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] -z-10 w-[300px] h-[300px] bg-[#c1ecd4]/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] p-2 rounded-xl">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[#D68C45] uppercase tracking-wider">Wellness Journey</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#1c1c1a] tracking-tight">My Wellness Journey</h1>
          <p className="text-[#717973] mt-2 text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>Good to see you, {user?.name}. Your path to balance starts here.</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(28,28,26,0.04)]">
          <Leaf className="h-4 w-4 text-[#1b4332]" />
          <span className="font-bold text-[#1b4332] text-sm tracking-tight">{activePlan.name}</span>
        </div>
      </div>

      {/* Dosha & Daily Targets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Dosha Balance Card */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl md:col-span-4 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c1ecd4]/10 to-transparent pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-[#717973] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>My Dosha</p>
              <Wind className="h-5 w-5 text-[#a5d0b9]" />
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center shadow-xl shadow-[#1b4332]/30 group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl font-extrabold text-white">{activePlan.prakriti ? activePlan.prakriti[0] : '?'}</span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight">{activePlan.prakriti || 'Unknown'}</div>
                <p className="text-sm text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>Primary Constitution</p>
              </div>
            </div>
            {patientData?.condition && (
               <div className="mt-4 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <p className="text-xs font-bold text-orange-800 tracking-wider uppercase mb-1">Health Focus</p>
                  <p className="text-sm text-orange-900 font-medium">{patientData.condition}</p>
               </div>
            )}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Badge className="bg-[#c1ecd4]/30 text-[#1b4332] border-0 rounded-full text-xs font-bold px-3">Air</Badge>
              <Badge className="bg-[#c1ecd4]/30 text-[#1b4332] border-0 rounded-full text-xs font-bold px-3">Space</Badge>
              <Badge className="bg-[#ffdcc1]/30 text-[#8c4f09] border-0 rounded-full text-xs font-bold px-3">Light</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Daily Targets Card */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl md:col-span-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#D68C45]/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-[#717973] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Daily Nutrition Targets</p>
              <Target className="h-5 w-5 text-[#D68C45]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80">
                <div className="text-2xl font-extrabold text-[#1c1c1a] tracking-tight">{activePlan.calories}</div>
                <p className="text-xs text-[#717973] font-semibold mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>kcal Target</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#e5e2de] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#012d1d] to-[#1b4332]" style={{ width: `${caloriesPercent}%` }} />
                </div>
                <p className="text-[10px] text-[#a5d0b9] font-bold mt-1">{caloriesConsumed} consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80">
                <div className="text-2xl font-extrabold text-[#1c1c1a] tracking-tight">{activePlan.protein}g</div>
                <p className="text-xs text-[#717973] font-semibold mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Protein</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#e5e2de] overflow-hidden">
                  <div className="h-full rounded-full bg-[#D68C45]" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-[#ffb878] font-bold mt-1">{proteinConsumed}g consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80">
                <div className="text-2xl font-extrabold text-[#1c1c1a] tracking-tight">{activePlan.carbs}g</div>
                <p className="text-xs text-[#717973] font-semibold mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Carbs</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#e5e2de] overflow-hidden">
                  <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-[#93c5fd] font-bold mt-1">{carbsConsumed}g consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80">
                <div className="text-2xl font-extrabold text-[#1c1c1a] tracking-tight">{activePlan.fats}g</div>
                <p className="text-xs text-[#717973] font-semibold mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Fats</p>
                <div className="mt-3 h-1.5 rounded-full bg-[#e5e2de] overflow-hidden">
                  <div className="h-full rounded-full bg-[#8b5cf6]" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-[#c4b5fd] font-bold mt-1">{fatsConsumed}g consumed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Meals & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Meals - Takes more space */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#c1ecd4]/30 flex items-center justify-center">
                  <Apple className="h-4 w-4 text-[#1b4332]" />
                </div>
                <CardTitle className="text-lg font-bold text-[#1c1c1a] tracking-tight">Today's Meals</CardTitle>
              </div>
              <Button onClick={() => setIsPlanOpen(true)} variant="ghost" className="text-[#1b4332] hover:bg-[#1b4332]/5 rounded-full text-sm font-medium">
                View Full Plan
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMeals.map((meal, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  meal.status === 'completed' 
                    ? 'bg-[#c1ecd4]/20 hover:bg-[#c1ecd4]/30' 
                    : 'bg-[#f6f3ef]/60 hover:bg-[#f6f3ef]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      meal.status === 'completed' ? 'bg-[#1b4332]/10 text-[#1b4332]' : 'bg-[#e5e2de]/60 text-[#717973]'
                    }`}>
                      {meal.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold tracking-wider uppercase text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          {meal.meal}
                        </p>
                        <span className="text-[10px] text-[#a5d0b9] font-bold">• {meal.time}</span>
                      </div>
                      <p className="font-bold text-[#1c1c1a] text-sm mt-0.5">{meal.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#1c1c1a]">{meal.calories}</p>
                    <p className="text-[10px] text-[#717973] font-medium">kcal</p>
                  </div>
                </div>
                {meal.status === 'completed' ? (
                  <div className="mt-2 ml-13">
                    <Badge className="bg-[#1b4332]/10 text-[#1b4332] border-0 rounded-full text-[10px] font-bold px-2.5">
                      ✓ Completed
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-2 ml-13">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkMealComplete(index)}
                      className="border-[#1b4332]/20 text-[#1b4332] hover:bg-[#1b4332]/10 hover:border-[#1b4332]/30 rounded-full h-7 text-[10px] uppercase font-bold px-3 transition-colors shadow-none"
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column: Adherence + Consultations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Adherence */}
          <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D68C45]/5 to-transparent pointer-events-none" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold text-[#717973] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Weekly Adherence</p>
                <TrendingUp className="h-5 w-5 text-[#D68C45]" />
              </div>
              
              {/* Circular Progress */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e2de" strokeWidth="10" />
                    <circle 
                      cx="60" cy="60" r="52" fill="none" 
                      stroke="url(#progressGradient)" 
                      strokeWidth="10" 
                      strokeLinecap="round"
                      strokeDasharray={`${displayAdherence * 3.27} 327`}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D68C45" />
                        <stop offset="100%" stopColor="#8c4f09" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight">{displayAdherence}%</span>
                    <span className="text-[10px] text-[#717973] font-bold uppercase">adherence</span>
                  </div>
                </div>
              </div>

              {/* Weekly Mini Chart */}
              <div className="flex items-end justify-between gap-1 h-12">
                {displayWeeklyProgress.map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className={`w-full rounded-full transition-all duration-500 ${val > 0 ? 'bg-gradient-to-t from-[#D68C45] to-[#ffb878]' : 'bg-[#e5e2de]/60'}`}
                      style={{ height: `${(val / 100) * 48}px`, minHeight: '4px' }}
                    />
                    <span className="text-[9px] text-[#717973] font-bold">{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consultations */}
          <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#dbeafe]/30 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#3b82f6]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#1c1c1a] tracking-tight">Consultations</CardTitle>
                  <CardDescription className="text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>Your dietitian check-ins</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-[#dbeafe]/30 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-[#93c5fd]" />
              </div>
              <p className="font-bold text-[#1c1c1a] text-sm">No upcoming appointments</p>
              <p className="text-sm text-[#717973] mt-2 mb-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Schedule a check-in with your dietitian
              </p>
              <Button onClick={() => navigate('/appointments')} className="rounded-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] hover:from-[#012d1d] hover:to-[#274e3d] text-white shadow-lg shadow-[#1b4332]/20 px-6 font-medium">
                Book Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dosha Tips & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dosha Tips */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c1ecd4]/10 to-transparent pointer-events-none" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#c1ecd4]/30 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[#1b4332]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#1c1c1a] tracking-tight">Vata-Pacifying Tips</CardTitle>
                <CardDescription className="text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Personalized for your dosha type
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            {doshaTips.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f6f3ef]/60 hover:bg-[#f6f3ef] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-[#1b4332]/10 flex items-center justify-center text-[#1b4332] mt-0.5 shrink-0">
                  {item.icon}
                </div>
                <p className="text-sm text-[#414844] leading-relaxed font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {item.tip}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Progress */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ede9fe]/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-[#8b5cf6]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#1c1c1a] tracking-tight">My Progress</CardTitle>
                  <CardDescription className="text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>Your wellness journey over time</CardDescription>
                </div>
              </div>
              <Button onClick={() => setIsProgressOpen(true)} size="sm" className="bg-[#ede9fe]/50 text-[#8b5cf6] hover:bg-[#ede9fe] rounded-full border-0 font-bold hover:shadow-sm">
                + Log Progress
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80 text-center">
                <div className="text-2xl font-extrabold text-[#1c1c1a] tracking-tight">{weeksActive || 0}</div>
                <p className="text-[10px] text-[#717973] font-bold uppercase mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Weeks Active</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80 text-center">
                <div className="text-2xl font-extrabold text-[#1b4332] tracking-tight">{weightChange || 0}kg</div>
                <p className="text-[10px] text-[#717973] font-bold uppercase mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Weight Change</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#f6f3ef]/80 text-center">
                <div className="text-2xl font-extrabold text-[#D68C45] tracking-tight">{displayAdherence}%</div>
                <p className="text-[10px] text-[#717973] font-bold uppercase mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Avg Adherence</p>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="p-4 rounded-2xl bg-[#f6f3ef]/60">
              <p className="text-xs font-bold text-[#717973] uppercase tracking-wider mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Adherence Trend (Last 4 Weeks)
              </p>
              <div className="flex items-end justify-between gap-3 h-24">
                {[
                  { week: 'W1', score: 65, color: 'from-[#c1c8c2] to-[#e5e2de]' },
                  { week: 'W2', score: 72, color: 'from-[#a5d0b9] to-[#c1ecd4]' },
                  { week: 'W3', score: 75, color: 'from-[#1b4332] to-[#3f6653]' },
                  { week: 'W4', score: 78, color: 'from-[#012d1d] to-[#1b4332]' }
                ].map((w, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs font-extrabold text-[#1c1c1a]">{w.score}%</span>
                    <div 
                      className={`w-full rounded-2xl bg-gradient-to-t ${w.color} transition-all duration-700`}
                      style={{ height: `${(w.score / 100) * 80}px` }}
                    />
                    <span className="text-[10px] text-[#717973] font-bold">{w.week}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Achievements */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-[#c1ecd4]/30 text-[#1b4332] border-0 rounded-full text-xs font-bold px-3 py-1">
                🌿 4-Week Streak
              </Badge>
              <Badge className="bg-[#ffdcc1]/30 text-[#8c4f09] border-0 rounded-full text-xs font-bold px-3 py-1">
                🔥 Improving Adherence
              </Badge>
              <Badge className="bg-[#ede9fe]/30 text-[#8b5cf6] border-0 rounded-full text-xs font-bold px-3 py-1">
                ⚖️ Weight on Track
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Full Plan Modal */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white/95 backdrop-blur-xl border-0 rounded-[2rem] shadow-[0_8px_40px_rgba(28,28,26,0.08)]" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-[#1c1c1a]">Complete {activePlan.prakriti} Plan</DialogTitle>
            <p className="text-sm text-[#717973] mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Your personalized {activePlan.calories}kcal daily nutrition guide.
            </p>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {todayMeals.map((meal, index) => (
              <div key={index} className="p-4 rounded-2xl bg-[#f6f3ef]/80 border border-[#e5e2de]/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#1b4332]">
                    {meal.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1c1c1a]">{meal.meal} <span className="text-xs text-[#a5d0b9] font-normal ml-2">{meal.time}</span></h3>
                    <p className="text-sm text-[#717973] font-medium mt-0.5">{meal.name}</p>
                  </div>
                </div>
                <div className="pl-13">
                  <Badge className="bg-white/60 text-[#1b4332] border border-[#e5e2de]/50 font-bold">
                    {meal.calories} kcal
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#c1ecd4]/20 to-transparent">
              <p className="text-sm font-bold text-[#1b4332] mb-1">Hydration Goal</p>
              <p className="text-xs text-[#717973] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Drink 2-3 liters of warm water throughout the day, sipping slowly. Avoid ice water with meals.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Progress Modal */}
      <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
        <DialogContent className="max-w-md sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-0 rounded-[2rem] shadow-[0_8px_40px_rgba(28,28,26,0.08)]" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold text-[#1c1c1a]">Log Today's Journey</DialogTitle>
            <p className="text-sm text-[#717973] mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Update your symptoms and adherence. Your dietitian will review it when they are online!
            </p>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-[#414844]">Adherence Score ({progressForm.adherence}%)</Label>
                <Badge className="bg-[#ede9fe]/50 text-[#8b5cf6] border-0">
                  {progressForm.adherence > 85 ? 'Excellent' : progressForm.adherence > 65 ? 'Good' : 'Needs Focus'}
                </Badge>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={progressForm.adherence} 
                onChange={(e) => setProgressForm({...progressForm, adherence: parseInt(e.target.value)})}
                className="w-full h-2 bg-[#e5e2de] rounded-lg appearance-none cursor-pointer accent-[#D68C45]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#414844]">Current Weight (Optional)</Label>
              <Input 
                value={progressForm.weight} 
                onChange={(e) => setProgressForm({...progressForm, weight: e.target.value})} 
                placeholder="e.g. 70 kg" 
                className="rounded-xl border-[#e5e2de] bg-[#f6f3ef]/50 h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#414844]">Symptoms experienced today?</Label>
              <Input 
                value={progressForm.symptoms} 
                onChange={(e) => setProgressForm({...progressForm, symptoms: e.target.value})} 
                placeholder="e.g. slight bloating, high energy" 
                className="rounded-xl border-[#e5e2de] bg-[#f6f3ef]/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#414844]">Journal / Notes</Label>
              <textarea 
                value={progressForm.notes} 
                onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})} 
                placeholder="How are you feeling about the diet mentally?" 
                className="w-full flex min-h-[80px] rounded-xl border border-[#e5e2de] bg-[#f6f3ef]/50 px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <Button onClick={handleLogProgress} className="w-full rounded-xl bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white hover:from-[#1b4332] hover:to-[#274e3d] h-12 shadow-lg shadow-[#1b4332]/20 font-bold text-base">
            Submit Progress
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
