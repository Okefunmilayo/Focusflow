import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, CheckSquare, Flame } from 'lucide-react';
import { api } from '@/services/api';

type Mode = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

const MODES: { id: Mode; label: string; minutes: number; color: string; bg: string }[] = [
  { id: 'WORK',        label: 'Focus',       minutes: 25, color: 'text-blue-600',   bg: 'bg-blue-600'   },
  { id: 'SHORT_BREAK', label: 'Short Break', minutes: 5,  color: 'text-green-600',  bg: 'bg-green-500'  },
  { id: 'LONG_BREAK',  label: 'Long Break',  minutes: 15, color: 'text-purple-600', bg: 'bg-purple-500' },
];

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function TimerPage() {
  const [mode,      setMode]      = useState<Mode>('WORK');
  const [seconds,   setSeconds]   = useState(25 * 60);
  const [running,   setRunning]   = useState(false);
  const [sessions,  setSessions]  = useState(0);
  const [taskId,    setTaskId]    = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  const current = MODES.find((m) => m.id === mode)!;
  const total   = current.minutes * 60;
  const pct     = ((total - seconds) / total) * 100;
  const mins    = Math.floor(seconds / 60);
  const secs    = seconds % 60;

  const { data: pomData } = useQuery<{ streak: number; sessions: { duration: number }[] }>({
    queryKey: ['pomodoro-sessions'],
    queryFn:  () => api.get('/pomodoro/sessions').then((r) => r.data),
  });

  const { data: tasksData } = useQuery<{ tasks: { id: string; title: string }[] }>({
    queryKey: ['tasks-todo'],
    queryFn:  () => api.get('/tasks?status=TODO').then((r) => r.data),
  });

  const logSession = useMutation({
    mutationFn: () => api.post('/pomodoro/sessions', {
      duration: current.minutes, type: mode, completed: true,
      taskId: taskId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setSessions((s) => s + 1);
    },
  });

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === 'WORK') logSession.mutate();
            // browser notification
            if (Notification.permission === 'granted') {
              new Notification('FocusFlow', {
                body: mode === 'WORK' ? 'Focus session complete! Take a break.' : 'Break over — back to work!',
              });
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setSeconds(MODES.find((x) => x.id === m)!.minutes * 60);
  };

  const reset = () => { setRunning(false); setSeconds(current.minutes * 60); };

  const requestNotif = () => {
    if (Notification.permission === 'default') Notification.requestPermission();
  };

  const streak  = pomData?.streak ?? 0;
  const todayMs = pomData?.sessions
    ?.reduce((a, s) => a + s.duration, 0) ?? 0;

  const radius = 88;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ - (pct / 100) * circ;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Focus Timer</h1>
        <p className="text-slate-500 text-sm mt-1">Stay in the zone with Pomodoro sessions.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
            {streak} <Flame className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-400 mt-1">Day Streak</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{sessions}</div>
          <div className="text-xs text-slate-400 mt-1">This Session</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(todayMs / 60)}m</div>
          <div className="text-xs text-slate-400 mt-1">Total Focus</div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => switchMode(m.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === m.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle cx="110" cy="110" r={radius} fill="none"
              stroke={mode === 'WORK' ? '#3B82F6' : mode === 'SHORT_BREAK' ? '#10B981' : '#8B5CF6'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-slate-900 font-mono tabular-nums">
              {pad(mins)}:{pad(secs)}
            </span>
            <span className={`text-sm font-medium mt-1 ${current.color}`}>{current.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button onClick={reset}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => { requestNotif(); setRunning((r) => !r); }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${current.bg}`}>
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* Link to Task */}
      <div className="card p-4">
        <label className="label flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-500" /> Link this session to a task
        </label>
        <select className="input mt-1" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          <option value="">No task selected</option>
          {tasksData?.tasks?.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-2">
          Completed focus sessions are automatically logged to your analytics.
        </p>
      </div>
    </div>
  );
}
