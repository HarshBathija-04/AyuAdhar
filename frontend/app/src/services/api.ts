// AyuAahar - API Service
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { User, Patient, DietPlan, Appointment, ProgressLog, FoodItem, LoginCredentials, RegisterData, CalendarEvent, DashboardStats } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response: AxiosResponse = await this.client.post('/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response: AxiosResponse = await this.client.post('/register', data);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response: AxiosResponse = await this.client.get('/profile');
    return response.data;
  }

  async updateProfile(data: { name: string }): Promise<{ message: string; user: User }> {
    const response: AxiosResponse = await this.client.put('/profile', data);
    return response.data;
  }

  // Patient self endpoints
  async getPatientMyData(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/patient/my-data');
    return response.data;
  }

  // Patient endpoints
  async getPatients(params?: { prakriti?: string; search?: string }): Promise<{ patients: Patient[]; count: number }> {
    const response: AxiosResponse = await this.client.get('/patients', { params });
    return response.data;
  }

  async getPatient(id: number): Promise<{ patient: Patient }> {
    const response: AxiosResponse = await this.client.get(`/patients/${id}`);
    return response.data;
  }

  async createPatient(data: Partial<Patient>): Promise<{ patient: Patient; message: string }> {
    const response: AxiosResponse = await this.client.post('/patients', data);
    return response.data;
  }

  async updatePatient(id: number, data: Partial<Patient>): Promise<{ patient: Patient; message: string }> {
    const response: AxiosResponse = await this.client.put(`/patients/${id}`, data);
    return response.data;
  }

  async deletePatient(id: number): Promise<{ message: string }> {
    const response: AxiosResponse = await this.client.delete(`/patients/${id}`);
    return response.data;
  }

  async getPatientStats(): Promise<DashboardStats> {
    const response: AxiosResponse = await this.client.get('/patients/stats');
    return response.data;
  }

  // Appointment endpoints
  async getAppointments(params?: { status?: string; patient_id?: number; date_from?: string; date_to?: string }): Promise<{ appointments: Appointment[]; count: number }> {
    const response: AxiosResponse = await this.client.get('/appointments', { params });
    return response.data;
  }

  async createAppointment(data: Partial<Appointment>): Promise<{ appointment: Appointment; message: string }> {
    const response: AxiosResponse = await this.client.post('/appointments', data);
    return response.data;
  }

  async updateAppointment(id: number, data: Partial<Appointment>): Promise<{ appointment: Appointment; message: string }> {
    const response: AxiosResponse = await this.client.put(`/appointments/${id}`, data);
    return response.data;
  }

  async deleteAppointment(id: number): Promise<{ message: string }> {
    const response: AxiosResponse = await this.client.delete(`/appointments/${id}`);
    return response.data;
  }

  async getCalendarEvents(year: number, month: number): Promise<{ year: number; month: number; events: CalendarEvent[] }> {
    const response: AxiosResponse = await this.client.get('/appointments/calendar', { params: { year, month } });
    return response.data;
  }

  async getAppointmentStats(): Promise<Partial<DashboardStats>> {
    const response: AxiosResponse = await this.client.get('/appointments/stats');
    return response.data;
  }

  // Diet Plan endpoints
  async getDietPlans(params?: { patient_id?: number; is_active?: boolean }): Promise<{ diet_plans: DietPlan[]; count: number }> {
    const response: AxiosResponse = await this.client.get('/diet-plans', { params });
    return response.data;
  }

  async getDietPlan(id: number): Promise<{ diet_plan: DietPlan }> {
    const response: AxiosResponse = await this.client.get(`/diet-plans/${id}`);
    return response.data;
  }

  async getPatientDietPlan(patientId: number): Promise<{ diet_plan: DietPlan | null; message?: string }> {
    const response: AxiosResponse = await this.client.get(`/diet-plan/${patientId}`);
    return response.data;
  }

  async generateDietPlan(patientId: number, planName?: string): Promise<{ diet_plan: DietPlan; message: string }> {
    const response: AxiosResponse = await this.client.post(`/generate-diet-plan/${patientId}`, { plan_name: planName });
    return response.data;
  }

  async updateDietPlan(id: number, data: Partial<DietPlan>): Promise<{ diet_plan: DietPlan; message: string }> {
    const response: AxiosResponse = await this.client.put(`/diet-plans/${id}`, data);
    return response.data;
  }

  async deleteDietPlan(id: number): Promise<{ message: string }> {
    const response: AxiosResponse = await this.client.delete(`/diet-plans/${id}`);
    return response.data;
  }

  async getDietReport(dietPlanId: number): Promise<{ report: unknown; message: string }> {
    const response: AxiosResponse = await this.client.get(`/diet-plans/${dietPlanId}/report`);
    return response.data;
  }

  // Food Items endpoints
  async getFoodItems(params?: { category?: string; meal_type?: string; suitable_for?: string; search?: string }): Promise<{ food_items: FoodItem[]; count: number }> {
    const response: AxiosResponse = await this.client.get('/food-items', { params });
    return response.data;
  }

  async getFoodItem(id: number): Promise<{ food_item: FoodItem }> {
    const response: AxiosResponse = await this.client.get(`/food-items/${id}`);
    return response.data;
  }

  async createFoodItem(data: Partial<FoodItem>): Promise<{ food_item: FoodItem; message: string }> {
    const response: AxiosResponse = await this.client.post('/food-items', data);
    return response.data;
  }

  // Progress endpoints
  async getProgressLogs(patientId?: number): Promise<{ progress_logs: ProgressLog[]; count: number }> {
    const params = patientId ? { patient_id: patientId } : {};
    const response: AxiosResponse = await this.client.get('/progress', { params });
    return response.data;
  }

  async createProgressLog(data: Partial<ProgressLog>): Promise<{ progress_log: ProgressLog; message: string }> {
    const response: AxiosResponse = await this.client.post('/progress', data);
    return response.data;
  }

  async updateProgressLog(id: number, data: Partial<ProgressLog>): Promise<{ progress_log: ProgressLog; message: string }> {
    const response: AxiosResponse = await this.client.put(`/progress/${id}`, data);
    return response.data;
  }

  async deleteProgressLog(id: number): Promise<{ message: string }> {
    const response: AxiosResponse = await this.client.delete(`/progress/${id}`);
    return response.data;
  }

  async getProgressStats(patientId: number): Promise<{ stats: unknown }> {
    const response: AxiosResponse = await this.client.get(`/progress/${patientId}/stats`);
    return response.data;
  }

  async getProgressReport(patientId: number): Promise<{ report: unknown; message: string }> {
    const response: AxiosResponse = await this.client.get(`/progress/${patientId}/report`);
    return response.data;
  }

  // Nutrition Analysis
  async analyzeNutrition(foodItems: { food_id: number; quantity: number }[]): Promise<{
    total_nutrition: { calories: number; protein: number; carbs: number; fats: number; fiber: number };
    ayurvedic_summary: unknown;
    food_details: unknown[];
  }> {
    const response: AxiosResponse = await this.client.post('/analyze-nutrition', { food_items: foodItems });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response: AxiosResponse = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiService();
export default api;
