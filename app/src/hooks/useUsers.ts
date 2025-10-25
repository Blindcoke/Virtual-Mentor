'use client';

import { db } from '@/lib/firebase/config';
import type { Conversation, UserProfile, UserWithStatus } from '@/types';
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Re-export types for backward compatibility
export type { UserWithStatus };

export function useUsers() {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {

    const updateUsersWithStatus = async (userProfiles: UserProfile[]) => {

      const usersWithStatus = await Promise.all(
        userProfiles.map(async (user) => {
          // Skip users without phone numbers
          if (!user.phone) {
            return { ...user, status: 'inactive' as const };
          }

          const conversationsRef = collection(db, 'conversations');
          const q = query(
            conversationsRef,
            where('phone_number', '==', user.phone),
            orderBy('started_at', 'desc'),
            limit(1)
          );

          try {
            const conversationSnapshot = await getDocs(q);
            const latestConversation = conversationSnapshot.docs[0]?.data() as Conversation | undefined;

            let status: UserWithStatus['status'] = 'inactive';
            if (latestConversation) {
              if (latestConversation.status === 'active') {
                status = 'in-call';
              } else if (latestConversation.status === 'completed') {
                status = 'active';
              }
            }

            return { ...user, status };
          } catch (conversationErr) {
            console.warn('⚠️ Error fetching conversations for user', user.uid, conversationErr);
            return { ...user, status: 'inactive' as const };
          }
        })
      );

      console.log('✅ useUsers: Updated', usersWithStatus.length, 'users with status');
      setUsers(usersWithStatus);
    };

    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(
      usersRef,
      async (snapshot) => {
        try {
          console.log('📥 useUsers: Received users snapshot, size:', snapshot.size);
          const userProfiles = snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id  // Include document ID as uid
          } as UserProfile));
          await updateUsersWithStatus(userProfiles);
          setLoading(false);
        } catch (err) {
          console.error('❌ useUsers: Error in users snapshot handler:', err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ useUsers: Error in users listener:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Listen to conversations collection to update user statuses in real-time
    const conversationsRef = collection(db, 'conversations');
    const unsubscribeConversations = onSnapshot(
      conversationsRef,
      async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const userProfiles = usersSnapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id  // Include document ID as uid
          } as UserProfile));
          await updateUsersWithStatus(userProfiles);
        } catch {
          // Silent error handling for conversation updates
        }
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeConversations();
    };
  }, []);

  return { users, loading, error };
}
