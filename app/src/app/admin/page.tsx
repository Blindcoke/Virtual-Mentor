'use client';

import { useState, useEffect, useRef } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useConversations } from '@/hooks/useConversations';
import { useInitiateCall } from '@/hooks/use-call';
import { ToolCallDisplay } from '@/components/tool-call-display';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';

export default function AdminPage() {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  // Auto-select first user when users load
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { conversation, messages, loading: conversationLoading, error: conversationError } = useConversations(selectedUserId || undefined);
  const initiateCall = useInitiateCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first user - derived from users array
  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      // Use setTimeout to defer state update and avoid cascading renders
      const timer = setTimeout(() => {
        setSelectedUserId(users[0].uid);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [users, selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCallNow = () => {
    if (!selectedUser || !selectedUser.phone) {
      return;
    }

    initiateCall.mutate({
      phoneNumber: selectedUser.phone,
      userId: selectedUser.uid,
      userName: selectedUser.name,
    });
  };

  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - User List */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          {!sidebarCollapsed && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor live conversations
            </p>
          )}
        </div>

        {/* Stats */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400">Total Users</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {users.length}
              </p>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {usersLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {!sidebarCollapsed && 'Loading users...'}
            </div>
          ) : usersError ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {!sidebarCollapsed && 'Error loading users.'}
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.uid}
                onClick={() => setSelectedUserId(user.uid)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                  selectedUserId === user.uid
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                title={sidebarCollapsed ? user.name : undefined}
              >
                {sidebarCollapsed ? (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.phone}
                    </p>
                  </>
                )}
              </div>
            ))
          )}
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
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCallNow}
                  disabled={initiateCall.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition font-medium"
                >
                  <Phone className="w-4 h-4" />
                  {initiateCall.isPending ? 'Calling...' : 'Call Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {!selectedUserId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                Select a user to view their conversation
              </div>
            </div>
          ) : conversationLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">Loading conversation...</div>
            </div>
          ) : conversationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500 dark:text-red-400">Error loading conversation.</div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${message.role === 'assistant'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'bg-blue-600 text-white'
                      } shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.role === 'assistant' ? 'AI Mentor' : selectedUser?.name}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    {message.tool_calls && message.tool_calls.length > 0 && (
                      <ToolCallDisplay toolCalls={message.tool_calls} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No conversation history
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Messages will appear here once a call is triggered
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

