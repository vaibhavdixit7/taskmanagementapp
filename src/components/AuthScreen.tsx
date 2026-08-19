import { useState, useCallback } from 'react';
import { ListTodo, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      try {
        if (mode === 'signup') {
          const { error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { display_name: displayName.trim() || email.split('@')[0] },
            },
          });
          if (signUpError) {
            if (signUpError.message.toLowerCase().includes('already')) {
              setError('An account with this email already exists. Try signing in instead.');
            } else {
              setError(signUpError.message);
            }
            setLoading(false);
            return;
          }
          // Brief delay to let the auto-confirm trigger complete
          await new Promise((r) => setTimeout(r, 500));

          // After signup, sign in immediately
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInError) {
            setError('Account created! Please sign in with your credentials.');
            setMode('signin');
            setLoading(false);
            return;
          }
          onAuthSuccess();
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInError) {
            setError('Invalid email or password. Please try again.');
            setLoading(false);
            return;
          }
          onAuthSuccess();
        }
      } catch {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    },
    [mode, email, password, displayName, onAuthSuccess]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <ListTodo className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">TaskFlow Pro</h1>
          <p className="mt-1 text-sm text-slate-400">Your productivity, gamified</p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700/50">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Display Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:bg-slate-700"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:bg-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:bg-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-5 text-center text-sm text-slate-400">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
              }}
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your data is securely stored and private to your account.
        </p>
      </div>
    </div>
  );
}
