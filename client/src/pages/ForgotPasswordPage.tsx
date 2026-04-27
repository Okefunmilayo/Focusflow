import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { api } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="card p-6 sm:p-8 text-center">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-semibold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500 text-sm mb-6">
              If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
            </p>
            <Link to="/login" className="btn-primary block text-center">Back to Login</Link>
          </div>
        ) : (
          <div className="card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input id="email" type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
