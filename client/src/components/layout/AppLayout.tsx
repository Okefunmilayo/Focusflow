import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Timer, BarChart2,
  Sparkles, FileText, LogOut, Zap, BookOpen, CreditCard
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks'         },
  { to: '/timer',     icon: Timer,           label: 'Focus Timer'   },
  { to: '/ai-goals',  icon: Sparkles,        label: 'AI Goals'      },
  { to: '/documents', icon: FileText,        label: 'Documents'     },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'     },
  { to: '/digest',    icon: BookOpen,        label: 'Weekly Digest' },
  { to: '/billing',   icon: CreditCard,      label: 'Billing'       },
];

export default function AppLayout() {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">FocusFlow</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">AI Productivity Planner</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
