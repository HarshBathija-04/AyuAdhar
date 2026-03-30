// AyuAahar - Premium Landing Page (Stitch Digital Sanctuary Design)
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Leaf, 
  Users, 
  Calendar, 
  Utensils, 
  TrendingUp, 
  Heart,
  ArrowRight,
  CheckCircle,
  Activity,
  Apple,
  Sparkles,
  Shield,
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Patient Management',
      description: 'Manage patient records with detailed Ayurvedic profiles including Prakriti assessment and dosha analysis.',
      accent: 'from-[#1b4332]/10 to-[#1b4332]/5'
    },
    {
      icon: <Utensils className="h-6 w-6" />,
      title: 'Diet Plan Generation',
      description: 'Generate personalized diet plans based on Dosha balance, health conditions, and modern nutritional science.',
      accent: 'from-[#D68C45]/10 to-[#D68C45]/5'
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Appointment Scheduling',
      description: 'Schedule and manage consultations with an intuitive calendar interface and automated reminders.',
      accent: 'from-[#3b82f6]/10 to-[#3b82f6]/5'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Progress Tracking',
      description: 'Monitor patient adherence and health metrics with beautiful visual analytics and trend reports.',
      accent: 'from-[#8b5cf6]/10 to-[#8b5cf6]/5'
    },
    {
      icon: <Apple className="h-6 w-6" />,
      title: 'Food Database',
      description: 'Access comprehensive food database with nutritional content and Ayurvedic properties like Rasa, Guna, Virya.',
      accent: 'from-[#10b981]/10 to-[#10b981]/5'
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: 'Nutrient Analysis',
      description: 'Analyze nutritional content with Ayurvedic balance visualization and dosha impact scoring.',
      accent: 'from-[#ec4899]/10 to-[#ec4899]/5'
    }
  ];

  const prakritiTypes = [
    { 
      name: 'Vata', 
      element: 'Air & Space', 
      color: 'bg-[#c1ecd4]/40', 
      textColor: 'text-[#1b4332]',
      iconBg: 'bg-[#1b4332]/10',
      desc: 'Light, dry, cold. Creative & energetic. Governs movement and communication.',
      traits: ['Quick thinking', 'Flexible', 'Creative']
    },
    { 
      name: 'Pitta', 
      element: 'Fire & Water', 
      color: 'bg-[#ffdcc1]/40', 
      textColor: 'text-[#8c4f09]',
      iconBg: 'bg-[#D68C45]/10',
      desc: 'Hot, sharp, oily. Focused & determined. Governs digestion and metabolism.',
      traits: ['Ambitious', 'Intelligent', 'Courageous']
    },
    { 
      name: 'Kapha', 
      element: 'Earth & Water', 
      color: 'bg-[#dbeafe]/40', 
      textColor: 'text-[#1e40af]',
      iconBg: 'bg-[#3b82f6]/10',
      desc: 'Heavy, cold, oily. Stable & nurturing. Governs structure and lubrication.',
      traits: ['Calm', 'Loyal', 'Patient']
    }
  ];

  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'Ayurvedic Dietitian', quote: 'AyuAahar transformed how I manage my practice. The Prakriti-based diet plans save me hours daily.' },
    { name: 'Dr. Rajesh Kumar', role: 'Senior Nutritionist', quote: 'The integration of modern nutrition science with Ayurvedic principles is exactly what the industry needed.' },
    { name: 'Dr. Meera Patel', role: 'Wellness Consultant', quote: 'My patients love the personalized approach. Adherence rates have increased by 40% since using AyuAahar.' }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f5]" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
      {/* Glassmorphic Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#fcf9f5]/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(28,28,26,0.04)]' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] p-2.5 rounded-2xl shadow-lg shadow-[#1b4332]/20">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#012d1d] tracking-tight">AyuAahar</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#414844] hover:text-[#1b4332] font-medium transition-colors text-sm">Features</a>
              <a href="#prakriti" className="text-[#414844] hover:text-[#1b4332] font-medium transition-colors text-sm">Prakriti</a>
              <a href="#testimonials" className="text-[#414844] hover:text-[#1b4332] font-medium transition-colors text-sm">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-[#1b4332] hover:bg-[#1b4332]/5 rounded-full px-5 font-medium flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-bold text-sm tracking-widest">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-[#1b4332] hover:bg-[#1b4332]/5 rounded-full px-5 font-medium">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-[#012d1d] to-[#1b4332] hover:from-[#012d1d] hover:to-[#274e3d] text-white rounded-full px-6 shadow-lg shadow-[#1b4332]/25 font-medium">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-[#1b4332]/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-[#D68C45]/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-[#c1ecd4]/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#c1ecd4]/30 text-[#1b4332] px-5 py-2.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Ayurvedic Practice Management
              </div>
              <h1 className="text-5xl lg:text-[3.75rem] font-extrabold text-[#1c1c1a] leading-[1.1] tracking-tight">
                Bridge Ancient{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#012d1d] to-[#1b4332]">
                  Wisdom
                </span>{' '}
                with Modern{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D68C45] to-[#8c4f09]">
                  Nutrition
                </span>
              </h1>
              <p className="text-lg text-[#414844] max-w-lg leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
                AyuAahar helps Ayurvedic dietitians create personalized diet plans based on 
                Prakriti, Dosha balance, and modern nutritional science.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-[#012d1d] to-[#1b4332] hover:from-[#012d1d] hover:to-[#274e3d] text-white rounded-full px-8 py-6 text-base shadow-xl shadow-[#1b4332]/30 font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base border-[#c1c8c2]/30 text-[#1b4332] hover:bg-[#1b4332]/5 font-medium">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-[#717973]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#1b4332]" />
                  Free to try
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#1b4332]" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#1b4332]" />
                  Cancel anytime
                </div>
              </div>
            </div>

            {/* Glassmorphic Stats Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1b4332]/20 to-[#D68C45]/20 rounded-[2.5rem] blur-[60px]" />
              <Card className="relative bg-white/70 backdrop-blur-2xl border-0 shadow-[0_20px_60px_rgba(28,28,26,0.06)] rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 lg:p-10 space-y-8">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] p-2 rounded-xl">
                      <Leaf className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-[#012d1d] text-sm tracking-tight">AyuAahar Dashboard Preview</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f6f3ef]/80">
                      <div>
                        <p className="text-sm text-[#717973] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Total Patients</p>
                        <p className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight">124</p>
                      </div>
                      <div className="w-14 h-14 bg-[#c1ecd4]/50 rounded-2xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#1b4332]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f6f3ef]/80">
                      <div>
                        <p className="text-sm text-[#717973] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Active Diet Plans</p>
                        <p className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight">89</p>
                      </div>
                      <div className="w-14 h-14 bg-[#ffdcc1]/50 rounded-2xl flex items-center justify-center">
                        <Utensils className="h-6 w-6 text-[#D68C45]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#f6f3ef]/80">
                      <div>
                        <p className="text-sm text-[#717973] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>Success Rate</p>
                        <p className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight">85%</p>
                      </div>
                      <div className="w-14 h-14 bg-[#dbeafe]/50 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-[#3b82f6]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-[#f6f3ef]/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#c1ecd4]/20 text-[#1b4332] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Shield className="h-4 w-4" />
              Comprehensive Tools
            </div>
            <h2 className="text-4xl font-extrabold text-[#1c1c1a] mb-5 tracking-tight">
              Everything You Need for Your Practice
            </h2>
            <p className="text-lg text-[#414844] leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Comprehensive tools designed specifically for Ayurvedic dietitians to manage 
              patients, create diet plans, and track progress.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] hover:shadow-[0_20px_60px_rgba(28,28,26,0.08)] transition-all duration-500 rounded-[2rem] bg-white/80 backdrop-blur-xl group hover:-translate-y-1"
              >
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-6 text-[#1b4332] group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#1c1c1a] mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[#414844] leading-relaxed text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prakriti Section */}
      <section id="prakriti" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1b4332]/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D68C45]/[0.05] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-[#ffdcc1]/30 text-[#8c4f09] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Heart className="h-4 w-4" />
              Ancient Wisdom
            </div>
            <h2 className="text-4xl font-extrabold text-[#1c1c1a] mb-5 tracking-tight">
              Understanding Prakriti
            </h2>
            <p className="text-lg text-[#414844] leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
              AyuAahar uses the ancient Ayurvedic concept of Prakriti (body constitution) 
              to create personalized diet recommendations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {prakritiTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-xl hover:shadow-[0_20px_60px_rgba(28,28,26,0.08)] transition-all duration-500 hover:-translate-y-1 group">
                <CardContent className="p-8 text-center">
                  <div className={`${type.iconBg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`text-2xl font-extrabold ${type.textColor}`}>{type.name[0]}</span>
                  </div>
                  <div className={`inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 ${type.color} ${type.textColor}`}>
                    {type.name}
                  </div>
                  <p className="text-[#717973] mb-3 font-semibold text-sm">{type.element}</p>
                  <p className="text-[#414844] text-sm mb-5 leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>{type.desc}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {type.traits.map((trait, i) => (
                      <span key={i} className="px-3 py-1 bg-[#f6f3ef] rounded-full text-xs font-medium text-[#414844]">
                        {trait}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-[#f6f3ef]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-[#c1ecd4]/20 text-[#1b4332] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star className="h-4 w-4" />
              Trusted by Professionals
            </div>
            <h2 className="text-4xl font-extrabold text-[#1c1c1a] mb-5 tracking-tight">
              What Practitioners Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <Card key={index} className="border-0 shadow-[0_8px_40px_rgba(28,28,26,0.04)] rounded-[2rem] bg-white/80 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#D68C45] text-[#D68C45]" />
                    ))}
                  </div>
                  <p className="text-[#414844] mb-6 leading-relaxed italic text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#012d1d] to-[#1b4332] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#1c1c1a] text-sm">{t.name}</p>
                      <p className="text-[#717973] text-xs">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#012d1d] to-[#1b4332] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D68C45]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-extrabold text-white mb-5 tracking-tight">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-[#a5d0b9] mb-10 leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Join hundreds of Ayurvedic dietitians using AyuAahar to deliver 
            personalized nutrition guidance rooted in ancient wisdom.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-white text-[#012d1d] hover:bg-[#f6f3ef] rounded-full px-8 py-6 text-base shadow-xl font-semibold">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="bg-white text-[#012d1d] hover:bg-[#f6f3ef] rounded-full px-8 py-6 text-base shadow-xl font-semibold">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" className="border border-white/30 bg-transparent text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-medium" style={{ color: 'white' }}>
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1c1c1a] text-[#717973] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] p-2.5 rounded-2xl">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">AyuAahar</span>
              </div>
              <p className="max-w-sm leading-relaxed text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Bridging traditional Ayurvedic knowledge with modern health technology 
                for personalized nutrition guidance.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm tracking-tight">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#prakriti" className="hover:text-white transition-colors">Prakriti</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-5 text-sm tracking-tight">Account</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-16 pt-8 text-center text-sm">
            <p>&copy; 2024 AyuAahar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
