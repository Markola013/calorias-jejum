'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { Flame, Utensils, Clock, Droplet, Scale, LogOut, User, Sun, Moon } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { label: 'Painel', path: '/', icon: Flame, activeColor: 'text-emerald-400' },
    { label: 'Refeições', path: '/meals', icon: Utensils, activeColor: 'text-orange-400' },
    { label: 'Jejum', path: '/fasting', icon: Clock, activeColor: 'text-emerald-400' },
    { label: 'Água', path: '/water', icon: Droplet, activeColor: 'text-blue-400' },
    { label: 'Peso', path: '/weight', icon: Scale, activeColor: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex justify-center overflow-x-hidden">
      {/* Centered Mobile Frame Wrapper */}
      <div className="w-full max-w-md bg-zinc-900/25 border-x border-zinc-800/40 min-h-screen flex flex-col pb-24 relative shadow-2xl">
        
        {/* Glowing Decorative Background Bubbles inside viewport */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[150px] w-[250px] rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />

        {/* Top Header Navigation */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm">
              NF
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">NutriFast</p>
              <p className="text-xs font-semibold text-zinc-200">
                Olá, {user?.displayName || 'Usuário'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 hover:text-zinc-200 text-zinc-400 transition-all duration-200"
              title="Alterar Tema"
            >
              {!mounted ? (
                <div className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 hover:text-red-400 text-zinc-400 transition-all duration-200"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Main Page Content */}
        <main className="flex-1 px-4 py-5 overflow-y-auto z-10">
          {children}
        </main>

        {/* Floating Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/50 px-4 py-2 flex items-center justify-around z-40 pb-safe-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 relative group"
              >
                <div
                  className={`p-1 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? `${item.activeColor} scale-110` 
                      : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-[9px] font-bold tracking-wider transition-all duration-300 ${
                    isActive 
                      ? `${item.activeColor} font-semibold` 
                      : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  {item.label}
                </span>

                {/* Glow bar for active tab */}
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
