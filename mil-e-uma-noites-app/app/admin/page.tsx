'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pedido } from '@/lib/types';
import { brl } from '@/lib/utils';

export default function PainelPage() {
  const [loading, setLoading] = useState(true);
  const [pedidosMes, setPedidosMes] = useState<Pedido[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState(0);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ data: pedidos }, { count }] = await Promise.all([
      supabase.from('pedidos').select('*').gte('criado_em', inicioMes),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
    ]);
    setPedidosMes((pedidos as Pedido[]) || []);
    setProdutosAtivos(count || 0);
    setLoading(false);
  }

  if (loading) return <p className="empty-note">Carregando...</p>;

  const faturamento = pedidosMes.reduce((s, p) => s + p.total, 0);
  const contagem: Record<string, number> = {};
  pedidosMes.forEach(p => p.itens.forEach(i => { contagem[i.nome] = (contagem[i.nome] || 0) + i.qtd; }));
  const maisVendidos = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="card"><h4>Pedidos no mês</h4><div className="big">{pedidosMes.length}</div></div>
        <div className="card"><h4>Faturamento no mês</h4><div className="big">{brl(faturamento)}</div></div>
        <div className="card"><h4>Produtos ativos</h4><div className="big">{produtosAtivos}</div></div>
      </div>
      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, marginBottom: 10 }}>Mais vendidos no mês</h3>
      {maisVendidos.length ? (
        <div className="card">
          {maisVendidos.map(([nm, qtd]) => (
            <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span>{nm}</span><b>{qtd}x</b>
            </div>
          ))}
        </div>
      ) : <p className="empty-note">Ainda não há vendas registradas este mês.</p>}
    </div>
  );
}
