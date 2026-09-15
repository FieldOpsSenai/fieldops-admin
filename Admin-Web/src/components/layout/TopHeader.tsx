'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, LogOut, User, Activity, CheckCircle2, Shield } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { authService } from '@/lib/api/services';
import apiClient from '@/lib/api/axios';

export default function TopHeader({ title, context }: { title: string; context?: React.ReactNode }) {
  const { session } = useSessionStore();
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Ping API endpoint or auth status
  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      try {
        await apiClient.get('/clientes', { timeout: 3000 });
        if (isMounted) setIsApiOnline(true);
      } catch (err: any) {
        // If 401/403, API is online! If network error, API is offline
        if (isMounted) {
          if (err.response) {
            setIsApiOnline(true);
          } else {
            setIsApiOnline(false);
          }
        }
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const userName = session?.name || 'Administrador';
  const userEmail = session?.email || 'admin@fieldops.com';
  const userProfile = session?.profile || 'ADMINISTRADOR';

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* Left side: Context/Breadcrumbs & Search */}
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-2">
          {context ? (
            context
          ) : (
            <span className="font-bold text-slate-800 text-lg">{title}</span>
          )}
        </div>

        <div className="relative w-64 max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Pesquisar no sistema..."
            className="block w-full pl-9 py-1.5 bg-slate-100 border-transparent rounded-md text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Right side: API Status, Actions & Profile */}
      <div className="flex items-center gap-4 text-slate-500">
        
        {/* Live Backend Connection Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50">
          <span 
            className={`w-2 h-2 rounded-full ${
              isApiOnline === true 
                ? 'bg-emerald-500 animate-pulse' 
                : isApiOnline === false 
                ? 'bg-red-500' 
                : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-600">
            API Java 8080: {isApiOnline === true ? 'Online' : isApiOnline === false ? 'Offline' : 'Conectando'}
          </span>
        </div>
        
        <button 
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
          title="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        
        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#0f766e] flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              {userInitials}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{userName}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Shield size={10} className="text-[#0f766e]" />
                {userProfile}
              </div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-800">{userName}</div>
                <div className="text-xs text-slate-500 truncate">{userEmail}</div>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-[#0f766e] rounded">
                  {userProfile}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    authService.logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sair do Sistema (Logout)
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
