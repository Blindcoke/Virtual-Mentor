'use client';

import { db } from '@/lib/firebase/config';
import type { Session, UserProfile, UserWithStatus } from '@/types';
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
          const sessionsRef = collection(db, 'sessions');
          const q = query(
            sessionsRef,
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(1)
          );

          try {
            const sessionSnapshot = await getDocs(q);
            const latestSession = sessionSnapshot.docs[0]?.data() as Session | undefined;

            let status: UserWithStatus['status'] = 'inactive';
            if (latestSession) {
              if (latestSession.status === 'in-progress') {
                status = 'in-call';
              } else if (latestSession.status === 'completed' || latestSession.status === 'scheduled') {
                status = 'active';
              }
            }

            return { ...user, status };
          } catch (sessionErr) {
            console.warn('⚠️ Error fetching sessions for user', user.uid, sessionErr);
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

    // Listen to sessions collection to update user statuses in real-time
    const sessionsRef = collection(db, 'sessions');
    const unsubscribeSessions = onSnapshot(
      sessionsRef,
      async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const userProfiles = usersSnapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id  // Include document ID as uid
          } as UserProfile));
          await updateUsersWithStatus(userProfiles);
        } catch {
          // Silent error handling for session updates
        }
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeSessions();
    };
  }, []);

  return { users, loading, error };
}
