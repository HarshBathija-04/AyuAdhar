// AyuAahar - Appointments Page
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import type { Appointment, Patient, CalendarEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Appointments() {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setSelectedDate] = useState<Date | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    patient_id: string;
    appointment_date: string;
    appointment_time: string;
    notes: string;
    status: 'pending' | 'completed' | 'cancelled';
  }>({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  useEffect(() => {
    // Check if patientId was passed from another page
    const patientId = location.state?.patientId;
    if (patientId) {
      setFormData(prev => ({ ...prev, patient_id: patientId.toString() }));
      setDialogOpen(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch appointments
      const appointmentsResponse = await api.getAppointments();
      // appointmentsResponse might be undefined if 403, but getAppointments returns { appointments: [] } for patients
      setAppointments(appointmentsResponse?.appointments || []);
      
      if (user?.role === 'dietitian') {
        // Fetch patients for dropdown (dietitian only)
        const patientsResponse = await api.getPatients();
        setPatients(patientsResponse?.patients || []);
        
        // Fetch calendar events (dietitian only)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const calendarResponse = await api.getCalendarEvents(year, month);
        setCalendarEvents(calendarResponse?.events || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in date and time');
      return;
    }

    if (user?.role === 'patient') {
      const dateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      const newMockAppt: Appointment = {
        id: Math.floor(Math.random() * 10000),
        patient_id: 1, // mock
        patient_name: user.name,
        appointment_date: dateTime.toISOString(),
        notes: formData.notes,
        status: 'pending'
      };
      
      setAppointments(prev => [newMockAppt, ...prev]);
      toast.success('Consultation requested successfully!');
      setDialogOpen(false);
      resetForm();
      return;
    }

    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    try {
      const dateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      await api.createAppointment({
        patient_id: parseInt(formData.patient_id),
        appointment_date: dateTime.toISOString(),
        notes: formData.notes,
        status: formData.status
      });
      
      toast.success('Appointment scheduled successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to schedule appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_date: '',
      appointment_time: '',
      notes: '',
      status: 'pending'
    });
    setSelectedDate(null);
  };

  const updateAppointmentStatus = async (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await api.updateAppointment(id, { status });
      toast.success(`Appointment ${status}`);
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setFormData(prev => ({
      ...prev,
      appointment_date: format(day, 'yyyy-MM-dd')
    }));
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-600">Manage your consultation schedule</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          {user?.role === 'patient' ? 'Request Appointment' : 'Schedule Appointment'}
        </Button>
      </div>

      {/* Calendar (Only for Dietitians) */}
      {user?.role === 'dietitian' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              Previous
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const events = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                    ${isToday ? 'bg-green-50 border-green-300' : 'bg-white'}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-green-700' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 mt-1">
                    {events.slice(0, 2).map((event, idx) => (
                      <div
                        key={idx}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${event.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                          ${event.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${event.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}
                      >
                        {event.time} {event.patient_name}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500">+{events.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.filter(a => a.status === 'pending').length > 0 ? (
            <div className="space-y-3">
              {appointments
                .filter(a => a.status === 'pending')
                .slice(0, 5)
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                          {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {user?.role === 'dietitian' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
          )}
        </CardContent>
      </Card>

      {/* Schedule Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{user?.role === 'patient' ? 'Request Consultation' : 'Schedule Appointment'}</DialogTitle>
            <DialogDescription>
              {user?.role === 'patient' ? 'Request a new consultation with your dietitian' : 'Book a new consultation appointment'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {user?.role === 'dietitian' && (
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any special notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {user?.role === 'patient' ? 'Request' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
