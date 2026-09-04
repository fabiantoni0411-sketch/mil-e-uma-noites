   'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Categoria,
  Produto,
  Bairro,
  Configuracoes,
  Horario,
  ItemPedido,
} from '@/lib/types';
import {
  brl,
  formatPhone,
  getStatusAgora,
  getPrepAtual,
} from '@/lib/utils';

interface CartItem {
  id: string;
  qtd: number;
}

function SkylineBackground() {
  const [stars, setStars] = useState<
    { top: string; left: string; delay: string; size: string }[]
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }).map(() => ({
        top: Math.random() * 70 + '%',
        left: Math.random() * 100 + '%',
        delay: Math.random() * 4 + 's',
        size: Math.random() < 0.15 ? '3px' : '2px',
      }))
    );
  }, []);

  return (
    <div className="page-bg">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            width: s.size,
            height: s.size,
          }}
        />
      ))}

      <svg
        className="skyline-svg"
        viewBox="0 0 1400 220"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#050915" opacity="0.9">
          <rect x="0" y="140" width="60" height="80" />
          <circle cx="30" cy="130" r="26" />

          <rect x="90" y="170" width="30" height="50" />
          <polygon points="105,140 95,170 115,170" />

          <rect x="150" y="100" width="70" height="120" />
          <circle cx="185" cy="95" r="38" />
          <rect x="170" y="40" width="10" height="55" />

          <rect x="240" y="160" width="26" height="60" />
          <polygon points="253,130 242,160 264,160" />

          <rect x="290" y="120" width="90" height="100" />
          <circle cx="335" cy="112" r="44" />
          <rect x="318" y="45" width="10" height="67" />
          <circle cx="323" cy="40" r="4" />

          <rect x="410" y="175" width="24" height="45" />
          <rect x="460" y="150" width="60" height="70" />
          <circle cx="490" cy="140" r="30" />

          <rect x="550" y="90" width="110" height="130" />
          <circle cx="605" cy="82" r="52" />
          <rect x="583" y="15" width="12" height="67" />
          <circle cx="589" cy="10" r="5" />

          <rect x="690" y="165" width="28" height="55" />
          <polygon points="704,135 692,165 716,165" />

          <rect x="740" y="130" width="80" height="90" />
          <circle cx="780" cy="122" r="40" />

          <rect x="850" y="170" width="24" height="50" />

          <rect x="900" y="105" width="95" height="115" />
          <circle cx="947" cy="98" r="46" />
          <rect x="928" y="35" width="10" height="63" />

          <rect x="1020" y="160" width="28" height="60" />
          <polygon points="1034,130 1022,160 1046,160" />

          <rect x="1080" y="115" width="85" height="105" />
          <circle cx="1122" cy="108" r="42" />
          <rect x="1102" y="45" width="10" height="63" />
          <circle cx="1107" cy="40" r="4" />

          <rect x="1200" y="170" width="26" height="50" />

          <rect x="1250" y="145" width="65" height="75" />
          <circle cx="1282" cy="136" r="32" />

          <rect x="1340" y="170" width="60" height="50" />
          <circle cx="1370" cy="160" r="26" />
        </g>
      </svg>
    </div>
  );
}

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

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);

    const [
      { data: cats },
      { data: prods },
      { data: bs },
      { data: cfg },
      { data: hrs },
    ] = await Promise.all([
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
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }

  const categoriasComProdutos = useMemo(
    () =>
      categorias.filter((c) =>
        produtos.some((p) => p.categoria_id === c.id)
      ),
    [categorias, produtos]
  );

  const temLancamentos = useMemo(
    () => produtos.some((p) => p.destacar_lancamento),
    [produtos]
  );

  const abasVisiveis = useMemo(() => {
    const lista = [...categoriasComProdutos];

    if (temLancamentos) {
      lista.unshift({
        id: '__lancamentos__',
        nome: 'Lançamentos',
        imagem_url: null,
        ordem: -1,
      });
    }

    return lista;
  }, [categoriasComProdutos, temLancamentos]);

  const produtosDaAba = useMemo(() => {
    if (activeCat === '__lancamentos__') {
      return produtos.filter((p) => p.destacar_lancamento);
    }

    return produtos.filter((p) => p.categoria_id === activeCat);
  }, [activeCat, produtos]);

  useEffect(() => {
    if (!activeCat && abasVisiveis.length) {
      setActiveCat(abasVisiveis[0].id);
    }
  }, [abasVisiveis, activeCat]);

  function qtyOf(id: string) {
    return cart.find((i) => i.id === id)?.qtd || 0;
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);

      if (!existing) {
        return delta > 0 ? [...prev, { id, qtd: 1 }] : prev;
      }

      const novaQtd = existing.qtd + delta;

      if (novaQtd <= 0) {
        return prev.filter((i) => i.id !== id);
      }

      return prev.map((i) =>
        i.id === id ? { ...i, qtd: novaQtd } : i
      );
    });
  }

  const cartCount = cart.reduce((s, i) => s + i.qtd, 0);

  const cartTotal = cart.reduce((s, i) => {
    const p = produtos.find((x) => x.id === i.id);
    return s + (p ? p.preco * i.qtd : 0);
  }, 0);

  const bairroSelecionado = bairros.find((b) => b.id === bairroId);

  const taxaEntrega =
    entrega === 'entrega' && bairroSelecionado
      ? bairroSelecionado.taxa
      : 0;

  const totalFinal = cartTotal + taxaEntrega;

  async function finalizarPedido() {
    if (!nome || !telefone) {
      showToast('Preencha nome e telefone.');
      return;
    }

    if (!pagamento) {
      showToast('Escolha a forma de pagamento.');
      return;
    }

    if (entrega === 'entrega' && !bairroId) {
      showToast('Selecione o bairro.');
      return;
    }

    if (cart.length === 0) {
      showToast('Seu carrinho está vazio.');
      return;
    }

    setEnviando(true);

    const itens: ItemPedido[] = cart.map((i) => {
      const p = produtos.find((x) => x.id === i.id)!;

      return {
        nome: p.nome,
        qtd: i.qtd,
        preco: p.preco,
      };
    });

    const { error } = await supabase.from('pedidos').insert({
      cliente_nome: nome,
      cliente_telefone: telefone,
      itens,
      tipo_entrega: entrega,
      bairro_nome:
        entrega === 'entrega'
          ? bairroSelecionado?.nome || null
          : null,
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

    const agora = new Date();

    const dataFmt = agora.toLocaleDateString('pt-BR');

    const horaFmt = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let msg =
      `🌙 *Olá! Seja bem-vindo(a) ao Mil e Uma Noites!* 🌙\n`;

    msg +=
      `Que alegria receber seu pedido, ${nome.split(' ')[0]}! Aqui está o resumo:\n\n`;

    msg += `✅ *Pedido recebido!*\n`;
    msg += `📅 ${dataFmt} às ${horaFmt}\n\n`;

    msg += `*Itens:*\n`;

    itens.forEach((i) => {
      msg += `➡️ ${i.qtd}x ${i.nome} — ${brl(
        i.preco * i.qtd
      )}\n`;
    });

    msg += `\n👤 *Cliente:* ${nome}\n`;
    msg += `📱 *Celular:* ${telefone}\n`;
    msg += `💳 *Pagamento:* ${pagamento}\n\n`;

    if (entrega === 'entrega') {
      msg += `🛵 *Delivery* (taxa: ${
        taxaEntrega > 0 ? brl(taxaEntrega) : 'grátis 🎁'
      })\n`;

      msg += `🏠 ${endereco || '(endereço)'} — ${
        bairroSelecionado?.nome || ''
      }\n`;

      if (referencia) {
        msg += `📍 Referência: ${referencia}\n`;
      }
    } else {
      msg += `🏃 *Retirada no local*\n`;
    }

    msg += `\n*Total: ${brl(totalFinal)}*\n\n`;
    msg +=
      `Muito obrigado pelo seu pedido! Se precisar de algo é só chamar 😉`;

    const url =
      `https://wa.me/${config?.whatsapp}?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');

    setCart([]);
    setCartOpen(false);
    setEnviando(false);

    showToast('Pedido enviado! Confirme no WhatsApp.');
  }

  if (loading || !config) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cream-dim)',
        }}
      >
        Carregando cardápio…
      </div>
    );
  }

  const status = getStatusAgora(config, horarios);

  return (
  <div>
    <SkylineBackground />

    <header className="hero">
 <img
  className="logo-img"
  src="/logo.png"
  alt="Mil e Uma Noites"
  style={{
    width: '220px',
    maxWidth: '55%',
    height: 'auto',
    margin: '0 auto',
    display: 'block',
  }}
/>

        <p className="kicker">Cardápio</p>

        <h1>Mil e Uma Noites</h1>

        <h2>Shawarma &amp; Lanches</h2>

        <span
          className={`status-pill ${
            status.aberto ? 'aberto' : 'fechado'
          }`}
        >
          <span className="dot"></span>

          {status.aberto
            ? 'Aberto agora'
            : 'Fechado no momento'}
        </span>

        {status.aberto && (
          <p className="prep">
            Tempo de preparo: {getPrepAtual(config)}
          </p>
        )}
      </header>

      <nav className="cats">
        {abasVisiveis.map((c) => (
          <button
            key={c.id}
            className={c.id === activeCat ? 'active' : ''}
            onClick={() => setActiveCat(c.id)}
          >
            {c.nome}
          </button>
        ))}
      </nav>

      <main className="loja-content">
        {produtosDaAba.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--cream-dim)',
              padding: '40px 10px',
            }}
          >
            Nenhum produto nesta categoria no momento.
          </p>
        )}

        {produtosDaAba.length > 0 && (
          <section className="cat-block">
            <div className="cat-title">
              <h3>
                {
                  abasVisiveis.find(
                    (a) => a.id === activeCat
                  )?.nome
                }
              </h3>
            </div>

            {produtosDaAba.map((p) => {
              const qty = qtyOf(p.id);

              return (
                <div className="prod" key={p.id}>
                  {p.imagem_url && (
                    <img
                      className="prod-thumb"
                      src={p.imagem_url}
                      alt={p.nome}
                    />
                  )}

                  <div className="prod-info">
                    <div className="prod-name">
                      {p.nome}

                      {p.tag_texto && (
                        <span className="tag">
                          {p.tag_texto}
                        </span>
                      )}
                    </div>

                    {p.descricao && (
                      <div className="prod-desc">
                        {p.descricao}
                      </div>
                    )}

                    <div className="prod-bottom">
                      <span className="prod-price">
                        {brl(p.preco)}
                      </span>

                      {qty > 0 ? (
                        <div className="qty-ctrl">
                          <button
                            onClick={() =>
                              changeQty(p.id, -1)
                            }
                          >
                            −
                          </button>

                          <span>{qty}</span>

                          <button
                            onClick={() =>
                              changeQty(p.id, 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-add"
                          onClick={() =>
                            changeQty(p.id, 1)
                          }
                        >
                          + Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      <footer className="foot-loja">
        <div
          style={{
            fontSize: 11,
            color: 'var(--gold-line)',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          ✦ Peça já o seu ✦
        </div>

        <a
          className="contact-btn whats"
          href={`https://wa.me/${config.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp: {formatPhone(config.whatsapp)}
        </a>

        <a
          className="contact-btn insta"
          href={`https://instagram.com/${config.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram @{config.instagram}
        </a>

        <a
          className="contact-btn"
          style={{
            border: '1px solid var(--gold-line)',
            color: 'var(--gold-bright)',
          }}
          href="/acompanhar"
        >
          📦 Acompanhar meu pedido
        </a>

        <p className="closing">
          Um lanche,{' '}
          <b
            style={{
              color: 'var(--gold-bright)',
              fontStyle: 'normal',
            }}
          >
            mil e um motivos
          </b>{' '}
          pra voltar.
        </p>
      </footer>

      {cartCount > 0 && (
        <button
          className="cart-fab"
          onClick={() => setCartOpen(true)}
        >
          🛒 {brl(cartTotal)}{' '}
          <span className="badge">{cartCount}</span>
        </button>
      )}

      <a className="admin-link" href="/admin">
        painel administrativo
      </a>

      {cartOpen && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <div className="sheet">
            <div className="sheet-head">
              <h3>Seu pedido</h3>

              <button
                onClick={() => setCartOpen(false)}
              >
                ✕
              </button>
            </div>

            {cart.map((i) => {
              const p = produtos.find(
                (x) => x.id === i.id
              );

              if (!p) return null;

              return (
                <div
                  className="cart-item"
                  key={i.id}
                >
                  <div className="nm">
                    {i.qtd}x {p.nome}
                  </div>

                  <div className="pr">
                    {brl(p.preco * i.qtd)}
                  </div>
                </div>
              );
            })}

            <div className="field">
              <label>Entrega</label>

              <div className="pay-opts">
                <button
                  className={
                    entrega === 'entrega' ? 'sel' : ''
                  }
                  onClick={() =>
                    setEntrega('entrega')
                  }
                >
                  Entrega
                </button>

                <button
                  className={
                    entrega === 'retirada' ? 'sel' : ''
                  }
                  onClick={() =>
                    setEntrega('retirada')
                  }
                >
                  Retirar no local
                </button>
              </div>
            </div>

            {entrega === 'entrega' && (
              <>
                <div className="field">
                  <label>Bairro</label>

                  <select
                    value={bairroId}
                    onChange={(e) =>
                      setBairroId(e.target.value)
                    }
                  >
                    <option value="">
                      Selecione...
                    </option>

                    {bairros.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                      >
                        {b.nome} — {brl(b.taxa)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Endereço</label>

                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) =>
                      setEndereco(e.target.value)
                    }
                    placeholder="Rua, número"
                  />
                </div>

                <div className="field">
                  <label>
                    Referência (opcional)
                  </label>

                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) =>
                      setReferencia(e.target.value)
                    }
                    placeholder="Ponto de referência"
                  />
                </div>
              </>
            )}

            <div className="field">
              <label>Seu nome</label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Nome"
              />
            </div>

            <div className="field">
              <label>Telefone (WhatsApp)</label>

              <input
                type="text"
                value={telefone}
                onChange={(e) =>
                  setTelefone(e.target.value)
                }
                placeholder="11999999999"
              />
            </div>

            <div className="field">
              <label>Forma de pagamento</label>

              <div className="pay-opts">
                {[
                  'Pix',
                  'Dinheiro',
                  'Cartão de Crédito',
                  'Cartão de Débito',
                ].map((m) => (
                  <button
                    key={m}
                    className={
                      pagamento === m ? 'sel' : ''
                    }
                    onClick={() =>
                      setPagamento(m)
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>

              {pagamento === 'Pix' &&
                config.pix_key && (
                  <div className="pix-box">
                    Chave Pix:{' '}
                    <b>{config.pix_key}</b>
                  </div>
                )}
            </div>

            <div className="total-row">
              <span>Total</span>
              <span>{brl(totalFinal)}</span>
            </div>

            <button
              className="btn-primary"
              disabled={enviando}
              onClick={finalizarPedido}
            >
              {enviando
                ? 'Enviando...'
                : 'Enviar pedido no WhatsApp'}
            </button>

            <p className="small-note">
              O pedido é enviado direto pelo WhatsApp
              do restaurante.
            </p>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="toast">{toastMsg}</div>
      )}
    </div>
  );
}
