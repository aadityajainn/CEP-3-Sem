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