import React from 'react';
import { MODES } from '../constants';
import { AssistantMode, UserRole } from '../types';
import { 
  Briefcase, 
  Mail, 
  TrendingUp, 
  Code2,
  Users,
  Coffee,
  X,
  Bot,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentMode: AssistantMode;
  userRole: UserRole;
  userName: string;
  onModeSelect: (mode: AssistantMode) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  userRole, 
  userName,
  onModeSelect, 
  isOpen, 
  setIsOpen,
  onLogout
}) => {
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase size={18} />;
      case 'Mail': return <Mail size={18} />;
      case 'TrendingUp': return <TrendingUp size={18} />;
      case 'Code2': return <Code2 size={18} />;
      case 'Users': return <Users size={18} />;
      case 'Coffee': return <Coffee size={18} />;
      default: return <Briefcase size={18} />;
    }
  };

  // Filter modes based on user role permissions
  const visibleModes = MODES.filter(mode => 
    !mode.allowedRoles || mode.allowedRoles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bot className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">CorpBot</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
              Available Agents
            </div>
            {visibleModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  onModeSelect(mode.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200
                  ${currentMode === mode.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {getIcon(mode.icon)}
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium text-sm">{mode.name}</span>
                  <span className="text-[10px] opacity-70">{mode.description}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3 px-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[120px]">{userName}</span>
                <div className="flex items-center space-x-1">
                  <Shield size={10} className="text-blue-400"/>
                  <span className="text-xs text-blue-400 font-semibold">{userRole}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 text-center border border-slate-700 rounded hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};