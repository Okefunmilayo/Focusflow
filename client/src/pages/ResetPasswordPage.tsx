import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/services/api';

export default function ResetPasswordPage() {
  const [params]        = useSearchParams();
  const token           = params.get('token') ?? '';
  const navigate        = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login?reset=success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <p className="text-slate-500 mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
        </div>
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="label">New Password</label>
              <div className="relative">
                <input id="new-password" type={showPwd ? 'text' : 'password'} className="input pr-10"
                  placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(s => !s)} aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">Confirm Password</label>
              <input id="confirm-password" type={showPwd ? 'text' : 'password'} className="input"
                placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
