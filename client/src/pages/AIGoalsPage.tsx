import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Loader2, ChevronDown, ChevronUp, CheckSquare, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';

interface GoalStep {
  phase:      string;
  week:       string;
  dailyTasks: string[];
}

export default function AIGoalsPage() {
  const [goal,         setGoal]         = useState('');
  const [deadline,     setDeadline]     = useState('');
  const [context,      setContext]      = useState('');
  const [steps,        setSteps]        = useState<GoalStep[]>([]);
  const [expanded,     setExpanded]     = useState<number[]>([0]);
  const [autoCreate,   setAutoCreate]   = useState(true);
  const [saved,        setSaved]        = useState(false);
  const qc = useQueryClient();

  const breakdown = useMutation({
    mutationFn: () => api.post('/ai/goal-breakdown', {
      goal, deadline, context, autoCreateTasks: autoCreate,
    }).then((r) => r.data),
    onSuccess: (data) => {
      setSteps(data.steps ?? []);
      setExpanded([0]);
      setSaved(autoCreate);
      if (autoCreate) {
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['analytics'] });
      }
    },
  });

  const toggle = (i: number) =>
    setExpanded((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const phaseColors = [
    'border-blue-200 bg-blue-50',
    'border-cyan-200 bg-cyan-50',
    'border-green-200 bg-green-50',
    'border-amber-200 bg-amber-50',
    'border-orange-200 bg-orange-50',
    'border-red-200 bg-red-50',
  ];
  const dotColors = [
    'bg-blue-500', 'bg-cyan-500', 'bg-green-500',
    'bg-amber-500', 'bg-orange-500', 'bg-red-500',
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-500" /> AI Goal Breakdown
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Type any big goal — Claude AI will break it into a daily action plan.
        </p>
      </div>

      {/* Input Card */}
      <div className="card p-6 mb-6">
        <div className="mb-4">
          <label className="label text-base font-semibold">Your Goal</label>
          <textarea
            className="input resize-none text-base"
            rows={3}
            placeholder="e.g. Pass my final exams in 4 weeks, Complete my dissertation by June, Launch my side project..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Deadline (optional)</label>
            <input type="date" className="input" value={deadline}
              onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="label">Extra Context (optional)</label>
            <input className="input" placeholder="e.g. I am a beginner, working part-time..."
              value={context} onChange={(e) => setContext(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)}
              className="rounded text-blue-600" />
            Auto-create tasks in my Task Manager
          </label>
          <button
            onClick={() => breakdown.mutate()}
            disabled={!goal.trim() || breakdown.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {breakdown.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Break it down</>
            )}
          </button>
        </div>
        {breakdown.isError && (
          <p className="text-red-500 text-sm mt-3">Something went wrong — check your API key is set in server/.env</p>
        )}
      </div>

      {/* Results */}
      {steps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Your Action Plan</h2>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckSquare className="w-4 h-4" /> Tasks saved
                </span>
              )}
              <button onClick={() => breakdown.mutate()}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`rounded-xl border-2 ${phaseColors[i % phaseColors.length]} overflow-hidden`}>
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-6 h-6 rounded-full ${dotColors[i % dotColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{step.phase}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.week}</p>
                  </div>
                  <span className="text-xs text-slate-400 mr-2">{step.dailyTasks.length} tasks</span>
                  {expanded.includes(i)
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>

                {expanded.includes(i) && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {step.dailyTasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2.5 bg-white/70 rounded-lg p-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Powered by Claude Sonnet 4.6 · {steps.reduce((a, s) => a + s.dailyTasks.length, 0)} tasks generated
          </p>
        </div>
      )}

      {/* Empty state */}
      {steps.length === 0 && !breakdown.isPending && (
        <div className="text-center py-16 text-slate-300">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-400">Your AI-generated plan will appear here</p>
        </div>
      )}
    </div>
  );
}
