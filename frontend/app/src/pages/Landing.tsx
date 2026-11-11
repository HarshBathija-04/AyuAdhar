// AyuAahar - Landing page
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import {
  Activity,
  Apple,
  ArrowRight,
  Calendar,
  ClipboardList,
  Leaf,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Utensils,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Disclaimer from '@/components/Disclaimer';

const FEATURES = [
  {
    icon: Users,
    title: 'Patient records',
    text: 'Prakriti, conditions, lifestyle, weight and height in one profile per patient.',
  },
  {
    icon: Utensils,
    title: 'Diet plan generation',
    text: 'Calorie targets from Mifflin-St Jeor and BMI, with foods scored against each dosha.',
  },
  {
    icon: Sparkles,
    title: 'Ask Ayu assistant',
    text: 'An AI assistant that explains plans and Ayurvedic concepts using the patient’s own context.',
  },
  {
    icon: Calendar,
    title: 'Appointments',
    text: 'Month calendar and list views for consultations, follow-ups and their outcomes.',
  },
  {
    icon: TrendingUp,
    title: 'Progress tracking',
    text: 'Weekly adherence and weight check-ins, logged by the dietitian or the patient.',
  },
  {
    icon: Apple,
    title: 'Food database',
    text: 'Nutrition per 100 g alongside rasa, guna, virya, vipaka and dosha effects.',
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Profile the patient',
    text: 'Record prakriti, health conditions and measurements during intake.',
  },
  {
    icon: ClipboardList,
    title: 'Generate the plan',
    text: 'Get a balanced day of meals with calorie targets and dosha balance scores.',
  },
  {
    icon: Activity,
    title: 'Follow up',
    text: 'Track weekly adherence, adjust the plan and let patients ask Ayu between visits.',
  },
];

const PRAKRITI = [
  {
    name: 'Vata',
    element: 'Air & Space',
    text: 'Light, dry and cold. Thrives on warm, grounding, regular meals.',
    tone: 'bg-blue-100 text-blue-800',
  },
  {
    name: 'Pitta',
    element: 'Fire & Water',
    text: 'Hot, sharp and intense. Balanced by cooling, sweet and bitter foods.',
    tone: 'bg-saffron-200/60 text-saffron-700',
  },
  {
    name: 'Kapha',
    element: 'Earth & Water',
    text: 'Heavy, stable and steady. Supported by light, warm and spiced meals.',
    tone: 'bg-forest-200/60 text-forest-900',
  },
];

const SAMPLE_MEALS = [
  { meal: 'Breakfast', food: 'Warm oats, banana, cardamom', kcal: 412 },
  { meal: 'Lunch', food: 'Moong dal, brown rice, carrots', kcal: 694 },
  { meal: 'Dinner', food: 'Khichdi, vegetable soup', kcal: 431 },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'AyuAahar · Ayurvedic diet planning for dietitians';
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-sand-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'bg-sand-50/85 shadow-soft backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8"
          aria-label="Primary"
        >
          <Link to="/" aria-label="AyuAahar home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-ink-700 md:flex">
            <a href="#features" className="hover:text-forest-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-forest-900">
              How it works
            </a>
            <a href="#prakriti" className="hover:text-forest-900">
              Prakriti
            </a>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="rounded-full bg-forest-900 px-5 hover:bg-forest-800">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden rounded-full text-forest-900 hover:bg-forest-900/5 sm:inline-flex"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild className="rounded-full bg-forest-900 px-5 hover:bg-forest-800">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="px-4 pb-16 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pb-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full bg-forest-200/40 px-4 py-2 text-sm font-semibold text-forest-900">
                <Leaf className="h-4 w-4" aria-hidden="true" /> For Ayurvedic dietitians and their patients
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-[3.5rem]">
                Personalised diet plans rooted in <span className="text-forest-900">prakriti</span> and modern{' '}
                <span className="text-saffron-600">nutrition</span>.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-ink-700">
                AyuAahar turns a patient’s constitution, health conditions and measurements into a balanced
                daily meal plan, then helps you track adherence and answer questions between visits.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-gradient-to-r from-forest-950 to-forest-900 px-7 text-base shadow-lg shadow-forest-900/25 hover:to-forest-800"
                >
                  <Link to={user ? '/dashboard' : '/login?demo=dietitian'}>
                    {user ? 'Open dashboard' : 'Explore the live demo'}{' '}
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                {!user && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-ink-300 px-7 text-base text-forest-900 hover:bg-forest-900/5"
                  >
                    <Link to="/login?demo=patient">Try the patient view</Link>
                  </Button>
                )}
              </div>
              <p className="text-sm text-ink-500">
                Demo accounts are pre-filled on the sign-in page. No sign-up needed.
              </p>
            </div>

            {/* Product preview: an illustrative sample plan */}
            <figure
              className="rounded-[2rem] bg-white p-6 shadow-lift sm:p-8"
              aria-label="Sample diet plan preview"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Sample plan</p>
                  <p className="font-display text-lg font-bold text-ink">Vata Balance Plan</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  Vata
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {SAMPLE_MEALS.map((m) => (
                  <li
                    key={m.meal}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-sand-100 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-500">{m.meal}</p>
                      <p className="truncate text-sm font-semibold text-ink">{m.food}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-forest-900">{m.kcal} kcal</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Dosha balance</p>
                {[
                  { name: 'Vata', pct: 28, bar: 'bg-blue-500' },
                  { name: 'Pitta', pct: 34, bar: 'bg-saffron-500' },
                  { name: 'Kapha', pct: 38, bar: 'bg-forest-900' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center gap-3 text-sm">
                    <span className="w-12 font-semibold text-ink-700">{d.name}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                      <span className={`block h-full rounded-full ${d.bar}`} style={{ width: `${d.pct}%` }} />
                    </span>
                    <span className="w-10 text-right font-semibold text-ink-500">{d.pct}%</span>
                  </div>
                ))}
              </div>
              <figcaption className="mt-5 text-xs text-ink-500">
                Illustrative example of a generated plan.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 bg-sand-100/60 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
                Everything a consultation needs
              </h2>
              <p className="mt-4 text-lg text-ink-700">From intake to follow-up, in one calm workspace.</p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-[1.75rem] bg-white p-7 shadow-soft">
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-200/50 text-forest-900">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl">How it works</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative rounded-[1.75rem] border border-sand-200 bg-white p-7">
                  <span className="font-display text-sm font-bold text-saffron-600">Step {i + 1}</span>
                  <Icon className="mt-3 h-7 w-7 text-forest-900" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Prakriti */}
        <section id="prakriti" className="scroll-mt-20 bg-sand-100/60 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">Built around the three doshas</h2>
              <p className="mt-4 text-lg text-ink-700">
                Every food carries dosha effects, so plans can be balanced for single and dual constitutions.
              </p>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {PRAKRITI.map((p) => (
                <li key={p.name} className="rounded-[1.75rem] bg-white p-7 text-center shadow-soft">
                  <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${p.tone}`}>
                    {p.name}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-ink-500">{p.element}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-forest-950 to-forest-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">See it with real demo data</h2>
            <p className="mt-4 text-lg text-forest-200">
              Six demo patients, upcoming consultations, progress history and generated plans are ready to
              explore.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-7 text-base text-forest-950 hover:bg-sand-100"
              >
                <Link to={user ? '/dashboard' : '/login?demo=dietitian'}>
                  {user ? 'Go to dashboard' : 'Open the dietitian demo'}{' '}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/40 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/register">Create an account</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink px-4 py-12 text-sand-200 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <Logo inverted />
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white">
                How it works
              </a>
              <Link to="/login" className="hover:text-white">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-white">
                Register
              </Link>
            </nav>
          </div>
          <Disclaimer compact className="border-white/10 bg-white/5 text-sand-200" />
          <p className="text-xs text-sand-200/80">
            © {new Date().getFullYear()} AyuAahar. A portfolio project.
          </p>
        </div>
      </footer>
    </div>
  );
}
