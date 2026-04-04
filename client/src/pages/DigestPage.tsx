import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react';
import { api } from '@/services/api';

interface Digest {
  id: string;
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  focusHours: number;
  topCategory?: string;
  aiSummary: string;
  improvements: string[];
  recommendations: string[];
  createdAt: string;
}

function DigestCard({ digest }: { digest: Digest }) {
  const [open, setOpen] = useState(false);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              {fmt(digest.weekStart)} — {fmt(digest.weekEnd)}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500 mt-1">
            <span><strong className="text-slate-700">{digest.tasksCompleted}</strong> tasks done</span>
            <span><strong className="text-slate-700">{digest.focusHours}h</strong> focus</span>
            {digest.topCategory && (
              <span>Top: <strong className="text-slate-700 capitalize">{digest.topCategory.toLowerCase()}</strong></span>
            )}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
          {open ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" /> Read</>}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI Summary</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{digest.aiSummary}</p>
          </div>

          {digest.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Areas to Improve</p>
              <ul className="space-y-1.5">
                {digest.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {digest.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Next Week's Actions</p>
              <ul className="space-y-1.5">
                {digest.recommendations.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DigestPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ digests: Digest[] }>({
    queryKey: ['digests'],
    queryFn:  () => api.get('/digest').then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/digest/generate'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['digests'] }),
  });

  const digests = data?.digests ?? [];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly AI Digest</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Claude reviews your week and gives personalised recommendations.
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {generateMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><RefreshCw className="w-4 h-4" /> Generate Now</>}
        </button>
      </div>

      {generateMutation.isPending && (
        <div className="card p-6 mb-6 flex items-center gap-3 border-violet-200 bg-violet-50">
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Claude is analysing your week…</p>
            <p className="text-xs text-violet-600 mt-0.5">This usually takes 10–20 seconds</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : digests.length === 0 ? (
        <div className="text-center py-16 card p-10">
          <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No digests yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Click "Generate Now" to get your first AI-powered weekly review.
          </p>
          <button onClick={() => generateMutation.mutate()} className="btn-primary mx-auto">
            Generate My First Digest
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map(d => <DigestCard key={d.id} digest={d} />)}
        </div>
      )}

      <p className="text-center text-xs text-slate-300 mt-10">
        Auto-generated every Sunday at 8 PM · Powered by Claude Sonnet 4.6
      </p>
    </div>
  );
}
