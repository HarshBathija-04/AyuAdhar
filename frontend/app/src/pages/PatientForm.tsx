// AyuAahar - Patient Form Page (Add/Edit)
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import type { Patient, PrakritiType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const PRAKRITI_OPTIONS: PrakritiType[] = [
  'Vata',
  'Pitta',
  'Kapha',
  'Vata-Pitta',
  'Vata-Kapha',
  'Pitta-Kapha',
  'Tridosha'
];

export default function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== 'new';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    age: undefined,
    gender: 'male',
    prakriti: 'Vata',
    condition: '',
    lifestyle: ''
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPatient(Number(id));
      const patient = response.patient;
      setFormData({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        prakriti: patient.prakriti,
        condition: patient.condition || '',
        lifestyle: patient.lifestyle || ''
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast.error('Failed to load patient data');
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.gender || !formData.prakriti) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditMode) {
        await api.updatePatient(Number(id), formData);
        toast.success('Patient updated successfully');
      } else {
        await api.createPatient(formData);
        toast.success('Patient created successfully');
      }
      
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(isEditMode ? 'Failed to update patient' : 'Failed to create patient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof Patient, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? 'Edit Patient' : 'Add New Patient'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update patient information' : 'Create a new patient record'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Patient's personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter patient's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Ayurvedic Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ayurvedic Assessment</CardTitle>
              <CardDescription>Patient's Ayurvedic constitution and health details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prakriti">Prakriti (Body Constitution) *</Label>
                <Select
                  value={formData.prakriti}
                  onValueChange={(value) => handleChange('prakriti', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prakriti type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRAKRITI_OPTIONS.map((prakriti) => (
                      <SelectItem key={prakriti} value={prakriti}>
                        {prakriti}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Prakriti determines the patient's natural body constitution
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Health Conditions</Label>
                <Textarea
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  placeholder="Describe any health conditions, allergies, or medical history..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifestyle">Lifestyle Details</Label>
                <Textarea
                  id="lifestyle"
                  value={formData.lifestyle}
                  onChange={(e) => handleChange('lifestyle', e.target.value)}
                  placeholder="Describe daily routine, work type, exercise habits, sleep patterns..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/patients')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Patient' : 'Create Patient'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
