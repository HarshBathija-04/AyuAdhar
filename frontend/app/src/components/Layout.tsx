// AyuAahar - Layout Component with Role-Based Sidebar (Stitch Digital Sanctuary Design)
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Apple,
  LogOut, 
  Menu,
  X,
  User,
  ChevronDown,
  Leaf,
  Heart,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// Dietitian navigation items
const dietitianNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/food-database', label: 'Food Database', icon: Apple },
];

// Patient navigation items - completely different set of features
const patientNavItems = [
  { path: '/dashboard', label: 'My Wellness', icon: Heart },
  { path: '/appointments', label: 'My Appointments', icon: Calendar },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Select navigation based on user role
  const navItems = user?.role === 'patient' ? patientNavItems : dietitianNavItems;
  const roleLabel = user?.role === 'patient' ? 'Patient' : 'Dietitian';
  const roleColor = user?.role === 'patient' ? 'text-[#D68C45]' : 'text-[#1b4332]';

  return (
    <div className="min-h-screen bg-[#fcf9f5] text-[#1c1c1a] flex" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white/70 backdrop-blur-2xl lg:m-4 lg:rounded-[2rem] shadow-[0_8px_40px_rgba(28,28,26,0.04)]
          transform transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] p-2.5 rounded-2xl shadow-lg shadow-[#1b4332]/20">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-[#012d1d] tracking-tight">AyuAahar</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-[#717973] hover:bg-[#1b4332]/5 rounded-full"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role Badge */}
        <div className="mx-6 mb-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            user?.role === 'patient' 
              ? 'bg-[#ffdcc1]/30 text-[#8c4f09]' 
              : 'bg-[#c1ecd4]/30 text-[#1b4332]'
          }`}>
            {user?.role === 'patient' ? <Heart className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
            {roleLabel} Portal
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3.5 rounded-2xl
                  transition-all duration-300
                  ${active 
                    ? 'bg-gradient-to-r from-[#c1ecd4]/40 to-transparent text-[#1b4332] font-bold shadow-sm' 
                    : 'text-[#717973] hover:bg-[#f6f3ef] hover:text-[#1c1c1a]'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-[#1b4332]' : ''}`} />
                <span className="text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1b4332]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - User Profile Card */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#f6f3ef]/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center shadow-md shadow-[#1b4332]/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-[#1c1c1a]">{user?.name}</p>
              <p className={`text-xs font-bold capitalize ${roleColor}`}>{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all">
        {/* Top Header */}
        <header className="h-20 lg:h-20 sticky top-0 z-40 bg-[#fcf9f5]/60 backdrop-blur-2xl flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden bg-white/80 shadow-sm rounded-full"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-[#1b4332]" />
            </Button>
            <h2 className="text-xl font-bold text-[#1c1c1a] hidden sm:block tracking-tight">
              {navItems.find(item => isActive(item.path))?.label || 'AyuAahar'}
            </h2>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 rounded-full px-3 hover:bg-[#f6f3ef]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-bold text-[#1c1c1a]">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-[#717973]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-[0_8px_40px_rgba(28,28,26,0.08)] border-0 bg-white/90 backdrop-blur-xl p-1">
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="rounded-xl px-3 py-2.5 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-[#717973]" />
                <span className="font-medium text-sm">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e5e2de]/50" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-[#ba1a1a] rounded-xl px-3 py-2.5 cursor-pointer hover:bg-[#ffdad6]/30"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-medium text-sm">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
