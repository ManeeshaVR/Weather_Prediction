import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

interface GoogleAuthProps {
  onAuthChange: (user: UserProfile | null) => void;
}

export function GoogleAuth({ onAuthChange }: GoogleAuthProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('weatherapp_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        onAuthChange(userData);
      } catch (e) {
        localStorage.removeItem('weatherapp_user');
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Simulate Google OAuth flow with mock data
    // In production, this would use the real Google OAuth API
    setTimeout(() => {
      const mockUser: UserProfile = {
        email: 'demo.user@gmail.com',
        firstName: 'Vimukthi',
        lastName: 'Rajapaksha',
        picture: 'https://ui-avatars.com/api/?name=Vimukthi+Rajapaksha&background=3b82f6&color=fff&size=128',
      };
      
      setUser(mockUser);
      localStorage.setItem('weatherapp_user', JSON.stringify(mockUser));
      onAuthChange(mockUser);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('weatherapp_user');
    onAuthChange(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full pl-1 pr-4 py-1">
          <img
            src={user.picture}
            alt={`${user.firstName} ${user.lastName}`}
            className="size-8 rounded-full border-2 border-white/20"
          />
          <span className="text-sm text-white font-medium">
            Welcome, {user.firstName} {user.lastName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
        >
          <LogOut className="size-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="size-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <svg className="size-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
}
