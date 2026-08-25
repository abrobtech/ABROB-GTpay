import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/config/firebase';
import { useAuth } from './useFirebaseAuth';

export type UserProfile = {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  company?: string;
  createdAt?: string;
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const pRef = ref(database, `users/${user.uid}`);
    const unsub = onValue(pRef, (snap) => {
      setProfile(snap.val());
      setLoading(false);
    }, (err) => {
      console.error('Error reading user profile', err);
      setProfile(null);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { profile, loading };
}
