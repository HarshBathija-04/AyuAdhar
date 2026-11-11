// AyuAahar - app shell: role-based sidebar, header with account menu
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
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
  Heart,
  Activity,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Dietitian navigation items
const dietitianNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/food-database', label: 'Food Database', icon: Apple },
  { path: '/assistant', label: 'Ask Ayu', icon: Sparkles },
];

// Patient navigation items - completely different set of features
const patientNavItems = [
  { path: '/dashboard', label: 'My Wellness', icon: Heart },
  { path: '/appointments', label: 'My Appointments', icon: Calendar },
  { path: '/assistant', label: 'Ask Ayu', icon: Sparkles },
];

export default function Layout({ fallback }: { fallback?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Select navigation based on user role
  const navItems = user?.role === 'patient' ? patientNavItems : dietitianNavItems;
  const pageTitle = navItems.find((item) => isActive(item.path))?.label;

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · AyuAahar` : 'AyuAahar';
  }, [pageTitle]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);
  const roleLabel = user?.role === 'patient' ? 'Patient' : 'Dietitian';
  const roleColor = user?.role === 'patient' ? 'text-saffron-600' : 'text-forest-900';

  return (
    <div className="min-h-screen bg-sand-50 text-ink flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white/70 backdrop-blur-2xl lg:m-4 lg:rounded-[2rem] shadow-soft
          transform transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6">
          <Link to="/dashboard" aria-label="AyuAahar dashboard">
            <Logo />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-ink-500 hover:bg-forest-900/5 rounded-full"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role Badge */}
        <div className="mx-6 mb-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            user?.role === 'patient' 
              ? 'bg-saffron-200/30 text-saffron-700' 
              : 'bg-forest-200/30 text-forest-900'
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
                aria-current={active ? 'page' : undefined}
                className={`
                  flex items-center gap-3.5 px-4 py-3.5 rounded-2xl
                  transition-colors duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-forest-200/40 to-transparent text-forest-900 font-bold shadow-sm' 
                    : 'text-ink-500 hover:bg-sand-100 hover:text-ink'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-forest-900' : ''}`} />
                <span className="text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-forest-900" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - User Profile Card */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-sand-100/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-forest-950 to-forest-900 flex items-center justify-center shadow-md shadow-forest-900/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-ink">{user?.name}</p>
              <p className={`text-xs font-bold capitalize ${roleColor}`}>{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all">
        {/* Top Header */}
        <header className="h-20 lg:h-20 sticky top-0 z-40 bg-sand-50/60 backdrop-blur-2xl flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden bg-white/80 shadow-sm rounded-full"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5 text-forest-900" />
            </Button>
            <p className="font-display text-xl font-bold text-ink hidden sm:block tracking-tight">
              {pageTitle || 'AyuAahar'}
            </p>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 rounded-full px-3 hover:bg-sand-100" aria-label="Account menu">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-950 to-forest-900 flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-bold text-ink">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-ink-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-[0_8px_40px_rgba(28,28,26,0.08)] border-0 bg-white/90 backdrop-blur-xl p-1">
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="rounded-xl px-3 py-2.5 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-ink-500" />
                <span className="font-medium text-sm">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sand-200/50" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-danger rounded-xl px-3 py-2.5 cursor-pointer hover:bg-danger-soft/30"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-medium text-sm">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main id="main" tabIndex={-1} className="flex-1 overflow-x-hidden focus:outline-none">
          <Suspense fallback={fallback}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
