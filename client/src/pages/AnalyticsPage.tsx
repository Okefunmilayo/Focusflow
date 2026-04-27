import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/services/api';

interface Stats {
  totalTasks: number; completedThisWeek: number;
  focusHoursThisMonth: number;
  categoryBreakdown: { category: string; count: number }[];
  dailyFocus: { createdAt: string; duration: number }[];
}
const CAT_COLORS: Record<string, string> = { WORK: '#3B82F6', STUDY: '#8B5CF6', PERSONAL: '#10B981' };

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<{ stats: Stats }>({
    queryKey: ['analytics'],
    queryFn:  () => api.get('/analytics/dashboard').then((r) => r.data),
  });
  const { data: pomData } = useQuery<{ streak: number; sessions: { createdAt: string; duration: number }[] }>({
    queryKey: ['pomodoro-sessions'],
    queryFn:  () => api.get('/pomodoro/sessions').then((r) => r.data),
  });

  const stats  = data?.stats;
  const streak = pomData?.streak ?? 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const mins  = (pomData?.sessions ?? [])
      .filter((s) => new Date(s.createdAt).toDateString() === d.toDateString())
      .reduce((a, s) => a + s.duration, 0);
    return { day: label, minutes: mins };
  });

  const pieData = (stats?.categoryBreakdown ?? []).map((c) => ({
    name: c.category.charAt(0) + c.category.slice(1).toLowerCase(),
    value: c.count, color: CAT_COLORS[c.category] ?? '#94A3B8',
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-label="Loading analytics">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Your productivity at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8" role="region" aria-label="Key metrics">
        {[
          { label: 'Total Tasks',       value: stats?.totalTasks ?? 0,            color: 'text-blue-600'   },
          { label: 'Done This Week',    value: stats?.completedThisWeek ?? 0,      color: 'text-green-600'  },
          { label: 'Focus Hrs (Month)', value: stats?.focusHoursThisMonth ?? 0,    color: 'text-purple-600' },
          { label: 'Streak (Days)',     value: streak,                             color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 sm:p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-2xl sm:text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card p-4 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4 sm:mb-6">Daily Focus (last 7 days)</h2>
          {days.every((d) => d.minutes === 0) ? (
            <div className="flex items-center justify-center h-40 sm:h-48 text-slate-300 text-sm">
              No focus sessions yet — start the timer!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip formatter={(v: number) => [`${v} min`, 'Focus']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="minutes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4 sm:mb-6">Tasks by Category</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 sm:h-48 text-slate-300 text-sm">Add tasks to see breakdown</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
