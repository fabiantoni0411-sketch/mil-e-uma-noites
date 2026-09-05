'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Categoria, Produto, Configuracoes } from '@/lib/types';
import { brl, formatPhone } from '@/lib/utils';

export default function LojaPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<Record<number, number>>({});
  const [observacoes, setObservacoes] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [referencia, setReferencia] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [troco, setTroco] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const [{ data: cats }, { data: prods }, { data: cfg }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('produtos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
    ]);

    setCategorias(cats || []);
    setProdutos(prods || []);
    setConfig(cfg as Configuracoes);

    if (cats && cats.length > 0) {
      setCategoriaAtiva(cats[0].id);
    }
  }

  const produtosCarrinho = useMemo(() => {
    return produtos.filter(p => carrinho[p.id] > 0);
  }, [produtos, carrinho]);

  const total = useMemo(() => {
    return produtosCarrinho.reduce((soma, produto) => {
      return soma + produto.preco * (carrinho[produto.id] || 0);
    }, 0);
  }, [produtosCarrinho, carrinho]);

  function adicionarProduto(id: number) {
    setCarrinho(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  }

  function removerProduto(id: number) {
    setCarrinho(prev => {
      const novo = { ...prev };

      if ((novo[id] || 0) <= 1) {
        delete novo[id];
      } else {
        novo[id]--;
      }

      return novo;
    });
  }

  function quantidadeProduto(id: number) {
    return carrinho[id] || 0;
  }

  async function finalizarPedido() {
    if (!config) return;

    if (!nome.trim()) {
      alert('Digite seu nome.');
      return;
    }

    if (!telefone.trim()) {
      alert('Digite seu telefone.');
      return;
    }

    if (!endereco.trim()) {
      alert('Digite seu endereço.');
      return;
    }

    if (!numero.trim()) {
      alert('Digite o número do endereço.');
      return;
    }

    if (!bairro.trim()) {
      alert('Digite seu bairro.');
      return;
    }

    if (!formaPagamento) {
      alert('Escolha a forma de pagamento.');
      return;
    }

    if (produtosCarrinho.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    setEnviando(true);

    try {
      const itens = produtosCarrinho.map(produto => ({
        produto_id: produto.id,
        nome: produto.nome,
        quantidade: carrinho[produto.id],
        preco: produto.preco,
      }));

      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          nome_cliente: nome,
          telefone,
          endereco,
          numero,
          bairro,
          referencia,
          itens,
          observacoes,
          forma_pagamento: formaPagamento,
          troco: formaPagamento === 'Dinheiro' ? troco : null,
          total,
          status: 'novo',
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert('Não foi possível enviar o pedido. Tente novamente.');
        return;
      }

      const numeroPedido = data?.id || '';

      let mensagem = `Olá! Gostaria de fazer um pedido no Mil e Uma Noites.%0A%0A`;
      mensagem += `*Pedido:* #${numeroPedido}%0A`;
      mensagem += `*Nome:* ${nome}%0A`;
      mensagem += `*Telefone:* ${telefone}%0A%0A`;

      mensagem += `*Itens:*%0A`;

      produtosCarrinho.forEach(produto => {
        mensagem += `• ${carrinho[produto.id]}x ${produto.nome} - ${brl(
          produto.preco * carrinho[produto.id]
        )}%0A`;
      });

      mensagem += `%0A*Total:* ${brl(total)}%0A`;
      mensagem += `*Endereço:* ${endereco}, ${numero}%0A`;
      mensagem += `*Bairro:* ${bairro}%0A`;

      if (referencia.trim()) {
        mensagem += `*Referência:* ${referencia}%0A`;
      }

      mensagem += `*Pagamento:* ${formaPagamento}%0A`;

      if (formaPagamento === 'Dinheiro' && troco.trim()) {
        mensagem += `*Troco para:* ${troco}%0A`;
      }

      if (observacoes.trim()) {
        mensagem += `*Observações:* ${observacoes}%0A`;
      }

      setPedidoConfirmado(true);
      setCarrinho({});
      setObservacoes('');
      setNome('');
      setTelefone('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setReferencia('');
      setFormaPagamento('');
      setTroco('');

      window.open(
        `https://wa.me/${config.whatsapp}?text=${mensagem}`,
        '_blank'
      );
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao enviar o pedido.');
    } finally {
      setEnviando(false);
    }
  }

  if (!config) {
    return (
      <main className="page">
        <p className="empty-note">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <img
          src="/logo.png"
          alt="Mil e Uma Noites"
          className="logo-img"
        />

        <h1>Mil e Uma Noites</h1>
        <p>Shawarma e Lanches</p>
      </header>

      <nav className="categories">
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={categoriaAtiva === cat.id ? 'active' : ''}
            onClick={() => setCategoriaAtiva(cat.id)}
          >
            {cat.nome}
          </button>
        ))}
      </nav>

      <section className="menu">
        {categorias.map(cat => {
          const produtosCategoria = produtos.filter(
            p => p.categoria_id === cat.id
          );

          if (!produtosCategoria.length) return null;

          if (categoriaAtiva !== null && categoriaAtiva !== cat.id) {
            return null;
          }

          return (
            <div className="category-section" key={cat.id}>
              <div className="category-title">
                {cat.imagem_url && (
                  <img src={cat.imagem_url} alt="" />
                )}

                <h2>{cat.nome}</h2>
              </div>

              <div className="products">
                {produtosCategoria.map(produto => {
                  const qtd = quantidadeProduto(produto.id);

                  return (
                    <article className="product" key={produto.id}>
                      {produto.imagem_url && (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="prod-img"
                        />
                      )}

                      <div className="prod-info">
                        <h3 className="prod-name">
                          {produto.nome}
                        </h3>

                        {produto.descricao && (
                          <p className="prod-desc">
                            {produto.descricao}
                          </p>
                        )}

                        <strong className="prod-price">
                          {brl(produto.preco)}
                        </strong>
                      </div>

                      <div className="prod-action">
                        {qtd === 0 ? (
                          <button
                            className="add-btn"
                            onClick={() => adicionarProduto(produto.id)}
                          >
                            + Adicionar
                          </button>
                        ) : (
                          <div className="quantity">
                            <button
                              onClick={() =>
                                removerProduto(produto.id)
                              }
                            >
                              −
                            </button>

                            <span>{qtd}</span>

                            <button
                              onClick={() =>
                                adicionarProduto(produto.id)
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {produtosCarrinho.length > 0 && (
        <section className="cart">
          <div className="cart-header">
            <h2>Seu pedido</h2>
            <strong>{brl(total)}</strong>
          </div>

          {produtosCarrinho.map(produto => (
            <div className="cart-item" key={produto.id}>
              <div>
                <strong>{produto.nome}</strong>
                <span>
                  {carrinho[produto.id]}x
                </span>
              </div>

              <strong>
                {brl(
                  produto.preco * carrinho[produto.id]
                )}
              </strong>
            </div>
          ))}

          <div className="checkout">
            <h3>Dados para entrega</h3>

            <div className="field">
              <label>Nome</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="field">
              <label>WhatsApp</label>
              <input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="field">
              <label>Endereço</label>
              <input
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                placeholder="Rua, avenida..."
              />
            </div>

            <div className="field">
              <label>Número</label>
              <input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Número"
              />
            </div>

            <div className="field">
              <label>Bairro</label>
              <input
                value={bairro}
                onChange={e => setBairro(e.target.value)}
                placeholder="Seu bairro"
              />
            </div>

            <div className="field">
              <label>Referência</label>
              <input
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ponto de referência"
              />
            </div>

            <div className="field">
              <label>Forma de pagamento</label>

              <select
                value={formaPagamento}
                onChange={e =>
                  setFormaPagamento(e.target.value)
                }
              >
                <option value="">
                  Selecione
                </option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>

            {formaPagamento === 'Dinheiro' && (
              <div className="field">
                <label>Troco para quanto?</label>
                <input
                  value={troco}
                  onChange={e => setTroco(e.target.value)}
                  placeholder="Ex.: R$ 100,00"
                />
              </div>
            )}

            <div className="field">
              <label>Observações</label>
              <textarea
                value={observacoes}
                onChange={e =>
                  setObservacoes(e.target.value)
                }
                placeholder="Alguma observação sobre o pedido?"
              />
            </div>

            <button
              className="checkout-btn"
              onClick={finalizarPedido}
              disabled={enviando}
            >
              {enviando
                ? 'Enviando...'
                : `Finalizar pedido • ${brl(total)}`}
            </button>
          </div>
        </section>
      )}

      {pedidoConfirmado && (
        <div className="success-box">
          <h2>Pedido enviado! ❤️</h2>

          <p>
            Seu pedido foi registrado e o WhatsApp foi aberto
            para confirmação.
          </p>

          <button
            onClick={() => setPedidoConfirmado(false)}
          >
            Voltar ao cardápio
          </button>
        </div>
      )}

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

        {/* CRÉDITO */}
        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: 'rgba(201,195,179,.45)',
            textAlign: 'left',
          }}
        >
          Desenvolvido por Faby Bassitii
        </p>

        {/* PAINEL ADMINISTRATIVO */}
        <a
          className="admin-link"
          href="/admin"
        >
          🔐 Painel Administrativo
        </a>
      </footer>
    </main>
  );
}
