import React from 'react';
import { MessageSquare, Calendar, Bell, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onNavigate: (section: string) => void;
  userName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userName }) => {
  const dashboardOptions = [
    {
      id: 'ai-chat',
      title: 'AI Chat',
      description: 'Interact with AI assistants for various tasks',
      icon: MessageSquare,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      id: 'descheduler',
      title: 'Descheduler',
      description: 'Manage and reschedule your meetings',
      icon: Calendar,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700'
    },
    {
      id: 'task-reminder',
      title: 'Task Reminder',
      description: 'Set and manage your task reminders',
      icon: Bell,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700'
    },
    {
      id: 'future-prediction',
      title: 'Future Prediction',
      description: 'Get insights and predictions for your work',
      icon: TrendingUp,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 text-lg">Choose a service to get started</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {dashboardOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onNavigate(option.id)}
                className={`
                  ${option.color} ${option.hoverColor}
                  text-white rounded-2xl p-8 shadow-lg
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-xl
                  active:scale-100
                  text-left
                  group
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    p-4 rounded-xl bg-white/20 backdrop-blur-sm
                    group-hover:bg-white/30 transition-colors
                  `}>
                    <Icon size={32} className="text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{option.title}</h2>
                <p className="text-white/90 text-sm md:text-base leading-relaxed">
                  {option.description}
                </p>
                <div className="mt-4 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                  Get started →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

