'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria, Produto, Configuracoes } from '@/lib/types';
import { brl, formatPhone } from '@/lib/utils';

export default function ImprimirPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [instagram, setInstagram] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const [{ data: cats }, { data: prods }, { data: cfg }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('produtos').select('*').eq('ativo', true),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
    ]);
    setCategorias(cats || []);
    setProdutos(prods || []);
    setConfig(cfg as Configuracoes);
    setInstagram((cfg as Configuracoes)?.instagram || '');
    setLoading(false);
  }

  async function salvarInstagram(valor: string) {
    await supabase.from('configuracoes').update({ instagram: valor.replace('@', '') }).eq('id', 1);
  }

  if (loading || !config) return <p className="empty-note">Carregando...</p>;

  return (
    <div>
      <div className="card">
        <p className="helper-text">
          Gera um cardápio pronto pra imprimir (ou salvar como PDF): capa com o logo, os produtos organizados em folhas
          A4 com os títulos de categoria em destaque (com foto), e uma última página com os contatos do restaurante.
          Pra escolher a foto de cada categoria, vá na aba <b>Categorias</b>.
        </p>
        <div className="field">
          <label>Instagram (opcional, aparece na última página)</label>
          <input type="text" defaultValue={instagram} onBlur={e => salvarInstagram(e.target.value)} />
        </div>
        <button className="btn-row" style={{ marginTop: 14 }} onClick={() => window.print()}>🖨 Imprimir / Salvar como PDF</button>
        <p className="small-note" style={{ textAlign: 'left', marginTop: 10 }}>
          Ao tocar no botão, escolha &quot;Salvar como PDF&quot; na tela de impressão do seu celular pra baixar o arquivo em vez de imprimir na hora.
        </p>
      </div>

      <div id="print-area">
        <div className="print-cover">
          <img src="/logo.png" alt="Mil e Uma Noites" className="print-logo" />
          <h1>Mil e Uma Noites</h1>
          <h2>Shawarma e Lanches</h2>
        </div>
        <div style={{ padding: '10px' }}>
          {categorias.map(cat => {
            const prods = produtos.filter(p => p.categoria_id === cat.id);
            if (!prods.length) return null;
            return (
              <div className="print-cat" key={cat.id}>
                <div className="print-cat-title">
                  {cat.imagem_url && <img src={cat.imagem_url} alt="" />}
                  <h2>{cat.nome}</h2>
                </div>
                {prods.map(p => (
                  <div className="print-item" key={p.id}>
                    <div>
                      <div className="nm">{p.nome}</div>
                      {p.descricao && <div className="ds">{p.descricao}</div>}
                    </div>
                    <div className="nm">{brl(p.preco)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="print-contact">
          <img src="/logo.png" alt="Mil e Uma Noites" className="print-logo" />
          <h2>Contato</h2>
          <p>WhatsApp: {formatPhone(config.whatsapp)}</p>
          {instagram && <p>Instagram: @{instagram}</p>}
          <p style={{ marginTop: 30, fontStyle: 'italic' }}>Um lanche, mil e um motivos pra voltar.</p>
        </div>
      </div>
    </div>
  );
}
