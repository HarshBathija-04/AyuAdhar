import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateProfile({ name });
      toast.success('Profile updated successfully! Next time you login, the new name will appear.', {
        style: { background: '#1b4332', color: 'white', border: 'none' }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
      <div>
        <h1 className="text-3xl font-bold text-[#1c1c1a] tracking-tight">My Profile</h1>
        <p className="text-[#717973] mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Manage your personal information</p>
      </div>

      <Card className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/70 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-[#f6f3ef]/50 border-b border-[#e5e2de] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center shadow-lg shadow-[#1b4332]/20">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#1c1c1a]">{user?.name}</CardTitle>
              <CardDescription className="text-[#717973] uppercase tracking-wider text-xs font-bold mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {user?.role} Account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#414844] font-bold">Full Name</Label>
              <div className="relative">
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="pl-10 rounded-xl border-[#e5e2de] h-12 bg-[#f6f3ef]/50" 
                />
                <User className="absolute left-3 top-3.5 h-5 w-5 text-[#a5d0b9]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#414844] font-bold">Email Address</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="pl-10 rounded-xl border-[#e5e2de] h-12 bg-[#e5e2de]/30 text-[#717973] cursor-not-allowed" 
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-[#a5d0b9]" />
              </div>
              <p className="text-xs text-[#717973] font-medium mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Email cannot be changed after registration.
              </p>
            </div>

            <div className="space-y-2 pb-4">
              <Label htmlFor="role" className="text-[#414844] font-bold">Account Role</Label>
              <div className="relative">
                <Input 
                  id="role" 
                  value={user?.role || ''} 
                  disabled 
                  className="pl-10 rounded-xl border-[#e5e2de] h-12 bg-[#e5e2de]/30 text-[#717973] cursor-not-allowed capitalize" 
                />
                <Shield className="absolute left-3 top-3.5 h-5 w-5 text-[#a5d0b9]" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || name === user?.name}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white hover:from-[#1b4332] hover:to-[#274e3d] h-11 px-8 shadow-lg shadow-[#1b4332]/20 font-bold"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
