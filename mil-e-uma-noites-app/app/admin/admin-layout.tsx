'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { tocarSomNotificacao, tocarCampainha } from '@/lib/utils';
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

  const [avisoNovoPedido, setAvisoNovoPedido] = useState(false);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const [somAtivado, setSomAtivado] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const campainhaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tituloOriginal = 'Painel administrativo — Mil e Uma Noites';

  function ativarAlertas() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      audioCtxRef.current.resume();
      tocarSomNotificacao(audioCtxRef.current);
    } catch (e) { /* ignora */ }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setSomAtivado(true);
  }

  async function contarPendentes() {
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Aguardando aprovação', 'Pendente']);
    setPedidosPendentes(count || 0);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  // checa pedidos pendentes a cada 4 segundos (garante que o alarme continua mesmo sem realtime)
  useEffect(() => {
    if (!session) return;
    contarPendentes();
    const intervalo = setInterval(contarPendentes, 4000);
    return () => clearInterval(intervalo);
  }, [session]);

  // toca a campainha em repetição enquanto houver pedido aguardando aprovação
  useEffect(() => {
    if (pedidosPendentes > 0 && somAtivado) {
      setAvisoNovoPedido(true);
      if (!campainhaIntervalRef.current) {
        tocarCampainha(audioCtxRef.current);
        campainhaIntervalRef.current = setInterval(() => tocarCampainha(audioCtxRef.current), 3000);
      }
    } else {
      setAvisoNovoPedido(false);
      if (campainhaIntervalRef.current) {
        clearInterval(campainhaIntervalRef.current);
        campainhaIntervalRef.current = null;
      }
    }
  }, [pedidosPendentes, somAtivado]);

  useEffect(() => {
    if (!session) return;
    const canal = supabase
      .channel('pedidos-novos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => {
        contarPendentes();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 Novo pedido recebido!', { body: 'Mil e Uma Noites — abra o painel de Pedidos.' });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
        contarPendentes();
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [session]);

  useEffect(() => {
    if (!avisoNovoPedido) { document.title = tituloOriginal; return; }
    let visivel = true;
    const intervalo = setInterval(() => {
      document.title = visivel ? '🔔 Novo pedido!' : tituloOriginal;
      visivel = !visivel;
    }, 1000);
    return () => { clearInterval(intervalo); document.title = tituloOriginal; };
  }, [avisoNovoPedido]);

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
      {avisoNovoPedido && (
        <Link href="/admin/pedidos" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: '#b23a2f', color: '#fff', textAlign: 'center', padding: '12px', fontWeight: 700, fontSize: 14,
          display: 'block', textDecoration: 'none'
        }}>
          🔔 {pedidosPendentes} pedido(s) aguardando aprovação — toque aqui para ver e aceitar
        </Link>
      )}
      <div className="admin-header">
        <div className="admin-header-top">
          <h1>Painel administrativo</h1>
          <div className="admin-header-btns">
            {!somAtivado && (
              <button className="pill-btn" style={{ background: '#e3b23a', color: '#241c08', borderColor: '#e3b23a' }} onClick={ativarAlertas}>
                🔔 Ativar alertas
              </button>
            )}
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
