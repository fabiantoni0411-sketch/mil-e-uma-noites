'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pedido } from '@/lib/types';
import { brl } from '@/lib/utils';

const STATUS_OPCOES = ['Pendente', 'Preparando', 'Saiu para entrega', 'Entregue'];

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .gte('criado_em', limite.toISOString())
      .order('criado_em', { ascending: false });
    setPedidos((data as Pedido[]) || []);
    setLoading(false);
  }

  async function togglePago(p: Pedido) {
    await supabase.from('pedidos').update({ pago: !p.pago }).eq('id', p.id);
    setPedidos(prev => prev.map(x => x.id === p.id ? { ...x, pago: !x.pago } : x));
  }

  async function mudarStatus(p: Pedido, status: string) {
    await supabase.from('pedidos').update({ status }).eq('id', p.id);
    setPedidos(prev => prev.map(x => x.id === p.id ? { ...x, status } : x));
  }

  async function excluir(p: Pedido) {
    if (!confirm('Excluir este pedido?')) return;
    await supabase.from('pedidos').delete().eq('id', p.id);
    setPedidos(prev => prev.filter(x => x.id !== p.id));
  }

  if (loading) return <p className="empty-note">Carregando...</p>;

  return (
    <div>
      <p className="helper-text">Mostrando pedidos dos últimos 30 dias. Pedidos mais antigos continuam contando nos <b>Relatórios</b>, mas saem desta lista detalhada.</p>
      {!pedidos.length && <p className="empty-note">Nenhum pedido recebido nos últimos 30 dias.</p>}
      {pedidos.map(p => {
        const itensTxt = p.itens.map(i => `${i.qtd}x ${i.nome}`).join(', ');
        const entregaTxt = p.tipo_entrega === 'entrega'
          ? `Entrega: ${p.endereco || ''} — ${p.bairro_nome || ''}${p.referencia ? ` · Ref: ${p.referencia}` : ''} · Taxa ${brl(p.taxa_entrega)}`
          : 'Retirada no local';
        const dataFmt = new Date(p.criado_em).toLocaleString('pt-BR');
        return (
          <div className="order-card" key={p.id}>
            <div className="title">{p.cliente_nome} · {p.cliente_telefone}</div>
            <div className="date">{dataFmt}</div>
            <div className="items">{itensTxt}</div>
            <div className="delivery">{entregaTxt} · {p.forma_pagamento}</div>
            <div className="price">{brl(p.total)}</div>
            <label className="chk"><input type="checkbox" checked={p.pago} onChange={() => togglePago(p)} /> Pago</label>
            <div className="row2">
              <select value={p.status} onChange={e => mudarStatus(p, e.target.value)}>
                {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn-outline danger" onClick={() => excluir(p)}>Excluir</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
