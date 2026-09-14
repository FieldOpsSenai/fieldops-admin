'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, MapPin, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/api/services';
import { useSessionStore } from '@/stores/sessionStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { session } = useSessionStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setSessionExpiredNotice(true);
    }
  }, [searchParams]);

  // If already authenticated, redirect away from login
  useEffect(() => {
    if (session) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.replace(redirectTo);
    }
  }, [session, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, informe o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.login({
        email: email.trim(),
        senha: password,
      });

      // Honor redirect param or go to dashboard
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else if (!err.response) {
        setErrorMessage('Não foi possível conectar ao servidor Java (porta 8080). Certifique-se de que a API está em execução.');
      } else {
        setErrorMessage('Ocorreu um erro ao realizar login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-[#10b981] p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
          <MapPin size={32} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-3xl font-black tracking-tight text-white">FieldOps</span>
          <span className="text-xs text-emerald-400 font-bold block uppercase tracking-widest">Enterprise Platform</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 relative z-10">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Acesso ao Sistema</h1>
          <p className="text-slate-500 text-xs mt-1">Conecte-se com suas credenciais da API FieldOps.</p>
        </div>

        {/* Expired Session Alert */}
        {sessionExpiredNotice && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Sua sessão expirou ou o token foi invalidado. Faça login novamente.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">E-mail Corporativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ex: admin@fieldops.com"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Senha</label>
              <a href="#" className="text-xs font-semibold text-[#0f766e] hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-[#10b981] focus:ring-[#10b981]" 
              />
              <span>Manter conectado neste dispositivo</span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-[#0f766e] hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10b981] transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>ACESSAR PLATAFORMA</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </form>

        {/* Quick Fill Credentials Demo */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <KeyRound size={14} />
            <span>Conta de Demonstração do Administrador (API Java):</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@fieldops.com', '123456')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-colors text-xs"
            >
              <div className="font-bold text-slate-800">Administrador</div>
              <div className="text-[11px] text-slate-500 truncate">admin@fieldops.com</div>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        FieldOps Enterprise Inspection Suite • Spring Boot REST & Next.js
      </div>

    </div>
  );
}
