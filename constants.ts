import { AssistantMode, ModeConfig, UserRole } from './types';
import { 
  Briefcase, 
  Mail, 
  TrendingUp, 
  Code2,
  Users,
  Coffee
} from 'lucide-react';

export const MODES: ModeConfig[] = [
  {
    id: AssistantMode.GENERAL,
    name: 'General Assistant',
    description: 'Everyday tasks and queries',
    systemInstruction: '', // Handled in service
    icon: 'Briefcase'
  },
  {
    id: AssistantMode.EMAIL_DRAFTER,
    name: 'Email Drafter',
    description: 'Professional communication',
    systemInstruction: '',
    icon: 'Mail'
  },
  {
    id: AssistantMode.STRATEGIST,
    name: 'Business Strategist',
    description: 'Analysis and planning',
    systemInstruction: '',
    icon: 'TrendingUp',
    allowedRoles: [UserRole.MANAGER, UserRole.EXECUTIVE]
  },
  {
    id: AssistantMode.CODING,
    name: 'Tech Architect',
    description: 'Code and technical specs',
    systemInstruction: '',
    icon: 'Code2',
    allowedRoles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.EXECUTIVE]
  },
  {
    id: AssistantMode.HR_ASSISTANT,
    name: 'HR Specialist',
    description: 'Policy & Personnel (Restricted)',
    systemInstruction: '',
    icon: 'Users',
    allowedRoles: [UserRole.HR_ADMIN]
  },
  {
    id: AssistantMode.WELLNESS,
    name: 'Wellness Coach',
    description: 'Stress relief & Tips',
    systemInstruction: '',
    icon: 'Coffee'
  }
];