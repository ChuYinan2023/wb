import React, { useState } from 'react';
import { Globe, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AuthModal } from './auth/AuthModal';

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold text-gray-900">Bookmarks Manager</h1>
          </div>
          
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <LogOut size={20} />
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <User size={20} />
                登录/注册
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}