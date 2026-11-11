// AyuAahar - Sign in page (with one-click demo accounts)
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartPulse, Loader2, Lock, Mail, Stethoscope } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DEMO_ACCOUNTS = {
  dietitian: { email: 'dietitian@ayuaahar.com', label: 'Dietitian demo', icon: Stethoscope },
  patient: { email: 'patient@ayuaahar.com', label: 'Patient demo', icon: HeartPulse },
} as const;
const DEMO_PASSWORD = 'password123';

export default function Login() {
  const [params] = useSearchParams();
  const demo = params.get('demo') as keyof typeof DEMO_ACCOUNTS | null;
  const [email, setEmail] = useState(demo && DEMO_ACCOUNTS[demo] ? DEMO_ACCOUNTS[demo].email : '');
  const [password, setPassword] = useState(demo && DEMO_ACCOUNTS[demo] ? DEMO_PASSWORD : '');
  const [error, setError] = useState(
    params.get('expired') ? 'Your session expired. Please sign in again.' : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign in · AyuAahar';
  }, []);

  const signIn = async (creds: { email: string; password: string }) => {
    setError('');
    setSubmitting(true);
    try {
      await login(creds);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void signIn({ email: email.trim(), password });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-2.5" aria-label="AyuAahar home">
          <Logo />
        </Link>

        <section className="rounded-[2rem] bg-white p-6 shadow-lift sm:p-8" aria-labelledby="login-title">
          <h1 id="login-title" className="text-center text-2xl font-extrabold text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-center text-sm text-ink-500">Sign in to your AyuAahar account</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-500" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-500" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-forest-950 to-forest-900 text-base hover:to-forest-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-sand-200 pt-6">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-ink-500">
              Or explore with a demo account
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.values(DEMO_ACCOUNTS).map(({ email: demoEmail, label, icon: Icon }) => (
                <Button
                  key={demoEmail}
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword(DEMO_PASSWORD);
                    void signIn({ email: demoEmail, password: DEMO_PASSWORD });
                  }}
                  className="h-11 rounded-xl border-sand-200 text-forest-900 hover:bg-forest-200/20"
                >
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" /> {label}
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-forest-900 underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
