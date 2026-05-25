'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch the latest UserProfile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      if (!db) {
        console.warn('Firestore database is not initialized.');
        return null;
      }
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile from Firestore:', error);
      return null;
    }
  };

  // Method to refresh user profile data in the application state
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    const profile = await fetchUserProfile(user.uid);
    setUserProfile(profile);
    return profile;
  };

  const logout = async () => {
    if (!auth) {
      console.warn('Auth is not initialized.');
      return;
    }
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom Firestore profile details if authenticated
        const profile = await fetchUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        logout,
        refreshUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
