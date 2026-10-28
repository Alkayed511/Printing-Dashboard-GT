import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { syncUserProfile } from '../firebase/services';
import { UserProfile, UserRole } from '../types/printManager';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isEmployee: boolean;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulationRole: UserRole | null;
  setSimulationRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationRole, setSimulationRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
          setUserProfile(profile);
        } catch (e) {
          console.error('Error syncing profile:', e);
          // Fallback profile if offline
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'مستخدم',
            role: user.email?.toLowerCase() === 'h511alkayed@gmail.com' ? 'admin' : 'employee',
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setSimulationRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const effectiveRole: UserRole = simulationRole || userProfile?.role || 'employee';
  const isAdmin = effectiveRole === 'admin';
  const isEmployee = effectiveRole === 'employee';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isEmployee,
        role: effectiveRole,
        loading,
        signInWithGoogle,
        signOut,
        simulationRole,
        setSimulationRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
