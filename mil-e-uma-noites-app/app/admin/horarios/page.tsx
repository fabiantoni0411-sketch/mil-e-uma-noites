'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Configuracoes, Horario } from '@/lib/types';
import { DIAS_LABEL, getStatusAgora } from '@/lib/utils';

export default function HorariosPage() {
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const [{ data: cfg }, { data: hrs }] = await Promise.all([
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
      supabase.from('horarios').select('*').order('dia_semana'),
    ]);
    setConfig(cfg as Configuracoes);
    setHorarios((hrs as Horario[]) || []);
    setLoading(false);
  }

  async function mudarModo(modo: 'auto' | 'aberto' | 'fechado') {
    await supabase.from('configuracoes').update({ modo_horario: modo }).eq('id', 1);
    setConfig(prev => prev ? { ...prev, modo_horario: modo } : prev);
  }

  async function salvarPrep(campo: 'prep_semana' | 'prep_fim_semana', valor: string) {
    await supabase.from('configuracoes').update({ [campo]: valor }).eq('id', 1);
  }

  async function atualizarDia(dia: number, campo: 'ativo' | 'abre' | 'fecha', valor: boolean | string) {
    await supabase.from('horarios').update({ [campo]: valor }).eq('dia_semana', dia);
    setHorarios(prev => prev.map(h => h.dia_semana === dia ? { ...h, [campo]: valor } as Horario : h));
  }

  if (loading || !config) return <p className="empty-note">Carregando...</p>;

  const status = getStatusAgora(config, horarios);
  const now = new Date();

  return (
    <div>
      <div className="card">
        <p className="status-line">
          Status agora: <b style={{ color: status.aberto ? '#1f8a4c' : '#b23a2f' }}>{status.aberto ? 'Aberto' : 'Fechado'}</b><br />
          Modo: <b>{config.modo_horario === 'auto' ? 'Automático' : config.modo_horario === 'aberto' ? 'Forçado aberto' : 'Forçado fechado'}</b> ·
          {' '}Agora é {DIAS_LABEL[now.getDay()]}, {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (horário do seu aparelho)
          {status.hoje ? <> · Horário de hoje: <b>{status.hoje}</b></> : null}
        </p>
        <div className="mode-btns">
          <button className={config.modo_horario === 'auto' ? 'active' : ''} onClick={() => mudarModo('auto')}>Automático (segue horários)</button>
          <button className={config.modo_horario === 'aberto' ? 'active' : ''} onClick={() => mudarModo('aberto')}>Forçar aberto</button>
          <button className={config.modo_horario === 'fechado' ? 'active' : ''} onClick={() => mudarModo('fechado')}>Forçar fechado</button>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: 10 }}>Tempo de preparo exibido ao cliente</h4>
        <div className="field"><label>Domingo a quinta</label><input type="text" defaultValue={config.prep_semana} onBlur={e => salvarPrep('prep_semana', e.target.value)} /></div>
        <div className="field" style={{ marginTop: 10 }}><label>Sexta e sábado</label><input type="text" defaultValue={config.prep_fim_semana} onBlur={e => salvarPrep('prep_fim_semana', e.target.value)} /></div>
      </div>

      {horarios.map(h => (
        <div className="day-row" key={h.dia_semana}>
          <div className="top">
            <label className="chk">
              <input type="checkbox" checked={h.ativo} onChange={e => atualizarDia(h.dia_semana, 'ativo', e.target.checked)} /> {DIAS_LABEL[h.dia_semana]}
            </label>
          </div>
          <div className="times">
            <input type="time" defaultValue={h.abre} onBlur={e => atualizarDia(h.dia_semana, 'abre', e.target.value)} />
            <span>até</span>
            <input type="time" defaultValue={h.fecha} onBlur={e => atualizarDia(h.dia_semana, 'fecha', e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
