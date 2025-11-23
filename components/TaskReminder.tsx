import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle2, Circle, Trash2, Edit2, Filter, Search, X, Calendar, AlertCircle } from 'lucide-react';
import { Reminder } from '../types';

interface TaskReminderProps {
  userName: string;
}

export const TaskReminder: React.FC<TaskReminderProps> = ({ userName }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'active' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    task: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    notes: ''
  });

  // Load reminders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('reminders');
    if (saved) {
      const parsed = JSON.parse(saved).map((r: any) => ({
        ...r,
        dueDate: new Date(r.dueDate)
      }));
      setReminders(parsed);
    } else {
      // Sample data
      const sample: Reminder[] = [
        {
          id: '1',
          task: 'Review quarterly report',
          dueDate: new Date(Date.now() + 86400000),
          priority: 'high',
          completed: false,
          category: 'Work'
        },
        {
          id: '2',
          task: 'Team meeting preparation',
          dueDate: new Date(Date.now() + 172800000),
          priority: 'medium',
          completed: false,
          category: 'Work'
        }
      ];
      setReminders(sample);
    }
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Filter and search reminders
  useEffect(() => {
    let filtered = reminders;

    if (filterPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === filterPriority);
    }

    if (filterCompleted === 'active') {
      filtered = filtered.filter(r => !r.completed);
    } else if (filterCompleted === 'completed') {
      filtered = filtered.filter(r => r.completed);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.task.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query)
      );
    }

    // Sort by due date (upcoming first)
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    setFilteredReminders(filtered);
  }, [reminders, searchQuery, filterPriority, filterCompleted]);

  // Check for overdue reminders
  useEffect(() => {
    const overdue = reminders.filter(r => !r.completed && r.dueDate < new Date());
    if (overdue.length > 0) {
      // Could show a notification here
    }
  }, [reminders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task || !formData.dueDate) return;

    if (editingReminder) {
      setReminders(reminders.map(r =>
        r.id === editingReminder.id
          ? {
              ...r,
              task: formData.task,
              dueDate: new Date(formData.dueDate),
              priority: formData.priority,
              category: formData.category,
              notes: formData.notes
            }
          : r
      ));
    } else {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        task: formData.task,
        dueDate: new Date(formData.dueDate),
        priority: formData.priority,
        completed: false,
        category: formData.category,
        notes: formData.notes
      };
      setReminders([...reminders, newReminder]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      task: '',
      dueDate: '',
      priority: 'medium',
      category: '',
      notes: ''
    });
    setEditingReminder(null);
    setShowForm(false);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      task: reminder.task,
      dueDate: reminder.dueDate.toISOString().slice(0, 16),
      priority: reminder.priority,
      category: reminder.category || '',
      notes: reminder.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };

  const handleToggleComplete = (id: string) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const isOverdue = (date: Date, completed: boolean) => {
    return !completed && date < new Date();
  };

  const getDaysUntilDue = (date: Date) => {
    const diff = date.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const upcomingReminders = filteredReminders
    .filter(r => !r.completed && r.dueDate >= new Date())
    .slice(0, 5);

  const overdueReminders = reminders.filter(r => isOverdue(r.dueDate, r.completed));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Task Reminder</h1>
            <p className="text-slate-600">Set and manage your task reminders</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Reminder</span>
          </button>
        </div>

        {/* Overdue Alerts */}
        {overdueReminders.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-red-600" size={20} />
              <h3 className="font-semibold text-red-900">Overdue Reminders ({overdueReminders.length})</h3>
            </div>
            <div className="space-y-2">
              {overdueReminders.map(reminder => (
                <div key={reminder.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <span className="text-red-800 font-medium">{reminder.task}</span>
                  <span className="text-sm text-red-600">Due: {formatDate(reminder.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Upcoming Reminders Preview */}
        {upcomingReminders.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Reminders</h2>
            <div className="grid gap-3">
              {upcomingReminders.map(reminder => {
                const daysUntil = getDaysUntilDue(reminder.dueDate);
                return (
                  <div key={reminder.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(reminder.id)}
                        className="mt-1 text-green-600 hover:text-green-700"
                      >
                        <Circle size={20} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {reminder.task}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                          {reminder.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {reminder.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={14} />
                          <span>{formatDate(reminder.dueDate)}</span>
                          <span className="text-blue-600 font-medium">
                            ({daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`})
                          </span>
                        </div>
                        {reminder.notes && (
                          <p className="mt-2 text-sm text-slate-600">{reminder.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">All Reminders</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {filteredReminders.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No reminders found</p>
              </div>
            ) : (
              filteredReminders.map(reminder => {
                const overdue = isOverdue(reminder.dueDate, reminder.completed);
                const daysUntil = getDaysUntilDue(reminder.dueDate);
                return (
                  <div
                    key={reminder.id}
                    className={`p-6 hover:bg-slate-50 transition-colors ${reminder.completed ? 'opacity-60' : ''} ${overdue ? 'bg-red-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleComplete(reminder.id)}
                        className="mt-1"
                      >
                        {reminder.completed ? (
                          <CheckCircle2 size={24} className="text-green-600" />
                        ) : (
                          <Circle size={24} className="text-slate-400 hover:text-green-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {reminder.task}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                          {reminder.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {reminder.category}
                            </span>
                          )}
                          {overdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(reminder.dueDate)}</span>
                          </div>
                          {!reminder.completed && (
                            <span className={`font-medium ${overdue ? 'text-red-600' : 'text-blue-600'}`}>
                              {overdue
                                ? `Overdue by ${Math.abs(daysUntil)} day(s)`
                                : daysUntil === 0
                                ? 'Due today'
                                : daysUntil === 1
                                ? 'Due tomorrow'
                                : `${daysUntil} days remaining`}
                            </span>
                          )}
                        </div>
                        {reminder.notes && (
                          <p className="text-sm text-slate-600 mb-2">{reminder.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reminder Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task *</label>
                  <input
                    type="text"
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Work, Personal, Health"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional details or context..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

