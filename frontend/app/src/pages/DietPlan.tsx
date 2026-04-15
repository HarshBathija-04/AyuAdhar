// AyuAahar - Diet Plan Page
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Patient, DietPlan as DietPlanType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Utensils, 
  Download, 
  RefreshCw, 
  Loader2,
  Leaf,
  Flame,
  Droplets,
  Wind,
  Scale,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function DietPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlanType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patient
      const patientResponse = await api.getPatient(Number(id));
      setPatient(patientResponse.patient);
      
      // Fetch diet plan
      const dietPlanResponse = await api.getPatientDietPlan(Number(id));
      setDietPlan(dietPlanResponse.diet_plan);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load diet plan');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setIsGenerating(true);
      const response = await api.generateDietPlan(Number(id), 'Personalized Diet Plan');
      setDietPlan(response.diet_plan);
      toast.success('Diet plan generated successfully');
    } catch (error) {
      console.error('Error generating diet plan:', error);
      toast.error('Failed to generate diet plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!dietPlan) return;
    
    try {
      const response = await api.getDietReport(dietPlan.id);
      
      // Create and download JSON report
      const reportData = JSON.stringify(response.report, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diet-report-${patient?.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  // Ayurvedic balance chart data
  const ayurvedicChartData = dietPlan ? {
    labels: ['Vata', 'Pitta', 'Kapha'],
    datasets: [
      {
        label: 'Dosha Balance',
        data: [
          Math.abs(dietPlan.vata_score) + 5,
          Math.abs(dietPlan.pitta_score) + 5,
          Math.abs(dietPlan.kapha_score) + 5,
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        borderWidth: 2,
        pointBackgroundColor: '#10b981',
      },
    ],
  } : null;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
            <h1 className="text-3xl font-bold text-gray-800">
              Diet Plan - {patient?.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getPrakritiColor(patient?.prakriti || '')}>
                {patient?.prakriti}
              </Badge>
              {dietPlan && (
                <span className="text-sm text-gray-500">
                  Generated on {new Date(dietPlan.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePlan} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
          {dietPlan && (
            <Button onClick={downloadReport} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {dietPlan ? (
        <>
          {/* BMI + Nutritional Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* BMI Card */}
            {dietPlan.plan_data?.bmi_info && (() => {
              const bmi = dietPlan.plan_data.bmi_info;
              const catColor =
                bmi.category === 'Underweight' ? 'text-blue-600' :
                bmi.category === 'Normal'      ? 'text-green-600' :
                bmi.category === 'Overweight'  ? 'text-amber-600' :
                'text-red-600';
              const bgColor =
                bmi.category === 'Underweight' ? 'bg-blue-50' :
                bmi.category === 'Normal'      ? 'bg-green-50' :
                bmi.category === 'Overweight'  ? 'bg-amber-50' :
                'bg-red-50';
              return (
                <Card className={`col-span-2 md:col-span-1 ${bgColor} border-0`}>
                  <CardContent className="pt-6 text-center">
                    <Scale className={`mx-auto h-5 w-5 mb-1 ${catColor}`} />
                    <div className={`text-3xl font-bold ${catColor}`}>{bmi.bmi}</div>
                    <p className="text-sm font-medium text-gray-700">BMI</p>
                    <p className={`text-xs font-semibold mt-1 ${catColor}`}>{bmi.category}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bmi.weight_kg} kg · {bmi.height_cm} cm
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(dietPlan.plan_data?.total_nutrition?.target_calories ?? dietPlan.total_calories)}
                </div>
                <p className="text-sm text-gray-600">Target Cal</p>
                <p className="text-xs text-gray-400">
                  got {Math.round(dietPlan.total_calories)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(dietPlan.total_protein)}g
                </div>
                <p className="text-sm text-gray-600">Protein</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-amber-600">
                  {Math.round(dietPlan.total_carbs)}g
                </div>
                <p className="text-sm text-gray-600">Carbs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(dietPlan.total_fats)}g
                </div>
                <p className="text-sm text-gray-600">Fats</p>
              </CardContent>
            </Card>
          </div>

          {/* Ayurvedic Balance & Meal Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ayurvedic Balance */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Ayurvedic Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ayurvedicChartData && (
                  <div className="h-48">
                    <Radar 
                      data={ayurvedicChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 10,
                            ticks: {
                              display: false,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-green-600" />
                      <span>Vata</span>
                    </div>
                    <span className="font-medium">{dietPlan.vata_score}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-600" />
                      <span>Pitta</span>
                    </div>
                    <span className="font-medium">{dietPlan.pitta_score}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      <span>Kapha</span>
                    </div>
                    <span className="font-medium">{dietPlan.kapha_score}</span>
                  </div>
                </div>

                {dietPlan.plan_data?.ayurvedic_balance?.balance_status && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Status: {dietPlan.plan_data.ayurvedic_balance.balance_status}
                    </p>
                  </div>
                )}

                {dietPlan.plan_data?.prakriti_guidelines && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      {dietPlan.plan_data.prakriti_guidelines}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meal Plan */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-green-600" />
                  Daily Meal Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dietPlan.plan_data?.meal_plan ? (
                  <Tabs defaultValue="breakfast" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                      <TabsTrigger value="lunch">Lunch</TabsTrigger>
                      <TabsTrigger value="dinner">Dinner</TabsTrigger>
                      <TabsTrigger value="snacks">Snacks</TabsTrigger>
                    </TabsList>
                    
                    {Object.entries(dietPlan.plan_data.meal_plan).map(([meal, data]) => (
                      <TabsContent key={meal} value={meal}>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold capitalize text-lg">{meal}</h4>
                            <Badge variant="outline" className="text-green-600">
                              {Math.round(data.total_calories)} cal
                            </Badge>
                          </div>
                          
                          {data.recommendations && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {data.recommendations}
                            </p>
                          )}
                          
                          <div className="space-y-2">
                            {data.foods.map((food: { name: string; calories: number; quantity: string }, idx: number) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Utensils className="h-4 w-4 text-green-600" />
                                  </div>
                                  <span className="font-medium">{food.name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{food.quantity}</p>
                                  <p className="text-xs text-gray-500">{Math.round(food.calories)} cal</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <p className="text-gray-500 text-center py-8">No meal plan data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dataset Recommendations */}
          {dietPlan.plan_data?.dataset_recommendations && Object.keys(dietPlan.plan_data.dataset_recommendations).some(k => !!dietPlan.plan_data.dataset_recommendations![k as keyof typeof dietPlan.plan_data.dataset_recommendations]) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                  <BookOpen className="h-5 w-5" />
                  Ayurvedic Protocol (from Dataset)
                  {dietPlan.plan_data.dataset_recommendations.disease_match && (
                    <Badge className="bg-amber-200 text-amber-900 ml-2">
                      {dietPlan.plan_data.dataset_recommendations.disease_match}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Evidence-based recommendations matched from the Ayurvedic clinical dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dietPlan.plan_data.dataset_recommendations.diet_advice && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Diet &amp; Lifestyle</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.diet_advice}</p>
                    </div>
                  )}
                  {dietPlan.plan_data.dataset_recommendations.ayurvedic_herbs && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Ayurvedic Herbs</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.ayurvedic_herbs}</p>
                    </div>
                  )}
                  {dietPlan.plan_data.dataset_recommendations.formulation && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Formulation</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.formulation}</p>
                    </div>
                  )}
                  {dietPlan.plan_data.dataset_recommendations.yoga_therapy && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Yoga &amp; Therapy</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.yoga_therapy}</p>
                    </div>
                  )}
                  {dietPlan.plan_data.dataset_recommendations.prevention && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Prevention</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.prevention}</p>
                    </div>
                  )}
                  {dietPlan.plan_data.dataset_recommendations.patient_recommendations && (
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Patient Tips</p>
                      <p className="text-sm text-gray-700">{dietPlan.plan_data.dataset_recommendations.patient_recommendations}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Food Items */}
          {dietPlan.foods && dietPlan.foods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended Foods</CardTitle>
                <CardDescription>Foods selected based on Ayurvedic principles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dietPlan.foods.map((food, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{food.name}</h4>
                        <Badge variant="outline">{food.category}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{Math.round(food.calories)} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g</p>
                        <p className="text-xs">
                          Rasa: {food.rasa} | Virya: {food.virya}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Utensils className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Diet Plan</h3>
            <p className="mt-1 text-gray-500">
              Generate a personalized Ayurvedic diet plan for {patient?.name}
            </p>
            <Button 
              onClick={generatePlan} 
              className="mt-4 bg-green-600 hover:bg-green-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Utensils className="mr-2 h-4 w-4" />
              )}
              Generate Diet Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
