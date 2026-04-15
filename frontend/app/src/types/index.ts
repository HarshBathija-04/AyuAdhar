// AyuAahar - TypeScript Type Definitions

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'dietitian' | 'patient';
  created_at?: string;
}

export interface Patient {
  id: number;
  user_id: number;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight_kg?: number;
  height_cm?: number;
  prakriti: PrakritiType;
  condition?: string;
  lifestyle?: string;
  created_at?: string;
  updated_at?: string;
  diet_plans?: DietPlan[];
  appointments?: Appointment[];
  progress_logs?: ProgressLog[];
}

export type PrakritiType = 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Vata-Kapha' | 'Pitta-Kapha' | 'Tridosha';

export interface FoodItem {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  rasa: string;
  guna: string;
  virya: 'heating' | 'cooling';
  vipaka: 'sweet' | 'sour' | 'pungent';
  vata_effect: number;
  pitta_effect: number;
  kapha_effect: number;
  suitable_for: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
}

export interface MealPlan {
  foods: { name: string; calories: number; quantity: string }[];
  total_calories: number;
  target_calories?: number;
  recommendations: string;
}

export interface DietPlan {
  id: number;
  patient_id: number;
  plan_name: string;
  plan_data: {
    meal_plan: {
      breakfast: MealPlan;
      lunch: MealPlan;
      dinner: MealPlan;
      snacks: MealPlan;
    };
    total_nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      fiber: number;
      target_calories?: number;
    };
    ayurvedic_balance: {
      vata: number;
      pitta: number;
      kapha: number;
      vata_percentage: number;
      pitta_percentage: number;
      kapha_percentage: number;
      balance_status: string;
    };
    prakriti_guidelines: string;
    bmi_info?: {
      bmi: number;
      category: string;
      weight_kg: number;
      height_cm: number;
    };
    dataset_recommendations?: {
      disease_match?: string;
      diet_advice?: string;
      yoga_therapy?: string;
      ayurvedic_herbs?: string;
      formulation?: string;
      prevention?: string;
      patient_recommendations?: string;
    };
  };
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  vata_score: number;
  pitta_score: number;
  kapha_score: number;
  is_active: boolean;
  created_at: string;
  foods?: FoodItem[];
}

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  appointment_date: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface ProgressLog {
  id: number;
  patient_id: number;
  week_number: number;
  adherence_score: number;
  weight?: number;
  notes?: string;
  symptoms?: string;
  created_at?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  status: string;
  patient_id: number;
  patient_name: string;
}

export interface DashboardStats {
  total_patients: number;
  prakriti_distribution: { prakriti: string; count: number }[];
  recent_patients: number;
  total_appointments: number;
  upcoming_this_week: number;
  status_breakdown: { status: string; count: number }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: 'dietitian' | 'patient';
  age?: string | number;
  gender?: string;
  prakriti?: string;
  condition?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}
