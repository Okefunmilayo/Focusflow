import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

// Pages
import LoginPage      from '@/pages/LoginPage';
import RegisterPage   from '@/pages/RegisterPage';
import DashboardPage  from '@/pages/DashboardPage';
import TasksPage      from '@/pages/TasksPage';
import TimerPage      from '@/pages/TimerPage';
import AnalyticsPage  from '@/pages/AnalyticsPage';
import AIGoalsPage    from '@/pages/AIGoalsPage';
import DocumentsPage  from '@/pages/DocumentsPage';

// Layout
import AppLayout from '@/components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index                element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="tasks"         element={<TasksPage />} />
        <Route path="timer"         element={<TimerPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="ai-goals"      element={<AIGoalsPage />} />
        <Route path="documents"     element={<DocumentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
