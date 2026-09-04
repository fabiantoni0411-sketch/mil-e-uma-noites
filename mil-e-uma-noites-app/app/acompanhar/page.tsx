'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Pedido } from '@/lib/types';
import { brl } from '@/lib/utils';

const ETAPAS = ['Aguardando aprovação', 'Preparando', 'Saiu para entrega', 'Entregue'];

function normalizarStatus(status: string) {
  return status === 'Pendente' ? 'Aguardando aprovação' : status;
}

function FluxoPedido({ status }: { status: string }) {
  const atual = normalizarStatus(status);
  const indiceAtual = ETAPAS.indexOf(atual);
  const labels: Record<string, string> = {
    'Aguardando aprovação': 'Aguardando aprovação da loja',
    'Preparando': 'Pedido em preparo',
    'Saiu para entrega': 'Saiu para entrega',
    'Entregue': 'Entregue',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4, marginBottom: 4 }}>
      {ETAPAS.map((etapa, i) => {
        const feito = i <= indiceAtual;
        return (
          <div key={etapa} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flex: 'none',
                background: feito ? '#1f8a4c' : 'rgba(205,159,79,.2)',
                border: feito ? '2px solid #1f8a4c' : '2px solid var(--gold-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff'
              }}>{feito ? '✓' : ''}</div>
              {i < ETAPAS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 22, background: i < indiceAtual ? '#1f8a4c' : 'rgba(205,159,79,.25)' }} />}
            </div>
            <div style={{ paddingBottom: 20, fontSize: 13.5, color: feito ? 'var(--cream)' : 'var(--cream-dim)', fontWeight: feito ? 600 : 400 }}>
              {labels[etapa]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{new Date(p.criado_em).toLocaleString('pt-BR')}</span>
              </div>
              <FluxoPedido status={p.status} />
              <div style={{ fontSize: 14, marginBottom: 6, marginTop: 8 }}>
                {p.itens.map(i => `${i.qtd}x ${i.nome}`).join(', ')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 8 }}>
                {p.tipo_entrega === 'entrega' ? `Entrega — ${p.bairro_nome || ''}` : 'Retirada no local'} · {p.forma_pagamento}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--gold-bright)' }}>{brl(p.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
