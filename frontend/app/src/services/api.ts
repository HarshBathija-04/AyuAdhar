// AyuAahar - typed client for the Flask API (only the endpoints the app calls)
import axios from 'axios';
import type {
  User,
  Patient,
  DietPlan,
  Appointment,
  ProgressLog,
  FoodItem,
  LoginCredentials,
  RegisterData,
  CalendarEvent,
  DashboardStats,
  ChatMessage,
  ChatResponse,
  PatientMyData,
} from '@/types';
import { startRequestTimer } from '@/lib/serverStatus';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _settle?: () => void;
  }
}

const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
  // Render's free tier can take ~60s to cold start
  timeout: 90_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config._settle = startRequestTimer();
  return config;
});

client.interceptors.response.use(
  (response) => {
    response.config._settle?.();
    return response;
  },
  (error) => {
    error.config?._settle?.();
    // Only an expired session should bounce to /login; a failed sign-in must show its own error
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  },
);

const get = <T>(url: string, params?: object) => client.get<T>(url, { params }).then((r) => r.data);
const post = <T>(url: string, body?: unknown) => client.post<T>(url, body).then((r) => r.data);
const put = <T>(url: string, body: unknown) => client.put<T>(url, body).then((r) => r.data);

type Session = { user: User; token: string };

const api = {
  login: (credentials: LoginCredentials) => post<Session>('/login', credentials),
  register: (data: RegisterData) => post<Session>('/register', data),
  getProfile: () => get<{ user: User }>('/profile'),
  updateProfile: (data: { name: string }) => put<{ message: string; user: User }>('/profile', data),

  getPatientMyData: () => get<PatientMyData>('/patient/my-data'),
  getPatients: (params?: { prakriti?: string; search?: string }) =>
    get<{ patients: Patient[]; count: number }>('/patients', params),
  getPatient: (id: number) => get<{ patient: Patient }>(`/patients/${id}`),
  createPatient: (data: Partial<Patient>) => post<{ patient: Patient; message: string }>('/patients', data),
  updatePatient: (id: number, data: Partial<Patient>) =>
    put<{ patient: Patient; message: string }>(`/patients/${id}`, data),
  deletePatient: (id: number) => client.delete<{ message: string }>(`/patients/${id}`).then((r) => r.data),
  getPatientStats: () => get<DashboardStats>('/patients/stats'),

  getAppointments: (params?: {
    status?: string;
    patient_id?: number;
    date_from?: string;
    date_to?: string;
  }) => get<{ appointments: Appointment[]; count: number }>('/appointments', params),
  createAppointment: (data: Partial<Appointment>) =>
    post<{ appointment: Appointment; message: string }>('/appointments', data),
  updateAppointment: (id: number, data: Partial<Appointment>) =>
    put<{ appointment: Appointment; message: string }>(`/appointments/${id}`, data),
  getCalendarEvents: (year: number, month: number) =>
    get<{ year: number; month: number; events: CalendarEvent[] }>('/appointments/calendar', { year, month }),
  getAppointmentStats: () => get<Partial<DashboardStats>>('/appointments/stats'),

  getPatientDietPlan: (patientId: number) =>
    get<{ diet_plan: DietPlan | null; message?: string }>(`/diet-plan/${patientId}`),
  generateDietPlan: (patientId: number, planName?: string) =>
    post<{ diet_plan: DietPlan; message: string }>(`/generate-diet-plan/${patientId}`, {
      plan_name: planName,
    }),
  getDietReport: (dietPlanId: number) =>
    get<{ report: unknown; message: string }>(`/diet-plans/${dietPlanId}/report`),

  getFoodItems: (params?: {
    category?: string;
    meal_type?: string;
    suitable_for?: string;
    search?: string;
  }) => get<{ food_items: FoodItem[]; count: number }>('/food-items', params),
  createFoodItem: (data: Partial<FoodItem>) =>
    post<{ food_item: FoodItem; message: string }>('/food-items', data),

  createProgressLog: (data: Partial<ProgressLog>) =>
    post<{ progress_log: ProgressLog; message: string }>('/progress', data),

  // AI wellness assistant (Groq, proxied by the backend)
  chat: (messages: ChatMessage[], patientId?: number) =>
    post<ChatResponse>('/ai/chat', { messages, patient_id: patientId }),
};

export default api;
