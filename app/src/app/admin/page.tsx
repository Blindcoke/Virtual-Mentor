'use client';

import { useState, useEffect, useRef } from 'react';

type User = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'in-call';
};

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  isTranscribing?: boolean;
};

type Conversation = {
  userId: string;
  messages: Message[];
  isActive: boolean;
};

export default function AdminPage() {
  const [users] = useState<User[]>([
    { id: '1', name: 'John Doe', phone: '+1 (555) 123-4567', status: 'active' },
    { id: '2', name: 'Jane Smith', phone: '+1 (555) 234-5678', status: 'in-call' },
    { id: '3', name: 'Bob Johnson', phone: '+1 (555) 345-6789', status: 'active' },
  ]);

  const [selectedUserId, setSelectedUserId] = useState<string>('2');
  const [conversations, setConversations] = useState<Record<string, Conversation>>({
    '1': {
      userId: '1',
      isActive: false,
      messages: [
        { id: '1', sender: 'ai', text: 'Hi John! How are you doing today?', timestamp: new Date('2025-10-25T09:00:00') },
        { id: '2', sender: 'user', text: "I'm doing great, thanks for asking!", timestamp: new Date('2025-10-25T09:00:15') },
        { id: '3', sender: 'ai', text: "That's wonderful to hear! What would you like to focus on today?", timestamp: new Date('2025-10-25T09:00:30') },
      ],
    },
    '2': {
      userId: '2',
      isActive: true,
      messages: [
        { id: '1', sender: 'ai', text: 'Good morning Jane! Ready for our daily check-in?', timestamp: new Date('2025-10-25T10:00:00') },
        { id: '2', sender: 'user', text: 'Yes, absolutely! I wanted to talk about my progress.', timestamp: new Date('2025-10-25T10:00:12') },
        { id: '3', sender: 'ai', text: 'Perfect! Let me hear about what you accomplished yesterday.', timestamp: new Date('2025-10-25T10:00:25') },
        { id: '4', sender: 'user', text: 'I completed three major tasks and started working on the new project.', timestamp: new Date('2025-10-25T10:00:42') },
        { id: '5', sender: 'ai', text: "That's excellent progress! How do you feel about the new project so far?", timestamp: new Date('2025-10-25T10:00:55') },
      ],
    },
    '3': {
      userId: '3',
      isActive: false,
      messages: [],
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedUserId]);

  // Simulate real-time transcription for active call
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const activeConversation = conversations[selectedUserId];
      if (activeConversation?.isActive) {
        const simulatedMessages = [
          { sender: 'user' as const, text: 'I think I need to adjust my schedule for better productivity.' },
          { sender: 'ai' as const, text: 'That sounds like a great idea. What specific changes are you considering?' },
          { sender: 'user' as const, text: 'Maybe waking up an hour earlier to have some quiet time.' },
          { sender: 'ai' as const, text: 'Early mornings can be very productive. Have you tried this before?' },
        ];

        const randomMessage = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];

        setConversations(prev => ({
          ...prev,
          [selectedUserId]: {
            ...prev[selectedUserId],
            messages: [
              ...prev[selectedUserId].messages,
              {
                id: Date.now().toString(),
                sender: randomMessage.sender,
                text: randomMessage.text,
                timestamp: new Date(),
              },
            ],
          },
        }));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, selectedUserId, conversations]);

  const handleTriggerCall = async (userId: string) => {
    setConversations(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        isActive: true,
        messages: [
          ...(prev[userId]?.messages || []),
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: 'Hello! Starting our mentoring session now.',
            timestamp: new Date(),
          },
        ],
      },
    }));
    setSelectedUserId(userId);
  };

  const selectedConversation = conversations[selectedUserId];
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - User List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor live conversations
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400">Active Calls</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {users.filter(u => u.status === 'in-call').length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400">Total Users</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {users.length}
              </p>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => {
            const conversation = conversations[user.id];
            const isActive = conversation?.isActive;
            const messageCount = conversation?.messages.length || 0;
            const lastMessage = conversation?.messages[conversation.messages.length - 1];

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                  selectedUserId === user.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {user.name}
                    </h3>
                  </div>
                  {messageCount > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {messageCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {user.phone}
                </p>
                {lastMessage && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {lastMessage.sender === 'ai' ? 'AI: ' : 'User: '}
                    {lastMessage.text}
                  </p>
                )}
                {!isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerCall(user.id);
                    }}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Start Call
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedUser && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser.phone}
                  {selectedConversation?.isActive && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      • Live
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    isSimulating
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </button>
                <a
                  href="/"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Exit
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {selectedConversation && selectedConversation.messages.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.sender === 'ai'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'bg-blue-600 text-white'
                    } shadow-sm`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.sender === 'ai' ? 'AI Mentor' : selectedUser?.name}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    {message.isTranscribing && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-75" />
                        <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No messages yet
                </p>
                <button
                  onClick={() => handleTriggerCall(selectedUserId)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transcription Indicator */}
        {selectedConversation?.isActive && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Live transcription active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
