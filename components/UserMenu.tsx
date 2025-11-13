'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { LogOut, User as UserIcon } from 'lucide-react';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
}

export default function UserMenu({ user, profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0].toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm transition-colors"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{getInitials()}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a2a2a] text-white text-sm">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {profile?.full_name || 'Пользователь'}
                </p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to profile page
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span>Профиль</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-left text-gray-300 hover:text-red-400 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

