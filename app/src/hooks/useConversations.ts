'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Conversation, ConversationMessage, UserProfile } from '@/types';

// Re-export types for backward compatibility
export type { Conversation, ConversationMessage };

export function useConversations(userId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no userId provided or empty string, skip setting up listeners
    if (!userId || userId.trim() === '') {
      console.log('⚠️ No userId provided to useConversations');
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    console.log('📡 useConversations: Setting up listener for user:', userId);

    let unsubscribeMessages: (() => void) | undefined;
    let isInitialLoad = true;

    // Get user's phone number from their profile
    const getUserPhone = async () => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('⚠️ User profile not found for userId:', userId);
        return null;
      }

      const userData = userSnap.data() as UserProfile;
      return userData.phone;
    };

    // Set up listeners
    const setupListeners = async () => {
      const phoneNumber = await getUserPhone();

      if (!phoneNumber) {
        console.log('⚠️ No phone number found for user:', userId);
        setConversation(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      console.log('📞 useConversations: Querying conversations for phone:', phoneNumber);

      // 1. Listen to conversations for this phone number
      const conversationsRef = collection(db, 'conversations');
      const conversationsQuery = query(
        conversationsRef,
        where('phone_number', '==', phoneNumber),
        orderBy('started_at', 'desc'),
        limit(1) // Only get the most recent conversation
      );

      const unsubscribeConversations = onSnapshot(
        conversationsQuery,
        (conversationSnapshot) => {
          console.log('📥 useConversations: Conversation snapshot received, size:', conversationSnapshot.size);

          // If no conversations found
          if (conversationSnapshot.empty) {
            console.log('ℹ️ useConversations: No conversations found for phone:', phoneNumber);
            setConversation(null);
            setMessages([]);
            setLoading(false);
            return;
          }

          // Get the most recent conversation
          const conversationDoc = conversationSnapshot.docs[0];
          const conversationData = conversationDoc.data();
          const conversationId = conversationDoc.id;

          console.log('📄 useConversations: Conversation found:', conversationId, 'Status:', conversationData.status, 'Data:', conversationData);

          // Set conversation data
          setConversation({
            id: conversationId,
            ...conversationData,
          } as Conversation);

          // 2. Listen to messages in this conversation (subcollection)
          const messagesRef = collection(db, 'conversations', conversationId, 'messages');
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

          console.log('🔍 useConversations: Setting up messages listener for conversation:', conversationId);

          // Clean up previous messages listener if exists
          if (unsubscribeMessages) {
            console.log('🧹 useConversations: Cleaning up previous messages listener');
            unsubscribeMessages();
          }

          unsubscribeMessages = onSnapshot(
            messagesQuery,
            (messagesSnapshot) => {
              console.log('📥 useConversations: Messages snapshot received, count:', messagesSnapshot.size);

              // Convert Firestore messages to our ConversationMessage type
              const conversationMessages: ConversationMessage[] = messagesSnapshot.docs.map((doc) => {
                const data = doc.data();
                console.log('💬 useConversations: Processing message:', doc.id, data);

                return {
                  id: doc.id,
                  message: data.message || '',
                  role: data.role || 'user',
                  timestamp: data.timestamp,
                  user_id: data.user_id || null,
                  tool_calls: data.tool_calls || undefined,
                };
              });

              console.log('✅ useConversations: Messages updated:', conversationMessages.length, 'messages');

              setMessages(conversationMessages);
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
          console.error('❌ useConversations: Error in conversations listener:', err);
          console.error('❌ useConversations: Error details:', err.code, err.message);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Return cleanup function
      return () => {
        console.log('🔌 Cleaning up conversation listeners');
        unsubscribeConversations();
        if (unsubscribeMessages) {
          unsubscribeMessages();
        }
      };
    };

    let cleanup: (() => void) | undefined;
    setupListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [userId]); // Re-run when userId changes

  return { conversation, messages, loading, error };
}

/*
 * HOW THIS WORKS:
 *
 * 1. Gets user's phone number from their profile
 * 2. Listens to the 'conversations' collection filtered by phone_number
 * 3. Gets the most recent conversation (limit 1, ordered by started_at)
 * 4. For that conversation, listens to the 'messages' subcollection
 * 5. Automatically updates when:
 *    - New messages are added
 *    - Conversation status changes
 *
 * FIRESTORE STRUCTURE:
 * conversations/
 *   └── {conversationId}/
 *       ├── phone_number: string
 *       ├── status: 'active' | 'completed'
 *       ├── started_at: Timestamp
 *       ├── ended_at: Timestamp | null
 *       ├── last_message: string
 *       └── messages/ (subcollection)
 *           └── {messageId}/
 *               ├── message: string
 *               ├── role: 'assistant' | 'user'
 *               ├── timestamp: Timestamp
 *               └── user_id: string | null
 */
