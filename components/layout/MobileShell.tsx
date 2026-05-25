'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { Flame, Utensils, Clock, Droplet, Scale, LogOut, User, Sun, Moon, BarChart3 } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
}

// EXPLICAÇÃO PARA O PROFESSOR: MobileShell age como o layout raiz de navegação (Shell).
// NOTA DIDÁTICA: O layout é híbrido e responsivo!
// 1. Em telas de computador (desktop - breakpoint 'md' do Tailwind), renderiza uma barra lateral fixa à esquerda (aside) de 240px.
// 2. Em telas de celular (mobile), oculta a barra lateral e revela um cabeçalho superior compacto e um menu inferior flutuante (nav).
// 3. Isso permite que a mesma base de código React sirva como um aplicativo mobile de alto nível e um SaaS completo no desktop!
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


  // 6 Nav Items for Desktop Sidebar
  const sidebarItems = [
    { label: 'Painel', path: '/', icon: Flame, activeColor: 'text-emerald-400', activeBg: 'bg-emerald-500/10' },
    { label: 'Refeições', path: '/meals', icon: Utensils, activeColor: 'text-orange-400', activeBg: 'bg-orange-500/10' },
    { label: 'Jejum', path: '/fasting', icon: Clock, activeColor: 'text-emerald-400', activeBg: 'bg-emerald-500/10' },
    { label: 'Água', path: '/water', icon: Droplet, activeColor: 'text-blue-400', activeBg: 'bg-blue-500/10' },
    { label: 'Peso', path: '/weight', icon: Scale, activeColor: 'text-purple-400', activeBg: 'bg-purple-500/10' },
    { label: 'Evolução', path: '/analytics', icon: BarChart3, activeColor: 'text-amber-400', activeBg: 'bg-amber-500/10' },
  ];

  // 5 Nav Items for Mobile Bottom Navigation
  const mobileNavItems = [
    { label: 'Painel', path: '/', icon: Flame, activeColor: 'text-emerald-400' },
    { label: 'Refeições', path: '/meals', icon: Utensils, activeColor: 'text-orange-400' },
    { label: 'Jejum', path: '/fasting', icon: Clock, activeColor: 'text-emerald-400' },
    { label: 'Água', path: '/water', icon: Droplet, activeColor: 'text-blue-400' },
    { label: 'Peso', path: '/weight', icon: Scale, activeColor: 'text-purple-400' },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex text-zinc-100 font-sans overflow-x-hidden">
      
      {/* 1. DESKTOP SIDEBAR (Visible on md and larger screens) */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/40 min-h-screen sticky top-0 z-30 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-zinc-800/30">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-base shadow-inner shadow-emerald-400/20">
            NF
          </div>
          <div>
            <h2 className="text-sm font-black tracking-widest text-zinc-100 uppercase">NutriFast</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Premium Dashboard</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-5 flex items-center space-x-3.5 border-b border-zinc-800/30 bg-zinc-900/10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 flex items-center justify-center text-emerald-400 font-black text-sm border border-emerald-500/20">
            {getInitials(user?.displayName || 'Usuário')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-extrabold">Logado como</p>
            <p className="text-xs font-bold text-zinc-200 truncate" title={user?.displayName || 'Usuário'}>
              {user?.displayName || 'Usuário'}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
                  isActive 
                    ? `${item.activeBg} ${item.activeColor}` 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-all duration-300 ${isActive ? '' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-zinc-800/30 space-y-2">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl hover:bg-red-500/5 text-zinc-450 hover:text-red-400 transition-all duration-200 text-xs font-bold"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-zinc-950">
        
        {/* Decorative Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[220px] w-[500px] rounded-full bg-emerald-500/5 blur-[85px] pointer-events-none" />

        {/* MOBILE TOP HEADER (Visible on mobile only, hidden on md) */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40 px-4 py-3 flex items-center justify-between md:hidden select-none">
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

          <div className="flex items-center space-x-1.5">
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 hover:text-red-400 text-zinc-450 transition-all duration-200"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* DYNAMIC CONTENT AREA */}
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 lg:px-12 z-10 max-w-5xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR (Visible on mobile only, hidden on md) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/50 px-4 py-2 flex items-center justify-around z-40 pb-safe-bottom md:hidden select-none">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-300 relative group"
              >
                <div
                  className={`p-1 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? `${item.activeColor} scale-110` 
                      : 'text-zinc-550 group-hover:text-zinc-450'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-[9px] font-bold tracking-wider transition-all duration-300 ${
                    isActive 
                      ? `${item.activeColor}` 
                      : 'text-zinc-550 group-hover:text-zinc-450'
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
