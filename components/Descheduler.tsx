import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Edit2, Trash2, Plus, Search, Filter, X } from 'lucide-react';
import { Meeting } from '../types';

interface DeschedulerProps {
  userName: string;
}

export const Descheduler: React.FC<DeschedulerProps> = ({ userName }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'rescheduled' | 'cancelled'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    participants: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Load meetings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('meetings');
    if (saved) {
      const parsed = JSON.parse(saved).map((m: any) => ({
        ...m,
        startTime: new Date(m.startTime),
        endTime: new Date(m.endTime)
      }));
      setMeetings(parsed);
    } else {
      // Sample data
      const sample: Meeting[] = [
        {
          id: '1',
          title: 'Team Standup',
          participants: ['John Doe', 'Jane Smith'],
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 86400000 + 1800000),
          location: 'Conference Room A',
          status: 'scheduled',
          priority: 'high'
        }
      ];
      setMeetings(sample);
    }
  }, []);

  // Save meetings to localStorage
  useEffect(() => {
    localStorage.setItem('meetings', JSON.stringify(meetings));
  }, [meetings]);

  // Filter and search meetings
  useEffect(() => {
    let filtered = meetings;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.participants.some(p => p.toLowerCase().includes(query)) ||
        m.location?.toLowerCase().includes(query)
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, searchQuery, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) return;

    const participants = formData.participants.split(',').map(p => p.trim()).filter(p => p);

    if (editingMeeting) {
      setMeetings(meetings.map(m =>
        m.id === editingMeeting.id
          ? {
              ...m,
              title: formData.title,
              participants,
              startTime: new Date(formData.startTime),
              endTime: new Date(formData.endTime),
              location: formData.location,
              description: formData.description,
              priority: formData.priority,
              status: m.status === 'cancelled' ? 'rescheduled' : m.status
            }
          : m
      ));
    } else {
      const newMeeting: Meeting = {
        id: Date.now().toString(),
        title: formData.title,
        participants,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        location: formData.location,
        description: formData.description,
        priority: formData.priority,
        status: 'scheduled'
      };
      setMeetings([...meetings, newMeeting]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      participants: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      priority: 'medium'
    });
    setEditingMeeting(null);
    setShowForm(false);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      participants: meeting.participants.join(', '),
      startTime: meeting.startTime.toISOString().slice(0, 16),
      endTime: meeting.endTime.toISOString().slice(0, 16),
      location: meeting.location || '',
      description: meeting.description || '',
      priority: meeting.priority
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(meetings.filter(m => m.id !== id));
    }
  };

  const handleReschedule = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      handleEdit(meeting);
    }
  };

  const handleCancel = (id: string) => {
    setMeetings(meetings.map(m =>
      m.id === id ? { ...m, status: 'cancelled' as const } : m
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'rescheduled': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const upcomingMeetings = filteredMeetings
    .filter(m => m.status !== 'cancelled' && m.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Descheduler</h1>
            <p className="text-slate-600">Manage and reschedule your meetings</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Meeting</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'scheduled', 'rescheduled', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings Preview */}
        {upcomingMeetings.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Meetings</h2>
            <div className="grid gap-4">
              {upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(meeting.priority)}`}>
                          {meeting.priority}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{formatDate(meeting.startTime)} - {formatDate(meeting.endTime)}</span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>{meeting.participants.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReschedule(meeting.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Reschedule"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meetings List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">All Meetings</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {filteredMeetings.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No meetings found</p>
              </div>
            ) : (
              filteredMeetings.map(meeting => (
                <div key={meeting.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{meeting.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(meeting.priority)}`}>
                          {meeting.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(meeting.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{formatDate(meeting.endTime)}</span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{meeting.participants.length} participant(s)</span>
                        </div>
                      </div>
                      {meeting.description && (
                        <p className="mt-2 text-sm text-slate-600">{meeting.description}</p>
                      )}
                      {meeting.participants.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {meeting.participants.map((p, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {meeting.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => handleReschedule(meeting.id)}
                            className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Edit2 size={18} />
                            <span className="hidden sm:inline">Reschedule</span>
                          </button>
                          <button
                            onClick={() => handleCancel(meeting.id)}
                            className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meeting Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingMeeting ? 'Edit Meeting' : 'New Meeting'}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Participants (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                    placeholder="John Doe, Jane Smith"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
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

