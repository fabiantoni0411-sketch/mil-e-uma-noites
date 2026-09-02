'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria, Produto, Bairro, Configuracoes, Horario, ItemPedido } from '@/lib/types';
import { brl, formatPhone, getStatusAgora, getPrepAtual } from '@/lib/utils';

interface CartItem { id: string; qtd: number; }

export default function LojaPage() {
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // checkout state
  const [entrega, setEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [bairroId, setBairroId] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const [{ data: cats }, { data: prods }, { data: bs }, { data: cfg }, { data: hrs }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('produtos').select('*').eq('ativo', true),
      supabase.from('bairros').select('*').order('ordem'),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
      supabase.from('horarios').select('*'),
    ]);
    setCategorias(cats || []);
    setProdutos(prods || []);
    setBairros(bs || []);
    setConfig(cfg as Configuracoes);
    setHorarios((hrs as Horario[]) || []);
    if (cats && cats.length) setActiveCat(cats[0].id);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }

  const categoriasComProdutos = useMemo(
    () => categorias.filter(c => produtos.some(p => p.categoria_id === c.id)),
    [categorias, produtos]
  );

  function qtyOf(id: string) { return cart.find(i => i.id === id)?.qtd || 0; }
  function changeQty(id: string, delta: number) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return delta > 0 ? [...prev, { id, qtd: 1 }] : prev;
      const novaQtd = existing.qtd + delta;
      if (novaQtd <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qtd: novaQtd } : i);
    });
  }

  const cartCount = cart.reduce((s, i) => s + i.qtd, 0);
  const cartTotal = cart.reduce((s, i) => {
    const p = produtos.find(x => x.id === i.id);
    return s + (p ? p.preco * i.qtd : 0);
  }, 0);

  const bairroSelecionado = bairros.find(b => b.id === bairroId);
  const taxaEntrega = entrega === 'entrega' && bairroSelecionado ? bairroSelecionado.taxa : 0;
  const totalFinal = cartTotal + taxaEntrega;

  async function finalizarPedido() {
    if (!nome || !telefone) { showToast('Preencha nome e telefone.'); return; }
    if (!pagamento) { showToast('Escolha a forma de pagamento.'); return; }
    if (entrega === 'entrega' && !bairroId) { showToast('Selecione o bairro.'); return; }
    if (cart.length === 0) { showToast('Seu carrinho está vazio.'); return; }

    setEnviando(true);
    const itens: ItemPedido[] = cart.map(i => {
      const p = produtos.find(x => x.id === i.id)!;
      return { nome: p.nome, qtd: i.qtd, preco: p.preco };
    });

    const { error } = await supabase.from('pedidos').insert({
      cliente_nome: nome,
      cliente_telefone: telefone,
      itens,
      tipo_entrega: entrega,
      bairro_nome: entrega === 'entrega' ? (bairroSelecionado?.nome || null) : null,
      taxa_entrega: taxaEntrega,
      endereco: entrega === 'entrega' ? endereco : null,
      referencia: entrega === 'entrega' ? referencia : null,
      forma_pagamento: pagamento,
      total: totalFinal,
      pago: false,
      status: 'Pendente',
    });

    if (error) {
      showToast('Erro ao enviar pedido. Tente novamente.');
      setEnviando(false);
      return;
    }

    let msg = `Olá! Meu nome é ${nome}.\n\n*Pedido:*\n`;
    itens.forEach(i => { msg += `${i.qtd}x ${i.nome} — ${brl(i.preco * i.qtd)}\n`; });
    if (entrega === 'entrega') {
      msg += `\n*Entrega:* ${endereco || '(endereço)'} — ${bairroSelecionado?.nome || ''}`;
      if (referencia) msg += `\nRef: ${referencia}`;
      msg += `\nTaxa de entrega: ${brl(taxaEntrega)}`;
    } else {
      msg += `\n*Retirada no local*`;
    }
    msg += `\n*Pagamento:* ${pagamento}`;
    msg += `\n\n*Total: ${brl(totalFinal)}*`;
    msg += `\n\nTelefone p/ contato: ${telefone}`;

    const url = `https://wa.me/${config?.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    setCart([]);
    setCartOpen(false);
    setEnviando(false);
    showToast('Pedido enviado! Confirme no WhatsApp.');
  }

  if (loading || !config) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream-dim)' }}>Carregando cardápio…</div>;
  }

  const status = getStatusAgora(config, horarios);

  return (
    <div>
      <header className="hero">
        <div className="moon-mark">
          <svg viewBox="0 0 50 50" fill="none" width="100%" height="100%">
            <path d="M30 6C20 8 13 17 13 27c0 12 9.5 21.5 21 21.5 6 0 11.4-2.5 15-6.5-3 1.3-6.3 2-9.8 2C26.4 44 17 34.6 17 23c0-7 3.4-13.2 8.6-17-.2 0-.4 0-.6.1z" fill="#f0d38a" />
            <circle cx="37" cy="10" r="1.6" fill="#f0d38a" /><circle cx="42" cy="16" r="1" fill="#f0d38a" />
          </svg>
        </div>
        <p className="kicker">Cardápio</p>
        <h1>Mil e Uma Noites</h1>
        <h2>Shawarma &amp; Lanches</h2>
        <span className={`status-pill ${status.aberto ? 'aberto' : 'fechado'}`}>
          <span className="dot"></span>{status.aberto ? 'Aberto agora' : 'Fechado no momento'}
        </span>
        {status.aberto && <p className="prep">Tempo de preparo: {getPrepAtual(config)}</p>}
      </header>

      <nav className="cats">
        {categoriasComProdutos.map(c => (
          <button key={c.id} className={c.id === activeCat ? 'active' : ''} onClick={() => {
            setActiveCat(c.id);
            document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>{c.nome}</button>
        ))}
      </nav>

      <main className="loja-content">
        {categoriasComProdutos.map(cat => {
          const prods = produtos.filter(p => p.categoria_id === cat.id);
          return (
            <section key={cat.id} className="cat-block" id={`cat-${cat.id}`}>
              <div className="cat-title"><h3>{cat.nome}</h3></div>
              {prods.map(p => {
                const qty = qtyOf(p.id);
                return (
                  <div className="prod" key={p.id}>
                    {p.imagem_url && <img className="prod-thumb" src={p.imagem_url} alt={p.nome} />}
                    <div className="prod-info">
                      <div className="prod-name">{p.nome} {p.tag_texto && <span className="tag">{p.tag_texto}</span>}</div>
                      {p.descricao && <div className="prod-desc">{p.descricao}</div>}
                      <div className="prod-bottom">
                        <span className="prod-price">{brl(p.preco)}</span>
                        {qty > 0 ? (
                          <div className="qty-ctrl">
                            <button onClick={() => changeQty(p.id, -1)}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => changeQty(p.id, 1)}>+</button>
                          </div>
                        ) : (
                          <button className="btn-add" onClick={() => changeQty(p.id, 1)}>+ Adicionar</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>

      <footer className="foot-loja">
        <div style={{ fontSize: 11, color: 'var(--gold-line)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>✦ Peça já o seu ✦</div>
        <a className="contact-btn whats" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp: {formatPhone(config.whatsapp)}</a>
        <a className="contact-btn insta" href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer">Instagram @{config.instagram}</a>
        <p className="closing">Um lanche, <b style={{ color: 'var(--gold-bright)', fontStyle: 'normal' }}>mil e um motivos</b> pra voltar.</p>
      </footer>

      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          🛒 {brl(cartTotal)} <span className="badge">{cartCount}</span>
        </button>
      )}

      <a className="admin-link" href="/admin">painel administrativo</a>

      {cartOpen && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
          <div className="sheet">
            <div className="sheet-head"><h3>Seu pedido</h3><button onClick={() => setCartOpen(false)}>✕</button></div>

            {cart.map(i => {
              const p = produtos.find(x => x.id === i.id);
              if (!p) return null;
              return (
                <div className="cart-item" key={i.id}>
                  <div className="nm">{i.qtd}x {p.nome}</div>
                  <div className="pr">{brl(p.preco * i.qtd)}</div>
                </div>
              );
            })}

            <div className="field">
              <label>Entrega</label>
              <div className="pay-opts">
                <button className={entrega === 'entrega' ? 'sel' : ''} onClick={() => setEntrega('entrega')}>Entrega</button>
                <button className={entrega === 'retirada' ? 'sel' : ''} onClick={() => setEntrega('retirada')}>Retirar no local</button>
              </div>
            </div>

            {entrega === 'entrega' && (
              <>
                <div className="field">
                  <label>Bairro</label>
                  <select value={bairroId} onChange={e => setBairroId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {bairros.map(b => <option key={b.id} value={b.id}>{b.nome} — {brl(b.taxa)}</option>)}
                  </select>
                </div>
                <div className="field"><label>Endereço</label><input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número" /></div>
                <div className="field"><label>Referência (opcional)</label><input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ponto de referência" /></div>
              </>
            )}

            <div className="field"><label>Seu nome</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" /></div>
            <div className="field"><label>Telefone (WhatsApp)</label><input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="11999999999" /></div>

            <div className="field">
              <label>Forma de pagamento</label>
              <div className="pay-opts">
                {['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'].map(m => (
                  <button key={m} className={pagamento === m ? 'sel' : ''} onClick={() => setPagamento(m)}>{m}</button>
                ))}
              </div>
              {pagamento === 'Pix' && config.pix_key && <div className="pix-box">Chave Pix: <b>{config.pix_key}</b></div>}
            </div>

            <div className="total-row"><span>Total</span><span>{brl(totalFinal)}</span></div>
            <button className="btn-primary" disabled={enviando} onClick={finalizarPedido}>
              {enviando ? 'Enviando...' : 'Enviar pedido no WhatsApp'}
            </button>
            <p className="small-note">O pedido é enviado direto pelo WhatsApp do restaurante.</p>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
