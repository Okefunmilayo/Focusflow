import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Timer, Flame, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

interface Stats {
  totalTasks: number;
  completedThisWeek: number;
  focusHoursThisMonth: number;
  categoryBreakdown: { category: string; count: number }[];
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: analytics } = useQuery<{ stats: Stats }>({
    queryKey: ['analytics'],
    queryFn:  () => api.get('/analytics/dashboard').then((r) => r.data),
  });

  const { data: pomodoro } = useQuery<{ streak: number }>({
    queryKey: ['pomodoro-sessions'],
    queryFn:  () => api.get('/pomodoro/sessions').then((r) => r.data),
  });

  const { data: tasksData } = useQuery<{ tasks: { id: string; title: string; priority: string; status: string; dueDate?: string }[] }>({
    queryKey: ['tasks-recent'],
    queryFn:  () => api.get('/tasks?status=TODO').then((r) => r.data),
  });

  const stats       = analytics?.stats;
  const streak      = pomodoro?.streak ?? 0;
  const recentTasks = tasksData?.tasks?.slice(0, 5) ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your productivity today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckSquare} label="Completed This Week" value={stats?.completedThisWeek ?? 0} sub="tasks done"    color="bg-blue-500"   />
        <StatCard icon={TrendingUp}  label="Total Tasks"         value={stats?.totalTasks ?? 0}        sub="all time"     color="bg-purple-500" />
        <StatCard icon={Timer}       label="Focus Hours"         value={`${stats?.focusHoursThisMonth ?? 0}h`} sub="this month" color="bg-green-500"  />
        <StatCard icon={Flame}       label="Current Streak"      value={`${streak} days`} sub={streak > 0 ? 'keep it up! 🔥' : 'start today!'} color="bg-orange-500" />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-10">
              <CheckSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No tasks yet</p>
              <Link to="/tasks">
                <button className="btn-primary mt-4 flex items-center gap-2 mx-auto text-sm py-1.5 px-3">
                  <Plus className="w-4 h-4" /> Add your first task
                </button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'HIGH' ? 'bg-red-500' : task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <span className="text-sm text-slate-700 flex-1">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">
                      {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.priority === 'HIGH'   ? 'bg-red-50 text-red-600' :
                    task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                                                 'bg-green-50 text-green-600'
                  }`}>{task.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">By Category</h2>
          {!stats?.categoryBreakdown?.length ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No data yet — add some tasks!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.categoryBreakdown.map(({ category, count }) => {
                const total = stats.categoryBreakdown.reduce((a, c) => a + c.count, 0);
                const pct   = Math.round((count / total) * 100);
                const colors: Record<string, string> = { WORK: 'bg-blue-500', STUDY: 'bg-purple-500', PERSONAL: 'bg-green-500' };
                return (
                  <div key={category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium capitalize">{category.toLowerCase()}</span>
                      <span className="text-slate-400">{count} tasks · {pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[category] ?? 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <Link to="/ai-goals" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> Break down a goal with AI
            </Link>
            <Link to="/timer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Timer className="w-4 h-4" /> Start a focus session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
