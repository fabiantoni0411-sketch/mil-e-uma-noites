'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bairro, Configuracoes } from '@/lib/types';

export default function BairrosPage() {
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const [{ data: cfg }, { data: bs }] = await Promise.all([
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
      supabase.from('bairros').select('*').order('ordem'),
    ]);
    setConfig(cfg as Configuracoes);
    setBairros(bs || []);
    setLoading(false);
  }

  async function salvarConfigCampo(campo: keyof Configuracoes, valor: string) {
    await supabase.from('configuracoes').update({ [campo]: valor }).eq('id', 1);
  }

  async function atualizarBairro(id: string, campo: 'nome' | 'taxa', valor: string) {
    const payload = campo === 'taxa' ? { taxa: parseFloat(valor) || 0 } : { nome: valor };
    await supabase.from('bairros').update(payload).eq('id', id);
    setBairros(prev => prev.map(b => b.id === id ? { ...b, ...(campo === 'taxa' ? { taxa: parseFloat(valor) || 0 } : { nome: valor }) } : b));
  }

  async function excluirBairro(id: string) {
    await supabase.from('bairros').delete().eq('id', id);
    setBairros(prev => prev.filter(b => b.id !== id));
  }

  async function adicionarBairro() {
    const ordem = bairros.length ? Math.max(...bairros.map(b => b.ordem)) + 1 : 0;
    const { data } = await supabase.from('bairros').insert({ nome: 'Novo bairro', taxa: 5, ordem }).select().single();
    if (data) setBairros(prev => [...prev, data as Bairro]);
  }

  if (loading || !config) return <p className="empty-note">Carregando...</p>;

  return (
    <div>
      <div className="card">
        <h4>Chave Pix exibida ao cliente</h4>
        <input type="text" defaultValue={config.pix_key} placeholder="chave pix"
          onBlur={e => salvarConfigCampo('pix_key', e.target.value)}
          style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #d9cba3', fontSize: 14, marginTop: 6 }} />
      </div>
      <div className="card">
        <h4>WhatsApp para receber pedidos</h4>
        <input type="text" defaultValue={config.whatsapp} placeholder="5511999999999"
          onBlur={e => salvarConfigCampo('whatsapp', e.target.value.replace(/\D/g, ''))}
          style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #d9cba3', fontSize: 14, marginTop: 6 }} />
      </div>
      <div className="card">
        <h4>Instagram (sem @)</h4>
        <input type="text" defaultValue={config.instagram}
          onBlur={e => salvarConfigCampo('instagram', e.target.value.replace('@', ''))}
          style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #d9cba3', fontSize: 14, marginTop: 6 }} />
      </div>

      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, margin: '18px 0 10px' }}>Bairros e taxas de entrega</h3>
      {bairros.map(b => (
        <div className="bairro-row" key={b.id}>
          <input type="text" defaultValue={b.nome} onBlur={e => atualizarBairro(b.id, 'nome', e.target.value)} />
          <input type="number" step="0.5" defaultValue={b.taxa} onBlur={e => atualizarBairro(b.id, 'taxa', e.target.value)} />
          <button className="icon-btn danger" onClick={() => excluirBairro(b.id)}>🗑</button>
        </div>
      ))}
      <button className="btn-row" onClick={adicionarBairro}>+ Adicionar bairro</button>
    </div>
  );
}
