import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { ShieldCheck, ChevronDown } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin({ name, role });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6 shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CorpBot Access</h1>
          <p className="text-slate-500 mt-2 text-sm">Secure Enterprise Gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Employee Identity
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400"
              placeholder="e.g., Sarah Connor"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Access Level
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white appearance-none text-slate-800 cursor-pointer"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              *Access level determines available assistants and AI capabilities.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform active:scale-[0.98] mt-4"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};