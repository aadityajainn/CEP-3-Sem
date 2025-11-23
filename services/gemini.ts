import { GoogleGenAI, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Message, Role, AssistantMode, UserRole, Attachment } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

// --- Tool Definitions ---

const setReminderTool: FunctionDeclaration = {
  name: 'setReminder',
  description: 'Set a reminder for the user for a specific task and time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      task: { type: Type.STRING, description: 'The task to be reminded about.' },
      time: { type: Type.STRING, description: 'The time for the reminder (e.g. "2pm", "in 10 minutes").' },
    },
    required: ['task', 'time'],
  },
};

const scheduleMeetingTool: FunctionDeclaration = {
  name: 'scheduleMeeting',
  description: 'Schedule a meeting with colleagues.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: 'The subject or topic of the meeting.' },
      participants: { type: Type.STRING, description: 'Comma separated list of participants.' },
      time: { type: Type.STRING, description: 'Date and time of the meeting.' },
    },
    required: ['topic', 'participants', 'time'],
  },
};

// Lazy initialization helper
const getAiClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing in the environment");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (mode: AssistantMode, userRole: UserRole, history: Message[] = []): Chat => {
  let systemInstruction = "";

  switch (mode) {
    case AssistantMode.EMAIL_DRAFTER:
      systemInstruction = "You are an expert corporate communications specialist. Your goal is to draft clear, concise, and professional emails. You adjust tone based on the recipient (e.g., executive, peer, client). Always prioritize brevity and clarity.";
      break;
    case AssistantMode.STRATEGIST:
      systemInstruction = "You are a senior business strategist. You analyze problems using frameworks like SWOT, PESTLE, or OKRs. Your advice is strategic, long-term oriented, and risk-aware. Focus on ROI and business impact.";
      break;
    case AssistantMode.CODING:
      systemInstruction = "You are a principal software architect. You provide high-quality, secure, and scalable code solutions. You explain technical concepts clearly to business stakeholders when necessary.";
      break;
    case AssistantMode.HR_ASSISTANT:
      systemInstruction = "You are a Human Resources confidant and policy expert. You assist HR Administrators with sensitive employee data, policy drafting, and conflict resolution. Maintain strict confidentiality, professional empathy, and adherence to labor laws.";
      break;
    case AssistantMode.WELLNESS:
      systemInstruction = "You are a corporate wellness coach. Your goal is to help reduce employee burnout and stress. Provide calming advice, breathing exercises, productivity tips that emphasize work-life balance, and empathetic listening. Keep a soothing and supportive tone.";
      break;
    case AssistantMode.GENERAL:
    default:
      systemInstruction = "You are a helpful, professional, and efficient corporate AI assistant. You help with a wide range of business tasks. Keep your answers structured, using bullet points and bold text for readability. You can analyze PDFs and data provided by the user.";
      break;
  }

  // Inject User Role Context
  systemInstruction += `\n\n[User Context]\nYou are conversing with a user who has the corporate role of "${userRole}". Adjust your level of detail, tone, and strategic depth to match this role.`;

  const ai = getAiClient();
  
  // Only provide tools in General mode for now to keep other personas focused, 
  // or add to all if needed. Adding to General and Email for this demo.
  const tools = (mode === AssistantMode.GENERAL || mode === AssistantMode.EMAIL_DRAFTER) 
    ? [{ functionDeclarations: [setReminderTool, scheduleMeetingTool] }] 
    : undefined;

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      tools: tools
    },
  });
};

export const sendMessageStream = async (
  chat: Chat, 
  message: string, 
  attachment?: Attachment
): Promise<AsyncIterable<GenerateContentResponse>> => {
  
  // If there is an attachment, we need to format the content parts
  if (attachment) {
    const contentPart = {
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    };
    const textPart = { text: message || "Please analyze this document." };
    
    return await chat.sendMessageStream({ 
      message: [contentPart, textPart] 
    });
  }

  // Standard text message
  return await chat.sendMessageStream({ message });
};

// New function for Smart Replies
export const generateSmartSuggestions = async (history: Message[]): Promise<string[]> => {
  const ai = getAiClient();
  
  // Extract last few messages for context
  const recentContext = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Based on the conversation below, suggest 3 short, professional follow-up responses (max 5-6 words each) that the user might want to send next. Return ONLY the phrases separated by pipes (|). Do not number them.
  
  Conversation:
  ${recentContext}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.5 }
    });
    
    const text = response.text || "";
    return text.split('|').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
  } catch (e) {
    console.error("Smart suggestion error", e);
    return ["Tell me more", "Thank you", "Next steps?"];
  }
};