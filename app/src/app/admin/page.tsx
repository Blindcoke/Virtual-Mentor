'use client';

import { useState, useEffect, useRef } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useConversations } from '@/hooks/useConversations';
import { createSession } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/dist/client/link';

export default function AdminPage() {
  const { users, loading: usersLoading, error: usersError } = useUsers();
  // Auto-select first user when users load
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { conversation, loading: conversationLoading, error: conversationError } = useConversations(selectedUserId || undefined);
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
  }, [conversation]);

  const handleTriggerCall = async (userId: string) => {
    try {
      await createSession({
        userId,
        status: 'in-progress',
        timestamp: Timestamp.now(),
      });
      setSelectedUserId(userId);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const selectedUser = users.find(u => u.uid === selectedUserId);

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
          {usersLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
          ) : usersError ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">Error loading users.</div>
          ) : (
            users.map((user) => {
              const isActive = user.status === 'in-call';

              return (
                <div
                  key={user.uid}
                  onClick={() => setSelectedUserId(user.uid)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${selectedUserId === user.uid
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {user.phone}
                  </p>
                  {!isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerCall(user.uid);
                      }}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Start Call
                    </button>
                  )}
                </div>
              );
            })
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
                  {conversation?.isActive && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      • Live
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Exit
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {conversationLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">Loading conversation...</div>
            </div>
          ) : conversationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500 dark:text-red-400">Error loading conversation.</div>
            </div>
          ) : conversation && conversation.messages.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${message.sender === 'ai'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'bg-blue-600 text-white'
                      } shadow-sm`}>
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
                  onClick={() => handleTriggerCall(selectedUserId!)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transcription Indicator */}
        {conversation?.isActive && (
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

