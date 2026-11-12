import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, DEFAULT_USER_PROFILES } from '../types/userProfile';
import { useAdminAuth } from './AdminAuthContext';

const STORAGE_KEY_USERS = 'app_user_profiles_v1';
const STORAGE_KEY_CURRENT_USER = 'app_current_user_profile_v1';

interface UserProfileContextValue {
  currentUser: UserProfile;
  users: UserProfile[];
  isEffectiveAdmin: boolean;
  setCurrentUser: (user: UserProfile) => void;
  addUser: (userData: Omit<UserProfile, 'id'>) => UserProfile;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => boolean;
  resetDefaultUsers: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export const UserProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAdmin: isSupabaseAdmin } = useAdminAuth();

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading users from localStorage', e);
    }
    return DEFAULT_USER_PROFILES;
  });

  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading current user from localStorage', e);
    }
    // Default to admin or first user
    return DEFAULT_USER_PROFILES[0];
  });

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [users]);

  // Sync current user to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Error saving current user to localStorage', e);
    }
  }, [currentUser]);

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
  };

  const addUser = (userData: Omit<UserProfile, 'id'>): UserProfile => {
    const newId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      ...userData,
      id: newId,
      avatarColor: userData.avatarColor || 'from-indigo-500 to-purple-600',
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          // If updated current user, reflect change
          if (currentUser.id === id) {
            setCurrentUserState(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string): boolean => {
    if (users.length <= 1) return false;
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== id);
      if (currentUser.id === id && filtered.length > 0) {
        setCurrentUserState(filtered[0]);
      }
      return filtered;
    });
    return true;
  };

  const resetDefaultUsers = () => {
    setUsers(DEFAULT_USER_PROFILES);
    setCurrentUserState(DEFAULT_USER_PROFILES[0]);
  };

  const isEffectiveAdmin = useMemo(() => {
    return isSupabaseAdmin || currentUser.role === 'admin';
  }, [isSupabaseAdmin, currentUser.role]);

  return (
    <UserProfileContext.Provider
      value={{
        currentUser,
        users,
        isEffectiveAdmin,
        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        resetDefaultUsers,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextValue => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
