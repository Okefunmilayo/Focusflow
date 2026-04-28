import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Zap, Loader2, Crown } from 'lucide-react';
import { api } from '@/services/api';

interface BillingStatus { plan: 'FREE' | 'PRO'; features: string[]; }

const FREE_FEATURES  = ['Kanban task board', 'Pomodoro timer', 'AI goal breakdown (5/mo)', 'Document upload (3 docs)'];
const PRO_FEATURES   = ['Everything in Free', 'Unlimited AI goal breakdowns', 'Unlimited documents & flashcards', 'Weekly AI digest', 'Priority support', 'Early access to new features'];

export default function BillingPage() {
  const [checkoutError, setCheckoutError] = useState('');

  const { data } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn:  () => api.get('/billing/status').then(r => r.data),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.post('/billing/create-checkout').then(r => r.data),
    onSuccess: (data: { url: string }) => {
      if (data.url) window.location.href = data.url;
      else setCheckoutError('Could not open checkout. Please try again.');
    },
    onError: () => setCheckoutError('Billing is not configured yet. Add your Stripe keys to .env'),
  });

  const isPro = data?.plan === 'PRO';

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isPro ? 'You are on the Pro plan — enjoy all features!' : 'Upgrade to Pro to unlock everything.'}
        </p>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={`card p-6 ${!isPro ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Free</h2>
              <p className="text-3xl font-bold text-slate-900 mt-1">$0<span className="text-sm font-normal text-slate-400">/mo</span></p>
            </div>
            {!isPro && (
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Current plan</span>
            )}
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <button disabled className="btn-secondary w-full opacity-60 cursor-not-allowed">
            {isPro ? 'Downgrade' : 'Current Plan'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`card p-6 bg-gradient-to-br from-blue-600 to-violet-600 text-white border-0 ${isPro ? 'ring-2 ring-violet-400' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-300" />
                <h2 className="font-bold text-lg">Pro</h2>
              </div>
              <p className="text-3xl font-bold mt-1">$2<span className="text-sm font-normal opacity-70">/mo</span></p>
            </div>
            {isPro && (
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Active</span>
            )}
          </div>
          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <Check className="w-4 h-4 text-yellow-300 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <button className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              Manage Subscription
            </button>
          ) : (
            <button
              onClick={() => { setCheckoutError(''); checkoutMutation.mutate(); }}
              disabled={checkoutMutation.isPending}
              className="w-full bg-white hover:bg-slate-100 text-blue-700 font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {checkoutMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                : <><Zap className="w-4 h-4" /> Upgrade to Pro</>}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Payments securely processed by Stripe · Cancel anytime
      </p>
    </div>
  );
}
