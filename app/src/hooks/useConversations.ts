'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Message, Conversation } from '@/types';

// Re-export types for backward compatibility
export type { Message, Conversation };

export function useConversations(userId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no userId provided or empty string, skip setting up listeners
    if (!userId || userId.trim() === '') {
      console.log('⚠️ No userId provided to useConversations');
      setConversation(null);
      setLoading(false);
      return;
    }

    console.log('📡 useConversations: Setting up listener for user:', userId);

    let unsubscribeMessages: (() => void) | undefined;
    let isInitialLoad = true;

    // 1. Listen to sessions for this user
    const sessionsRef = collection(db, 'sessions');
    const sessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1) // Only get the most recent session
    );

    console.log('🔍 useConversations: Querying sessions for userId:', userId);

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      (sessionSnapshot) => {
        console.log('📥 useConversations: Session snapshot received, size:', sessionSnapshot.size);

        // If no sessions found
        if (sessionSnapshot.empty) {
          console.log('ℹ️ useConversations: No sessions found for user:', userId);
          setConversation(null);
          setLoading(false);
          return;
        }

        // Get the most recent session
        const sessionDoc = sessionSnapshot.docs[0];
        const sessionData = sessionDoc.data();
        const sessionId = sessionDoc.id;

        console.log('📄 useConversations: Session found:', sessionId, 'Status:', sessionData.status, 'Data:', sessionData);

        // 2. Listen to messages in this session (subcollection)
        const messagesRef = collection(db, 'sessions', sessionId, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        console.log('🔍 useConversations: Setting up messages listener for session:', sessionId);

        // Clean up previous messages listener if exists
        if (unsubscribeMessages) {
          console.log('🧹 useConversations: Cleaning up previous messages listener');
          unsubscribeMessages();
        }

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (messagesSnapshot) => {
            console.log('📥 useConversations: Messages snapshot received, count:', messagesSnapshot.size);

            // Convert Firestore messages to our Message type
            const messages: Message[] = messagesSnapshot.docs.map((doc) => {
              const data = doc.data();
              console.log('💬 useConversations: Processing message:', doc.id, data);

              return {
                id: doc.id,
                text: data.text || '',
                sender: data.sender || 'user',
                timestamp: data.timestamp?.toDate() || new Date(),
                isTranscribing: data.isTranscribing || false,
              };
            });

            // Build conversation object
            const conversationData: Conversation = {
              id: sessionId,
              userId,
              messages,
              isActive: sessionData.status === 'in-progress',
              createdAt: sessionData.timestamp?.toDate(),
              updatedAt: sessionData.updatedAt?.toDate(),
            };

            console.log('✅ useConversations: Conversation updated:', conversationData.messages.length, 'messages', conversationData);

            setConversation(conversationData);
            if (isInitialLoad) {
              setLoading(false);
              isInitialLoad = false;
            }
            setError(null);
          },
          (err) => {
            console.error('❌ useConversations: Error in messages listener:', err);
            console.error('❌ useConversations: Error details:', err.code, err.message);
            setError(err as Error);
            setLoading(false);
          }
        );
      },
      (err) => {
        console.error('❌ useConversations: Error in sessions listener:', err);
        console.error('❌ useConversations: Error details:', err.code, err.message);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up conversation listeners for user:', userId);
      unsubscribeSessions();
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [userId]); // Re-run when userId changes

  return { conversation, loading, error };
}

/*
 * HOW THIS WORKS:
 *
 * 1. Listens to the 'sessions' collection filtered by userId
 * 2. Gets the most recent session (limit 1, ordered by timestamp)
 * 3. For that session, listens to the 'messages' subcollection
 * 4. Automatically updates when:
 *    - New messages are added
 *    - Messages are updated
 *    - Session status changes
 *
 * FIRESTORE STRUCTURE:
 * sessions/
 *   └── {sessionId}/
 *       ├── userId: string
 *       ├── status: 'pending' | 'in-progress' | 'completed'
 *       ├── timestamp: Timestamp
 *       └── messages/ (subcollection)
 *           └── {messageId}/
 *               ├── text: string
 *               ├── sender: 'ai' | 'user'
 *               ├── timestamp: Timestamp
 *               └── isTranscribing: boolean
 */
