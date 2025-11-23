export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachment?: Attachment;
}

export enum AssistantMode {
  GENERAL = 'General Assistant',
  EMAIL_DRAFTER = 'Email Specialist',
  STRATEGIST = 'Strategy Advisor',
  CODING = 'Technical Architect',
  HR_ASSISTANT = 'HR Specialist',
  WELLNESS = 'Wellness Coach'
}

export enum UserRole {
  EMPLOYEE = 'Employee',
  MANAGER = 'Manager',
  HR_ADMIN = 'HR Admin',
  EXECUTIVE = 'Executive'
}

export interface User {
  name: string;
  role: UserRole;
}

export interface ModeConfig {
  id: AssistantMode;
  name: string;
  description: string;
  systemInstruction: string;
  icon: string;
  allowedRoles?: UserRole[]; // If undefined, accessible by all
}

// Descheduler Types
export interface Meeting {
  id: string;
  title: string;
  participants: string[];
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
}

// Task Reminder Types
export interface Reminder {
  id: string;
  task: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category?: string;
  notes?: string;
}

// Future Prediction Types
export interface Prediction {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}