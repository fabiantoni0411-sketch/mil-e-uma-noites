'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Pedido } from '@/lib/types';
import { brl } from '@/lib/utils';

const STATUS_COR: Record<string, string> = {
  'Pendente': '#e3b23a',
  'Preparando': '#5b86c9',
  'Saiu para entrega': '#cd9f4f',
  'Entregue': '#1f8a4c',
};

export default function AcompanharPage() {
  const [telefone, setTelefone] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');

  async function buscar() {
    const limpo = telefone.replace(/\D/g, '');
    if (!limpo) { setErro('Digite seu telefone.'); return; }
    setErro('');
    setBuscando(true);
    const { data, error } = await supabase.rpc('buscar_pedidos_por_telefone', { telefone_busca: limpo });
    setBuscando(false);
    if (error) { setErro('Não foi possível buscar agora. Tente novamente.'); return; }
    setPedidos((data as Pedido[]) || []);
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: 560, margin: '0 auto', padding: '30px 20px 60px' }}>
      <p style={{ marginBottom: 16 }}><Link href="/" style={{ color: 'var(--gold-bright)' }}>← voltar ao cardápio</Link></p>
      <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 26, color: 'var(--gold-bright)', marginBottom: 6 }}>Acompanhar meu pedido</h1>
      <p style={{ color: 'var(--cream-dim)', fontSize: 14, marginBottom: 20 }}>Digite o telefone que você usou no pedido para ver o status.</p>

      <div className="field" style={{ marginTop: 0 }}>
        <label>Telefone (WhatsApp)</label>
        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="11999999999"
          onKeyDown={e => { if (e.key === 'Enter') buscar(); }} />
      </div>
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={buscar} disabled={buscando}>
        {buscando ? 'Buscando...' : 'Buscar meus pedidos'}
      </button>
      {erro && <p style={{ color: '#e39a92', fontSize: 13, marginTop: 10 }}>{erro}</p>}

      {pedidos !== null && (
        <div style={{ marginTop: 28 }}>
          {pedidos.length === 0 && <p style={{ color: 'var(--cream-dim)', textAlign: 'center' }}>Nenhum pedido encontrado com esse telefone.</p>}
          {pedidos.map(p => (
            <div key={p.id} style={{
              background: 'var(--navy-card)', border: '1px solid rgba(205,159,79,.3)', borderRadius: 14,
              padding: 16, marginBottom: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                  background: (STATUS_COR[p.status] || '#888') + '22', color: STATUS_COR[p.status] || '#ccc'
                }}>{p.status}</span>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{new Date(p.criado_em).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ fontSize: 14, marginBottom: 6 }}>
                {p.itens.map(i => `${i.qtd}x ${i.nome}`).join(', ')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 8 }}>
                {p.tipo_entrega === 'entrega' ? `Entrega — ${p.bairro_nome || ''}` : 'Retirada no local'} · {p.for
