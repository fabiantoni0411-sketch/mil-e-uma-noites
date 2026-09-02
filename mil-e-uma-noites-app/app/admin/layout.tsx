'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const TABS = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/bairros', label: 'Bairros/Taxas' },
  { href: '/admin/horarios', label: 'Horários' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/imprimir', label: 'Imprimir cardápio' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEntrando(false);
    if (error) setErro('E-mail ou senha incorretos.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin');
  }

  if (session === undefined) {
    return <div className="admin-body" style={{ minHeight: '100vh' }} />;
  }

  if (!session) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <div className="moon-mark" style={{ margin: '0 auto 6px' }}>
            <svg viewBox="0 0 50 50" fill="none" width="40" height="40">
              <path d="M30 6C20 8 13 17 13 27c0 12 9.5 21.5 21 21.5 6 0 11.4-2.5 15-6.5-3 1.3-6.3 2-9.8 2C26.4 44 17 34.6 17 23c0-7 3.4-13.2 8.6-17-.2 0-.4 0-.6.1z" fill="#f0d38a" />
            </svg>
          </div>
          <h2>Painel Administrativo</h2>
          <form onSubmit={handleLogin}>
            <div className="field"><label>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="field"><label>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} required /></div>
            <div className="err">{erro}</div>
            <button className="btn-gold" type="submit" disabled={entrando}>{entrando ? 'Entrando...' : 'Entrar'}</button>
          </form>
          <p className="small-note"><Link href="/">← voltar para o cardápio</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-body">
      <div className="admin-header">
        <div className="admin-header-top">
          <h1>Painel administrativo</h1>
          <div className="admin-header-btns">
            <Link className="pill-btn" href="/">Ver loja</Link>
            <button className="pill-btn dark" onClick={handleLogout}>Sair</button>
          </div>
        </div>
        <div className="tabs">
          {TABS.map(t => (
            <Link key={t.href} href={t.href} className={`tab-btn ${pathname === t.href ? 'active' : ''}`}>{t.label}</Link>
          ))}
        </div>
      </div>
      <div className="admin-main">{children}</div>
    </div>
  );
}
