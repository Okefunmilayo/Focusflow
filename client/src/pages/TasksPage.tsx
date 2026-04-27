import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Calendar } from 'lucide-react';
import { api } from '@/services/api';

type Status   = 'TODO' | 'IN_PROGRESS' | 'DONE';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type Category = 'WORK' | 'STUDY' | 'PERSONAL';

interface Task {
  id: string; title: string; description?: string;
  status: Status; priority: Priority; category: Category;
  dueDate?: string; aiGenerated: boolean;
}

const COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'bg-slate-100', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50',   dot: 'bg-blue-500'  },
  { id: 'DONE',        label: 'Done',        color: 'bg-green-50',  dot: 'bg-green-500' },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH:   'bg-red-50 text-red-600 border-red-100',
  MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
  LOW:    'bg-green-50 text-green-600 border-green-100',
};
const CATEGORY_STYLES: Record<Category, string> = {
  WORK:     'bg-blue-50 text-blue-600',
  STUDY:    'bg-purple-50 text-purple-600',
  PERSONAL: 'bg-teal-50 text-teal-600',
};

function NewTaskModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Partial<Task>) => void }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<Priority>('MEDIUM');
  const [category,    setCategory]    = useState<Category>('PERSONAL');
  const [dueDate,     setDueDate]     = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">New Task</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onSave({ title, description, priority, category, dueDate: dueDate || undefined }); }}
          className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="task-title" className="label">Title</label>
            <input id="task-title" className="input" placeholder="What needs to be done?" value={title}
              onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div>
            <label htmlFor="task-desc" className="label">Description</label>
            <textarea id="task-desc" className="input resize-none" rows={2} placeholder="Optional details..."
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="label">Priority</label>
              <select id="task-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-category" className="label">Category</label>
              <select id="task-category" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                <option value="PERSONAL">Personal</option>
                <option value="WORK">Work</option>
                <option value="STUDY">Study</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="task-due" className="label">Due Date</label>
            <input id="task-due" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onDelete, onStatusChange }: {
  task: Task; onDelete: (id: string) => void; onStatusChange: (id: string, s: Status) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800 leading-snug flex-1">{task.title}</p>
        <button onClick={() => onDelete(task.id)} aria-label={`Delete task: ${task.title}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-300 hover:text-red-500 transition-all p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
      {task.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[task.category]}`}>
          {task.category}
        </span>
        {task.aiGenerated && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">AI</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {task.dueDate ? (
          <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        ) : <span />}
        <select value={task.status} aria-label="Change status"
          onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-500 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0">
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [showModal,      setShowModal]      = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeCol,      setActiveCol]      = useState<Status>('TODO');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks', filterPriority, filterCategory],
    queryFn:  () => {
      const params = new URLSearchParams();
      if (filterPriority) params.set('priority', filterPriority);
      if (filterCategory) params.set('category', filterCategory);
      return api.get('/tasks?' + params).then((r) => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: Partial<Task>) => api.post('/tasks', d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['analytics'] }); setShowModal(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete('/tasks/' + id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['analytics'] }); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api.patch('/tasks/' + id + '/status', { status }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['analytics'] }); },
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">New</span> Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 sm:mb-6 flex-wrap">
        <select className="input flex-1 min-w-0 sm:max-w-xs text-sm" value={filterPriority}
          aria-label="Filter by priority" onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="input flex-1 min-w-0 sm:max-w-xs text-sm" value={filterCategory}
          aria-label="Filter by category" onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="WORK">Work</option>
          <option value="STUDY">Study</option>
          <option value="PERSONAL">Personal</option>
        </select>
        {(filterPriority || filterCategory) && (
          <button onClick={() => { setFilterPriority(''); setFilterCategory(''); }}
            aria-label="Clear filters" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Mobile column tabs */}
      <div className="flex md:hidden gap-1 mb-4 bg-slate-100 p-1 rounded-xl" role="tablist">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          return (
            <button key={col.id} role="tab" aria-selected={activeCol === col.id}
              onClick={() => setActiveCol(col.id)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeCol === col.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} aria-hidden="true" />
              {col.label}
              <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-[10px] leading-none">{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1" role="status" aria-label="Loading tasks">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop: 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className={`${col.color} rounded-2xl p-4 flex flex-col min-h-96`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} aria-hidden="true" />
                    <span className="font-semibold text-slate-700 text-sm">{col.label}</span>
                    <span className="ml-auto text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {colTasks.length === 0
                      ? <div className="text-center py-8 text-slate-300 text-xs">No tasks here</div>
                      : colTasks.map((task) => (
                          <TaskCard key={task.id} task={task}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onStatusChange={(id, status) => statusMutation.mutate({ id, status })} />
                        ))}
                  </div>
                  {col.id === 'TODO' && (
                    <button onClick={() => setShowModal(true)}
                      className="mt-3 flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs py-2 w-full justify-center rounded-lg hover:bg-white/60 transition-colors">
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add task
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: single active column */}
          <div className="md:hidden flex-1">
            {COLUMNS.filter((col) => col.id === activeCol).map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className={`${col.color} rounded-2xl p-4 min-h-64`}>
                  <div className="space-y-3">
                    {colTasks.length === 0
                      ? <div className="text-center py-12 text-slate-300 text-sm">No tasks in {col.label}</div>
                      : colTasks.map((task) => (
                          <TaskCard key={task.id} task={task}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onStatusChange={(id, status) => { statusMutation.mutate({ id, status }); }}
                          />
                        ))}
                  </div>
                  {col.id === 'TODO' && (
                    <button onClick={() => setShowModal(true)}
                      className="mt-4 flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm py-3 w-full justify-center rounded-xl hover:bg-white/60 transition-colors border-2 border-dashed border-slate-200">
                      <Plus className="w-4 h-4" aria-hidden="true" /> Add a task
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <NewTaskModal onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} />
      )}
    </div>
  );
}
