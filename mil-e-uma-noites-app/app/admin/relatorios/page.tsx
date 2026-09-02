'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pedido } from '@/lib/types';
import { brl } from '@/lib/utils';

type Periodo = 'dia' | 'semana' | 'mes';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function semanaAtualISO() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dias = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const semana = Math.ceil((dias + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(semana).padStart(2, '0')}`;
}
function mesAtualISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Converte "YYYY-Www" para o intervalo [segunda, domingo seguinte]
function rangeDaSemana(valor: string): [Date, Date] {
  const [anoStr, semStr] = valor.split('-W');
  const ano = parseInt(anoStr, 10);
  const semana = parseInt(semStr, 10);
  const jan4 = new Date(ano, 0, 4);
  const diaSemanaJan4 = (jan4.getDay() + 6) % 7; // segunda=0
  const segundaSemana1 = new Date(jan4);
  segundaSemana1.setDate(jan4.getDate() - diaSemanaJan4);
  const inicio = new Date(segundaSemana1);
  inicio.setDate(segundaSemana1.getDate() + (semana - 1) * 7);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 7);
  return [inicio, fim];
}
function rangeDoMes(valor: string): [Date, Date] {
  const [ano, mes] = valor.split('-').map(Number);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);
  return [inicio, fim];
}
function rangeDoDia(valor: string): [Date, Date] {
  const inicio = new Date(valor + 'T00:00:00');
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);
  return [inicio, fim];
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [valorDia, setValorDia] = useState(hojeISO());
  const [valorSemana, setValorSemana] = useState(semanaAtualISO());
  const [valorMes, setValorMes] = useState(mesAtualISO());
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { buscar(); }, [periodo, valorDia, valorSemana, valorMes]);

  async function buscar() {
    setLoading(true);
    let inicio: Date, fim: Date;
    if (periodo === 'dia') [inicio, fim] = rangeDoDia(valorDia);
    else if (periodo === 'semana') [inicio, fim] = rangeDaSemana(valorSemana);
    else [inicio, fim] = rangeDoMes(valorMes);

    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .gte('criado_em', inicio.toISOString())
      .lt('criado_em', fim.toISOString());
    setPedidos((data as Pedido[]) || []);
    setLoading(false);
  }

  const faturamento = pedidos.reduce((s, p) => s + p.total, 0);
  const ticketMedio = pedidos.length ? faturamento / pedidos.length : 0;
  const pagos = pedidos.filter(p => p.pago).length;

  const contagemProdutos: Record<string, { qtd: number; total: number }> = {};
  pedidos.forEach(p => p.itens.forEach(i => {
    if (!contagemProdutos[i.nome]) contagemProdutos[i.nome] = { qtd: 0, total: 0 };
    contagemProdutos[i.nome].qtd += i.qtd;
    contagemProdutos[i.nome].total += i.qtd * i.preco;
  }));
  const rankingProdutos = Object.entries(contagemProdutos).sort((a, b) => b[1].qtd - a[1].qtd);

  const contagemPagamento: Record<string, number> = {};
  pedidos.forEach(p => { contagemPagamento[p.forma_pagamento] = (contagemPagamento[p.forma_pagamento] || 0) + 1; });

  return (
    <div>
      <div className="period-tabs">
        <button className={periodo === 'dia' ? 'active' : ''} onClick={() => setPeriodo('dia')}>Por dia</button>
        <button className={periodo === 'semana' ? 'active' : ''} onClick={() => setPeriodo('semana')}>Por semana</button>
        <button className={periodo === 'mes' ? 'active' : ''} onClick={() => setPeriodo('mes')}>Por mês</button>
      </div>

      <div className="card">
        {periodo === 'dia' && (
          <div className="field" style={{ marginTop: 0 }}>
            <label>Escolha o dia</label>
            <input type="date" value={valorDia} onChange={e => setValorDia(e.target.value)} />
          </div>
        )}
        {periodo === 'semana' && (
          <div className="field" style={{ marginTop: 0 }}>
            <label>Escolha a semana</label>
            <input type="week" value={valorSemana} onChange={e => setValorSemana(e.target.value)} />
          </div>
        )}
        {periodo === 'mes' && (
          <div className="field" style={{ marginTop: 0 }}>
            <label>Escolha o mês</label>
            <input type="month" value={valorMes} onChange={e => setValorMes(e.target.value)} />
          </div>
        )}
      </div>

      {loading ? <p className="empty-note">Carregando...</p> : (
        <>
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <div className="card"><h4>Pedidos no período</h4><div className="big">{pedidos.length}</div></div>
            <div className="card"><h4>Faturamento</h4><div className="big">{brl(faturamento)}</div></div>
            <div className="card"><h4>Ticket médio</h4><div className="big">{brl(ticketMedio)}</div></div>
            <div className="card"><h4>Pedidos pagos</h4><div className="big">{pagos} / {pedidos.length}</div></div>
          </div>

          <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, margin: '18px 0 10px' }}>Produtos vendidos no período</h3>
          {rankingProdutos.length ? (
            <div className="card">
              {rankingProdutos.map(([nm, info]) => (
                <div className="report-row" key={nm}>
                  <span>{nm}</span>
                  <span><b>{info.qtd}x</b> — {brl(info.total)}</span>
                </div>
              ))}
            </div>
          ) : <p className="empty-note">Sem vendas neste período.</p>}

          {Object.keys(contagemPagamento).length > 0 && (
            <>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, margin: '18px 0 10px' }}>Formas de pagamento</h3>
              <div className="card">
                {Object.entries(contagemPagamento).map(([forma, qtd]) => (
                  <div className="report-row" key={forma}><span>{forma}</span><span><b>{qtd}</b> pedido(s)</span></div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
