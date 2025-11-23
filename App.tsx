import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession, sendMessageStream, generateSmartSuggestions } from './services/gemini';
import { Message, Role, AssistantMode, User, UserRole, Attachment } from './types';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { Dashboard } from './components/Dashboard';
import { MODES } from './constants';
import {
  Send,
  Menu,
  Loader2,
  StopCircle,
  Eraser,
  Paperclip,
  X,
  FileText,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'ai-chat' | 'descheduler' | 'task-reminder' | 'future-prediction'>('dashboard');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState<AssistantMode>(AssistantMode.GENERAL);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // File State
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);

  // Refs
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat Session
  const initSession = useCallback((mode: AssistantMode, currentUser: User) => {
    chatSessionRef.current = createChatSession(mode, currentUser.role);
    setMessages([{
      id: 'init',
      role: Role.MODEL,
      content: `Hello ${currentUser.name}. I am your ${mode}. How can I assist you today?`,
      timestamp: new Date()
    }]);
    setSuggestions([]);
  }, []);

  // Initial load effect - only initialize chat session when in AI chat view
  useEffect(() => {
    if (user && currentView === 'ai-chat') {
      initSession(AssistantMode.GENERAL, user);
    }
  }, [user, currentView, initSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, selectedFile]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    setCurrentMode(AssistantMode.GENERAL);
    setCurrentView('dashboard');
    chatSessionRef.current = null;
    setSelectedFile(null);
  };

  const handleNavigate = (section: string) => {
    if (section === 'ai-chat') {
      setCurrentView('ai-chat');
      if (user) {
        initSession(AssistantMode.GENERAL, user);
      }
    } else {
      setCurrentView(section as 'descheduler' | 'task-reminder' | 'future-prediction');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleModeSelect = (mode: AssistantMode) => {
    if (mode !== currentMode && user) {
      setCurrentMode(mode);
      initSession(mode, user);
      setSidebarOpen(false);
    }
  };

  const handleClearChat = () => {
    if (user) {
      initSession(currentMode, user);
    }
  };

  // File Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = (event.target?.result as string).split(',')[1];
          setSelectedFile({
            name: file.name,
            mimeType: file.type,
            data: base64String
          });
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select a PDF or Image file.");
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Function Call Execution Mock
  const executeFunction = async (call: any) => {
    console.log("Executing tool:", call.name, call.args);
    let result = "";

    if (call.name === 'setReminder') {
      // Mock implementation
      alert(`🔔 REMINDER SET:\n"${call.args.task}" at ${call.args.time}`);
      result = `Success. I have set a reminder for "${call.args.task}" at ${call.args.time}.`;
    } else if (call.name === 'scheduleMeeting') {
      // Mock implementation
      alert(`📅 MEETING SCHEDULED:\nTopic: ${call.args.topic}\nWith: ${call.args.participants}\nTime: ${call.args.time}`);
      result = `Success. Meeting scheduled regarding "${call.args.topic}" with ${call.args.participants} at ${call.args.time}.`;
    } else {
      result = "Error: Function not implemented.";
    }

    return {
      functionResponses: [{
        id: call.id,
        name: call.name,
        response: { result: result }
      }]
    };
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !selectedFile) || !chatSessionRef.current || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: textToSend,
      timestamp: new Date(),
      attachment: selectedFile || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null); // Clear file after sending
    setSuggestions([]); // Clear old suggestions
    setIsStreaming(true);

    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const responseId = (Date.now() + 1).toString();

      // Add placeholder for model response
      setMessages(prev => [...prev, {
        id: responseId,
        role: Role.MODEL,
        content: '',
        timestamp: new Date()
      }]);

      const stream = await sendMessageStream(
        chatSessionRef.current,
        userMessage.content,
        userMessage.attachment
      );

      let fullResponse = '';

      for await (const chunk of stream) {
        // Handle Function Calls
        const functionCalls = chunk.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          // Pause streaming UI state to process tool (technically still streaming in backend)
          for (const call of functionCalls) {
            const toolResponse = await executeFunction(call);

            // Send tool response back to model to get final text confirmation
            // Note: In a simpler app we might stop here, but Gemini expects the loop to close
            const messageParts = toolResponse.functionResponses.map((fr: any) => ({
              functionResponse: {
                name: fr.name,
                response: fr.response,
                id: fr.id
              }
            }));

            const toolStream = await chatSessionRef.current.sendMessageStream({
              message: messageParts
            });

            for await (const toolChunk of toolStream) {
              if (toolChunk.text) {
                fullResponse += toolChunk.text;
                setMessages(prev => prev.map(msg =>
                  msg.id === responseId
                    ? { ...msg, content: fullResponse }
                    : msg
                ));
              }
            }
          }
        }

        // Handle Text
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => prev.map(msg =>
            msg.id === responseId
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      }

      // After message is complete, generate smart suggestions
      // We do this detached from the stream to not block UI
      generateSmartSuggestions([...messages, userMessage, { role: Role.MODEL, content: fullResponse } as Message])
        .then(s => setSuggestions(s));

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "**System Notification:** Connection interruption detected. Please retry your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    setInput(target.value);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show Dashboard
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-slate-800">Corporate AI Assistant</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600 hidden md:block">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <Dashboard onNavigate={handleNavigate} userName={user.name} />
      </div>
    );
  }

  // Show other sections (for now, only AI chat is implemented)
  if (currentView !== 'ai-chat') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-lg font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600 hidden md:block">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{currentView.replace('-', ' ')}</h2>
            <p className="text-slate-600">This feature is coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-corporate-50 overflow-hidden font-sans">

      {/* Sidebar */}
      <Sidebar
        currentMode={currentMode}
        userRole={user.role}
        userName={user.name}
        onModeSelect={handleModeSelect}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative w-full">

        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
          <div className="flex items-center">
            <button
              onClick={handleBackToDashboard}
              className="mr-3 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-3 md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800">{currentMode}</h1>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">Gemini 2.5 Flash Enterprise</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearChat}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Clear Conversation"
            >
              <Eraser size={16} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide scroll-smooth relative">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[90%] md:max-w-[80%]">
                  <div
                    className={`
                      rounded-2xl px-5 py-4 shadow-sm
                      ${msg.role === Role.USER
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}
                    `}
                  >
                    {/* Attachment Display */}
                    {msg.attachment && (
                      <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 flex items-center space-x-3">
                        <div className="bg-white p-2 rounded-md">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-semibold truncate opacity-90">{msg.attachment.name}</span>
                          <span className="text-[10px] opacity-70 uppercase">PDF Document</span>
                        </div>
                      </div>
                    )}

                    <div className="text-sm md:text-base">
                      {msg.role === Role.USER ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {isStreaming && messages[messages.length - 1]?.role === Role.USER && (
              <div className="flex w-full justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-slate-500 text-sm">Processing request...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Suggestions Chips */}
            {!isStreaming && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end mt-4 animate-fade-in">
                <div className="flex items-center text-xs text-slate-400 mr-2">
                  <Sparkles size={12} className="mr-1" />
                  Suggested:
                </div>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s)}
                    className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-3xl mx-auto relative">

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="absolute -top-14 left-0 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3 text-sm z-20 animate-slide-up">
                <FileText size={16} className="text-blue-300" />
                <span className="max-w-[200px] truncate">{selectedFile.name}</span>
                <button onClick={clearFile} className="hover:bg-slate-700 p-1 rounded-full">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">

              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Attach PDF or Image"
                disabled={isStreaming}
              >
                <Paperclip size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputInput}
                onKeyDown={handleKeyDown}
                placeholder={selectedFile ? "Ask about this document..." : `Message ${currentMode}...`}
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[44px] py-2.5 px-1 text-slate-800 placeholder:text-slate-400 text-sm md:text-base"
                rows={1}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !selectedFile) || isStreaming}
                className={`
                  p-2.5 rounded-lg mb-1 transition-all duration-200
                  ${(!input.trim() && !selectedFile) || isStreaming
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95'}
                `}
              >
                {isStreaming ? <StopCircle size={20} /> : <Send size={20} />}
              </button>
            </div>
            <div className="text-center mt-2 flex justify-center space-x-4">
              <p className="text-[10px] text-slate-400">
                Confidential. AI generated content may be inaccurate.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;