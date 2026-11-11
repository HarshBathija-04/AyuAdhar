// AyuAahar - Register Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Lock } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'dietitian' | 'patient'>('dietitian');
  
  // Patient specific details
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [condition, setCondition] = useState('');
  
  const [localError, setLocalError] = useState('');
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!name || !email || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (role === 'patient') {
      if (!age || !gender || !weightKg || !heightCm) {
        setLocalError('Please complete all required wellness profile fields');
        return;
      }
    }

    setIsLoading(true);
    try {
      const isPatient = role === 'patient';
      await register({
        name, email: email.trim(), password, role,
        age: isPatient ? Number(age) : undefined,
        gender: isPatient ? gender : undefined,
        prakriti: isPatient ? prakriti || undefined : undefined,
        condition: isPatient ? condition : undefined,
        weight_kg: isPatient && weightKg ? parseFloat(weightKg) : undefined,
        height_cm: isPatient && heightCm ? parseFloat(heightCm) : undefined,
      });
      toast.success('Account created. Welcome to AyuAahar!');
      navigate('/dashboard');
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex w-fit" aria-label="AyuAahar home">
          <Logo />
        </Link>

        <Card className="rounded-[2rem] border-0 shadow-lift">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-extrabold text-ink">Create your account</CardTitle>
            <CardDescription>
              Dietitians get a practice workspace; patients get a personal wellness dashboard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {localError && (
                <Alert variant="destructive">
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-ink-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>I am a</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as 'dietitian' | 'patient')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dietitian" id="dietitian" />
                    <Label htmlFor="dietitian" className="cursor-pointer">Dietitian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="patient" id="patient" />
                    <Label htmlFor="patient" className="cursor-pointer">Patient</Label>
                  </div>
                </RadioGroup>
              </div>

              {role === 'patient' && (
                <div className="space-y-4 pt-4 mt-2 border-t border-sand-200 animate-in fade-in duration-300">
                  <p className="text-sm font-bold text-ink">Your Wellness Profile</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="e.g. 28"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="1" max="120"
                        required={role === 'patient'}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender} required={role === 'patient'}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        placeholder="e.g. 65"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        min="1" max="300" step="0.1"
                        required={role === 'patient'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height_cm">Height (cm)</Label>
                      <Input
                        id="height_cm"
                        type="number"
                        placeholder="e.g. 165"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        min="50" max="250" step="0.1"
                        required={role === 'patient'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prakriti">Primary Dosha / Prakriti (Optional)</Label>
                    <Select value={prakriti} onValueChange={setPrakriti}>
                      <SelectTrigger id="prakriti">
                        <SelectValue placeholder="I don't know my Dosha yet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vata">Vata (Air & Space)</SelectItem>
                        <SelectItem value="Pitta">Pitta (Fire & Water)</SelectItem>
                        <SelectItem value="Kapha">Kapha (Earth & Water)</SelectItem>
                        <SelectItem value="Vata-Pitta">Vata-Pitta</SelectItem>
                        <SelectItem value="Pitta-Kapha">Pitta-Kapha</SelectItem>
                        <SelectItem value="Vata-Kapha">Vata-Kapha</SelectItem>
                        <SelectItem value="Tridosha">Tridosha (balanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label htmlFor="condition">Health Conditions / Suffering With (Optional)</Label>
                    <Input
                      id="condition"
                      placeholder="e.g. Acid Reflux, Joint Pain, Indigestion"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-forest-950 to-forest-900 text-base hover:to-forest-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-sm text-center text-ink-700">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-forest-900 underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
