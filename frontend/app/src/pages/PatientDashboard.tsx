// AyuAahar - Patient Dashboard (Stitch Digital Sanctuary Design)
// A personal, warm wellness-focused dashboard completely different from the doctor's clinical view
import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Apple, 
  Calendar, 
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
import { getErrorMessage } from '@/lib/errors';
import type { Appointment, Patient, ProgressLog } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const MEAL_SLOTS = [
  { key: 'breakfast', meal: 'Breakfast', time: '8:00 AM', icon: <Sun className="h-4 w-4" /> },
  { key: 'lunch', meal: 'Lunch', time: '1:00 PM', icon: <Cloud className="h-4 w-4" /> },
  { key: 'snacks', meal: 'Snack', time: '4:30 PM', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'dinner', meal: 'Dinner', time: '7:00 PM', icon: <Moon className="h-4 w-4" /> },
] as const;

const DOSHA_INFO: Record<string, { elements: string[]; tips: { icon: ReactNode; tip: string }[] }> = {
  Vata: {
    elements: ['Air', 'Space', 'Light'],
    tips: [
      { icon: <Sun className="h-4 w-4" />, tip: 'Keep a steady routine: wake, eat and sleep at the same times each day' },
      { icon: <Flame className="h-4 w-4" />, tip: 'Favour warm, cooked, slightly oily foods over cold or raw meals' },
      { icon: <Clock className="h-4 w-4" />, tip: 'Do not skip meals; make lunch your largest meal' },
      { icon: <Droplets className="h-4 w-4" />, tip: 'Sip warm water or ginger tea through the day' },
    ],
  },
  Pitta: {
    elements: ['Fire', 'Water', 'Sharp'],
    tips: [
      { icon: <Droplets className="h-4 w-4" />, tip: 'Choose cooling foods and drinks such as cucumber, coconut water and sweet fruits' },
      { icon: <Flame className="h-4 w-4" />, tip: 'Go easy on chilli, sour and fried foods' },
      { icon: <Clock className="h-4 w-4" />, tip: 'Eat when hungry and avoid long gaps between meals' },
      { icon: <Moon className="h-4 w-4" />, tip: 'Wind down in the evening and avoid midday sun exercise' },
    ],
  },
  Kapha: {
    elements: ['Earth', 'Water', 'Steady'],
    tips: [
      { icon: <Sun className="h-4 w-4" />, tip: 'Rise early and move daily; brisk activity suits you best' },
      { icon: <Flame className="h-4 w-4" />, tip: 'Favour light, warm, well-spiced meals; ginger and black pepper help' },
      { icon: <Clock className="h-4 w-4" />, tip: 'Keep dinner light and early, and allow 3-4 hours between meals' },
      { icon: <Droplets className="h-4 w-4" />, tip: 'Limit heavy dairy, sweets and cold drinks' },
    ],
  },
};

type MealCard = { meal: string; time: string; name: string; calories: number; status: 'completed' | 'upcoming'; icon: ReactNode };

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Data states
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [activePlan, setActivePlan] = useState({
    name: 'No active plan yet',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    prakriti: '',
  });
  const [todayMeals, setTodayMeals] = useState<MealCard[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadRealData = async () => {
      try {
        const response = await api.getPatientMyData();
        if (cancelled) return;
        setLoadError(null);
        setPatientData(response.patient);
        setProgressLogs(response.progress_logs);
        const now = Date.now();
        setUpcoming(
          response.appointments.filter((a) => a.status === 'pending' && new Date(a.appointment_date).getTime() >= now),
        );

        const plan = response.diet_plan;
        setHasPlan(Boolean(plan));
        if (plan) {
          const meals = plan.plan_data?.meal_plan;
          setTodayMeals(
            MEAL_SLOTS.filter((slot) => meals?.[slot.key]?.foods?.length).map((slot) => ({
              meal: slot.meal,
              time: slot.time,
              icon: slot.icon,
              name: meals[slot.key].foods.map((f) => f.name).join(', '),
              calories: Math.round(meals[slot.key].total_calories || 0),
              status: 'upcoming' as const,
            })),
          );
          setActivePlan({
            name: plan.plan_name || 'Personalized Diet Plan',
            calories: Math.round(plan.plan_data?.total_nutrition?.target_calories || plan.total_calories || 0),
            protein: Math.round(plan.total_protein || 0),
            carbs: Math.round(plan.total_carbs || 0),
            fats: Math.round(plan.total_fats || 0),
            fiber: Math.round(plan.plan_data?.total_nutrition?.fiber || 0),
            prakriti: response.patient.prakriti,
          });
        } else {
          setActivePlan((prev) => ({ ...prev, prakriti: response.patient.prakriti }));
        }
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'We could not load your wellness data.'));
      } finally {
        if (!cancelled) setLocalIsLoading(false);
      }
    };

    loadRealData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Weekly progress logs (oldest first from the API)
  const recentLogs = progressLogs.slice(-7);
  const weeklyProgress = recentLogs.map((l) => l.adherence_score || 0);
  const weekDays = recentLogs.map((l) => `W${l.week_number}`);
  const weeksActive = progressLogs.length;
  const adherenceScore = progressLogs.length ? progressLogs[progressLogs.length - 1].adherence_score || 0 : 0;
  const weights = progressLogs.map((l) => l.weight).filter((w): w is number => typeof w === 'number');
  const weightChange = weights.length > 1 ? Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10 : 0;
  const baseDosha = (activePlan.prakriti || '').split('-')[0];
  const dosha = DOSHA_INFO[baseDosha] ?? DOSHA_INFO.Vata;
  const doshaTips = dosha.tips;

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({ weight: '', adherence: 80, notes: '', symptoms: '' });

  const handleLogProgress = async () => {
    if (!patientData) return;
    const weight = progressForm.weight ? Number(progressForm.weight) : undefined;
    if (weight !== undefined && (!Number.isFinite(weight) || weight <= 10 || weight > 400)) {
      toast.error('Please enter a weight between 10 and 400 kg');
      return;
    }
    setSavingProgress(true);
    try {
      const nextWeek = progressLogs.reduce((max, l) => Math.max(max, l.week_number), 0) + 1;
      const { progress_log } = await api.createProgressLog({
        patient_id: patientData.id,
        week_number: nextWeek,
        adherence_score: progressForm.adherence,
        weight,
        notes: progressForm.notes,
        symptoms: progressForm.symptoms,
      });
      setProgressLogs((logs) => [...logs, progress_log]);
      toast.success(`Week ${nextWeek} logged. Your dietitian can see it now.`);
      setIsProgressOpen(false);
      setProgressForm({ weight: '', adherence: 80, notes: '', symptoms: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your progress'));
    } finally {
      setSavingProgress(false);
    }
  };

  const handleMarkMealComplete = (index: number) => {
    setTodayMeals((meals) => meals.map((m, i) => (i === index ? { ...m, status: 'completed' } : m)));
    toast.success(`${todayMeals[index].meal} marked as completed`);
  };

  if (localIsLoading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 md:p-8" role="status" aria-label="Loading your dashboard">
        <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-sand-200" />
        <div className="grid gap-5 md:grid-cols-12">
          <div className="h-56 animate-pulse rounded-[2rem] bg-white/80 md:col-span-4" />
          <div className="h-56 animate-pulse rounded-[2rem] bg-white/80 md:col-span-8" />
        </div>
        <div className="h-80 animate-pulse rounded-[2rem] bg-white/80" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center" role="alert">
        <div className="rounded-[2rem] bg-white/80 p-8 shadow-soft">
          <Heart className="mx-auto mb-3 h-8 w-8 text-danger" aria-hidden="true" />
          <h1 className="text-xl font-bold text-ink">Your dashboard is not available</h1>
          <p className="mt-2 text-sm text-ink-500">{loadError}</p>
          <Button onClick={() => { setLocalIsLoading(true); setReloadKey((k) => k + 1); }} className="mt-5 rounded-full bg-forest-900 hover:bg-forest-800">
            Try again
          </Button>
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
  const displayAdherence = adherenceScore > 0 ? adherenceScore : todayAdherence;
  const displayWeeklyProgress = weeklyProgress;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-forest-900/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[30%] left-0 -z-10 w-[400px] h-[400px] bg-saffron-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] -z-10 w-[300px] h-[300px] bg-forest-200/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-forest-950 to-forest-900 p-2 rounded-xl">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-saffron-600 uppercase tracking-wider">Wellness Journey</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">My Wellness Journey</h1>
          <p className="text-ink-500 mt-2 text-base">Good to see you, {user?.name}. Your path to balance starts here.</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_4px_20px_rgba(28,28,26,0.04)]">
          <Leaf className="h-4 w-4 text-forest-900" />
          <span className="font-bold text-forest-900 text-sm tracking-tight">{activePlan.name}</span>
        </div>
      </div>

      {/* Dosha & Daily Targets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Dosha Balance Card */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl md:col-span-4 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-200/10 to-transparent pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-ink-500 uppercase tracking-wider">My Dosha</p>
              <Wind className="h-5 w-5 text-forest-700" />
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-forest-950 to-forest-900 flex items-center justify-center shadow-xl shadow-forest-900/30 group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl font-extrabold text-white">{activePlan.prakriti ? activePlan.prakriti[0] : '?'}</span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-ink tracking-tight">{activePlan.prakriti || 'Unknown'}</div>
                <p className="text-sm text-ink-500">Primary Constitution</p>
              </div>
            </div>
            {patientData?.condition && (
               <div className="mt-4 p-3 rounded-xl bg-saffron-200/20 border border-saffron-200/60">
                  <p className="text-xs font-bold text-saffron-700 tracking-wider uppercase mb-1">Health Focus</p>
                  <p className="text-sm text-saffron-700 font-medium">{patientData.condition}</p>
               </div>
            )}
            <div className="flex gap-2 mt-4 flex-wrap">
              {dosha.elements.map((el, i) => (
                <Badge key={el} className={`border-0 rounded-full text-xs font-bold px-3 ${i === 2 ? 'bg-saffron-200/30 text-saffron-700' : 'bg-forest-200/30 text-forest-900'}`}>{el}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Targets Card */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl md:col-span-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-saffron-500/5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-ink-500 uppercase tracking-wider">Daily Nutrition Targets</p>
              <Target className="h-5 w-5 text-saffron-600" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-sand-100/80">
                <div className="text-2xl font-extrabold text-ink tracking-tight">{activePlan.calories}</div>
                <p className="text-xs text-ink-500 font-semibold mt-1">kcal Target</p>
                <div className="mt-3 h-1.5 rounded-full bg-sand-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-forest-950 to-forest-900" style={{ width: `${caloriesPercent}%` }} />
                </div>
                <p className="text-[10px] text-forest-700 font-bold mt-1">{caloriesConsumed} consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-sand-100/80">
                <div className="text-2xl font-extrabold text-ink tracking-tight">{activePlan.protein}g</div>
                <p className="text-xs text-ink-500 font-semibold mt-1">Protein</p>
                <div className="mt-3 h-1.5 rounded-full bg-sand-200 overflow-hidden">
                  <div className="h-full rounded-full bg-saffron-500" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-saffron-600 font-bold mt-1">{proteinConsumed}g consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-sand-100/80">
                <div className="text-2xl font-extrabold text-ink tracking-tight">{activePlan.carbs}g</div>
                <p className="text-xs text-ink-500 font-semibold mt-1">Carbs</p>
                <div className="mt-3 h-1.5 rounded-full bg-sand-200 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-blue-700 font-bold mt-1">{carbsConsumed}g consumed</p>
              </div>
              <div className="p-4 rounded-2xl bg-sand-100/80">
                <div className="text-2xl font-extrabold text-ink tracking-tight">{activePlan.fats}g</div>
                <p className="text-xs text-ink-500 font-semibold mt-1">Fats</p>
                <div className="mt-3 h-1.5 rounded-full bg-sand-200 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, caloriesPercent)}%` }} />
                </div>
                <p className="text-[10px] text-violet-700 font-bold mt-1">{fatsConsumed}g consumed</p>
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
                <div className="w-8 h-8 rounded-xl bg-forest-200/30 flex items-center justify-center">
                  <Apple className="h-4 w-4 text-forest-900" />
                </div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">Today's Meals</CardTitle>
              </div>
              <Button onClick={() => setIsPlanOpen(true)} variant="ghost" className="text-forest-900 hover:bg-forest-900/5 rounded-full text-sm font-medium">
                View Full Plan
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMeals.length === 0 && (
              <div className="rounded-2xl bg-sand-100/60 p-6 text-center">
                <p className="font-bold text-ink text-sm">{hasPlan ? 'Your plan has no meals yet' : 'No diet plan yet'}</p>
                <p className="mt-1 text-sm text-ink-500">
                  Your dietitian will generate a personalised plan after your consultation. Meanwhile, ask Ayu about foods that suit your prakriti.
                </p>
                <Button onClick={() => navigate('/assistant')} variant="outline" className="mt-4 rounded-full">Ask Ayu</Button>
              </div>
            )}
            {todayMeals.map((meal, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  meal.status === 'completed' 
                    ? 'bg-forest-200/20 hover:bg-forest-200/30' 
                    : 'bg-sand-100/60 hover:bg-sand-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      meal.status === 'completed' ? 'bg-forest-900/10 text-forest-900' : 'bg-sand-200/60 text-ink-500'
                    }`}>
                      {meal.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold tracking-wider uppercase text-ink-500">
                          {meal.meal}
                        </p>
                        <span className="text-[10px] text-forest-700 font-bold">• {meal.time}</span>
                      </div>
                      <p className="font-bold text-ink text-sm mt-0.5">{meal.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-ink">{meal.calories}</p>
                    <p className="text-[10px] text-ink-500 font-medium">kcal</p>
                  </div>
                </div>
                {meal.status === 'completed' ? (
                  <div className="mt-2 ml-13">
                    <Badge className="bg-forest-900/10 text-forest-900 border-0 rounded-full text-[10px] font-bold px-2.5">
                      ✓ Completed
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-2 ml-13">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkMealComplete(index)}
                      className="border-forest-900/20 text-forest-900 hover:bg-forest-900/10 hover:border-forest-900/30 rounded-full h-7 text-[10px] uppercase font-bold px-3 transition-colors shadow-none"
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
            <div className="absolute inset-0 bg-gradient-to-br from-saffron-500/5 to-transparent pointer-events-none" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold text-ink-500 uppercase tracking-wider">Weekly Adherence</p>
                <TrendingUp className="h-5 w-5 text-saffron-600" />
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
                    <span className="text-3xl font-extrabold text-ink tracking-tight">{displayAdherence}%</span>
                    <span className="text-[10px] text-ink-500 font-bold uppercase">adherence</span>
                  </div>
                </div>
              </div>

              {/* Weekly Mini Chart */}
              <div className="flex items-end justify-between gap-1 h-12">
                {displayWeeklyProgress.map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className={`w-full rounded-full transition-all duration-500 ${val > 0 ? 'bg-gradient-to-t from-saffron-500 to-saffron-300' : 'bg-sand-200/60'}`}
                      style={{ height: `${(val / 100) * 48}px`, minHeight: '4px' }}
                    />
                    <span className="text-[9px] text-ink-500 font-bold">{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consultations */}
          <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100/30 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-ink tracking-tight">Consultations</CardTitle>
                  <CardDescription className="text-ink-500">Your dietitian check-ins</CardDescription>
                </div>
              </div>
            </CardHeader>
            {upcoming.length > 0 ? (
              <CardContent className="space-y-3">
                {upcoming.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-sand-100/60 p-3.5">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-forest-900 shadow-sm">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {new Date(a.appointment_date).toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                      <span className="text-base font-extrabold leading-tight">{new Date(a.appointment_date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">
                        {new Date(a.appointment_date).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="truncate text-sm text-ink-500">{a.notes || 'Consultation'}</p>
                    </div>
                  </div>
                ))}
                <Button onClick={() => navigate('/appointments')} variant="ghost" className="w-full rounded-full text-forest-900">
                  View all appointments <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            ) : (
              <CardContent className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-100/30 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-blue-700" aria-hidden="true" />
                </div>
                <p className="font-bold text-ink text-sm">No upcoming appointments</p>
                <p className="text-sm text-ink-500 mt-2 mb-5">
                  Your dietitian schedules check-ins. Past visits are listed under My Appointments.
                </p>
                <Button onClick={() => navigate('/appointments')} className="rounded-full bg-gradient-to-r from-forest-950 to-forest-900 hover:from-forest-950 hover:to-forest-800 text-white shadow-lg shadow-forest-900/20 px-6 font-medium">
                  My Appointments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Dosha Tips & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dosha Tips */}
        <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-200/10 to-transparent pointer-events-none" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-forest-200/30 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-forest-900" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-ink tracking-tight">{baseDosha || 'Dosha'}-Balancing Tips</CardTitle>
                <CardDescription className="text-ink-500">
                  Personalized for your dosha type
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            {doshaTips.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3.5 rounded-2xl bg-sand-100/60 hover:bg-sand-100 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 flex items-center justify-center text-forest-900 mt-0.5 shrink-0">
                  {item.icon}
                </div>
                <p className="text-sm text-ink-700 leading-relaxed font-medium">
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
                <div className="w-8 h-8 rounded-xl bg-violet-100/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-violet-700" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-ink tracking-tight">My Progress</CardTitle>
                  <CardDescription className="text-ink-500">Your wellness journey over time</CardDescription>
                </div>
              </div>
              <Button onClick={() => setIsProgressOpen(true)} size="sm" className="bg-violet-100/50 text-violet-700 hover:bg-violet-100 rounded-full border-0 font-bold hover:shadow-sm">
                + Log Progress
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-sand-100/80 text-center">
                <div className="text-2xl font-extrabold text-ink tracking-tight">{weeksActive || 0}</div>
                <p className="text-[10px] text-ink-500 font-bold uppercase mt-1">Weeks Active</p>
              </div>
              <div className="p-4 rounded-2xl bg-sand-100/80 text-center">
                <div className="text-2xl font-extrabold text-forest-900 tracking-tight">{weightChange > 0 ? '+' : ''}{weightChange}kg</div>
                <p className="text-[10px] text-ink-500 font-bold uppercase mt-1">Weight Change</p>
              </div>
              <div className="p-4 rounded-2xl bg-sand-100/80 text-center">
                <div className="text-2xl font-extrabold text-saffron-600 tracking-tight">{displayAdherence}%</div>
                <p className="text-[10px] text-ink-500 font-bold uppercase mt-1">Avg Adherence</p>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="p-4 rounded-2xl bg-sand-100/60">
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-4">
                Adherence Trend (Last {Math.min(4, progressLogs.length) || 4} Weeks)
              </p>
              {progressLogs.length === 0 ? (
                <p className="text-sm text-ink-500">No weeks logged yet. Use “Log Progress” after your first week on the plan.</p>
              ) : (
                <div className="flex items-end justify-between gap-3 h-24">
                  {progressLogs.slice(-4).map((log) => (
                    <div key={log.id} className="flex flex-col items-center gap-2 flex-1">
                      <span className="text-xs font-extrabold text-ink">{log.adherence_score}%</span>
                      <div
                        className="w-full rounded-2xl bg-gradient-to-t from-forest-950 to-forest-700 transition-all duration-700"
                        style={{ height: `${Math.max(4, (log.adherence_score / 100) * 80)}px` }}
                      />
                      <span className="text-[10px] text-ink-500 font-bold">W{log.week_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health Achievements (derived from logged weeks) */}
            {progressLogs.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-forest-200/30 text-forest-900 border-0 rounded-full text-xs font-bold px-3 py-1">
                  🌿 {progressLogs.length}-Week Streak
                </Badge>
                {weeklyProgress[weeklyProgress.length - 1] > weeklyProgress[0] && (
                  <Badge className="bg-saffron-200/30 text-saffron-700 border-0 rounded-full text-xs font-bold px-3 py-1">
                    🔥 Improving Adherence
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Full Plan Modal */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white/95 backdrop-blur-xl border-0 rounded-[2rem] shadow-[0_8px_40px_rgba(28,28,26,0.08)]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-ink">Complete {activePlan.prakriti} Plan</DialogTitle>
            <p className="text-sm text-ink-500 mt-1">
              Your personalized {activePlan.calories}kcal daily nutrition guide.
            </p>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {todayMeals.map((meal, index) => (
              <div key={index} className="p-4 rounded-2xl bg-sand-100/80 border border-sand-200/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-forest-900">
                    {meal.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">{meal.meal} <span className="text-xs text-forest-700 font-normal ml-2">{meal.time}</span></h3>
                    <p className="text-sm text-ink-500 font-medium mt-0.5">{meal.name}</p>
                  </div>
                </div>
                <div className="pl-13">
                  <Badge className="bg-white/60 text-forest-900 border border-sand-200/50 font-bold">
                    {meal.calories} kcal
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-forest-200/20 to-transparent">
              <p className="text-sm font-bold text-forest-900 mb-1">Hydration Goal</p>
              <p className="text-xs text-ink-500 font-medium">Drink 2-3 liters of warm water throughout the day, sipping slowly. Avoid ice water with meals.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Progress Modal */}
      <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
        <DialogContent className="max-w-md sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-0 rounded-[2rem] shadow-[0_8px_40px_rgba(28,28,26,0.08)]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold text-ink">Log Today's Journey</DialogTitle>
            <p className="text-sm text-ink-500 mt-1">
              Update your symptoms and adherence. Your dietitian will review it when they are online!
            </p>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-ink-700">Adherence Score ({progressForm.adherence}%)</Label>
                <Badge className="bg-violet-100/50 text-violet-700 border-0">
                  {progressForm.adherence > 85 ? 'Excellent' : progressForm.adherence > 65 ? 'Good' : 'Needs Focus'}
                </Badge>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={progressForm.adherence} 
                onChange={(e) => setProgressForm({...progressForm, adherence: parseInt(e.target.value)})}
                className="w-full h-2 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-saffron-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink-700">Current Weight (Optional)</Label>
              <Input 
                value={progressForm.weight} 
                onChange={(e) => setProgressForm({...progressForm, weight: e.target.value})} 
                placeholder="e.g. 70 kg" 
                className="rounded-xl border-sand-200 bg-sand-100/50 h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink-700">Symptoms experienced today?</Label>
              <Input 
                value={progressForm.symptoms} 
                onChange={(e) => setProgressForm({...progressForm, symptoms: e.target.value})} 
                placeholder="e.g. slight bloating, high energy" 
                className="rounded-xl border-sand-200 bg-sand-100/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-ink-700">Journal / Notes</Label>
              <textarea 
                value={progressForm.notes} 
                onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})} 
                placeholder="How are you feeling about the diet mentally?" 
                className="w-full flex min-h-[80px] rounded-xl border border-sand-200 bg-sand-100/50 px-3 py-2 text-sm ring-offset-white placeholder:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <Button onClick={handleLogProgress} disabled={savingProgress} className="w-full rounded-xl bg-gradient-to-r from-forest-950 to-forest-900 text-white hover:from-forest-900 hover:to-forest-800 h-12 shadow-lg shadow-forest-900/20 font-bold text-base">
            Submit Progress
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
