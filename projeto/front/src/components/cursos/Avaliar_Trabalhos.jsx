import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import './css/Avaliar_Trabalhos.css';

const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorreto');
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    try {
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Erro ao decodificar payload JWT:', e);
      return null;
    }
  } catch (error) {
    console.error('Erro ao processar token JWT:', error);
    return null;
  }
};

const Avaliar_Trabalhos = () => {
  const { cursoId, pastaId } = useParams();
  const navigate = useNavigate();

  const [submissoes, setSubmissoes] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [pastaSelecionada, setPastaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [notasAlteradas, setNotasAlteradas] = useState({});
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_desc');

  // Verifica se o utilizador é formador
  const isFormador = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = decodeJWT(token);
      if (!payload) return false;

      // Assumindo que id_cargo 1 e 2 são formadores
      return payload.id_cargo === 1 || payload.id_cargo === 2;
    } catch (e) {
      console.error('Erro ao verificar permissões:', e);
      return false;
    }
  };

  // Verificar permissões ao iniciar
  useEffect(() => {
    if (!isFormador()) {
      alert('Acesso restrito a formadores.');
      navigate(`/curso/${cursoId}`);
    }
  }, [cursoId, navigate]);

  // Função para carregar pastas do tópico
  const carregarPastas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/topicos-curso/${pastaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.pastas && response.data.pastas.length > 0) {
        setPastas(response.data.pastas);
        setPastaSelecionada(response.data.pastas[0].id_pasta);
      }
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
      setErro('Não foi possível carregar as pastas de avaliação.');
    }
  };

  // Função para carregar submissões
  const carregarSubmissoes = async () => {
    if (!pastaSelecionada) return;

    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/avaliacoes/submissoes`, {
        params: {
          id_curso: cursoId,
          id_pasta: pastaSelecionada
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Preparar as submissões com as notas atuais
      const submissoesComNotas = await Promise.all(response.data.map(async (submissao) => {
        try {
          // Tentar obter a nota da avaliação
          const avaliacaoResponse = await axios.get(`${API_BASE}/avaliacoes`, {
            params: {
              id_curso: cursoId,
              id_utilizador: submissao.id_trabalho_utilizador
            },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (avaliacaoResponse.data && avaliacaoResponse.data.length > 0) {
            return { ...submissao, nota: avaliacaoResponse.data[0].nota || 0 };
          }
        } catch (err) {
          console.error('Erro ao obter nota:', err);
        }

        // Se não houver avaliação ou ocorrer erro, retornar com nota 0
        return { ...submissao, nota: 0 };
      }));

      setSubmissoes(submissoesComNotas);
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
      setErro('Não foi possível carregar as submissões.');
      setCarregando(false);
    }
  };

  // Carregar pastas ao iniciar
  useEffect(() => {
    if (cursoId && pastaId) {
      carregarPastas();
    }
  }, [cursoId, pastaId]);

  // Carregar submissões quando pasta selecionada mudar
  useEffect(() => {
    if (pastaSelecionada) {
      carregarSubmissoes();
    }
  }, [pastaSelecionada]);

  // Função para mudar a pasta selecionada
  const handleChangePasta = (e) => {
    setPastaSelecionada(e.target.value);
  };

  // Função para atualizar nota localmente
  const handleChangeNota = (id, valor) => {
    // Validar nota entre 0 e 20
    const nota = parseFloat(valor);
    if (isNaN(nota) || nota < 0 || nota > 20) return;

    setNotasAlteradas({
      ...notasAlteradas,
      [id]: nota
    });
  };

  // Função para salvar notas
  const salvarNotas = async () => {
    if (Object.keys(notasAlteradas).length === 0) return;

    try {
      setSalvandoNotas(true);
      const token = localStorage.getItem('token');

      // Processar cada nota alterada
      const promises = Object.entries(notasAlteradas).map(async ([id, nota]) => {
        const submissao = submissoes.find(s => s.id_trabalho.toString() === id);
                if (!submissao) return;

        try {
          // Verificar se já existe uma avaliação
          const avaliacoesResponse = await axios.get(`${API_BASE}/avaliacoes`, {
            params: {
              id_curso: cursoId,
              id_utilizador: submissao.id_trabalho_utilizador
            },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (avaliacoesResponse.data && avaliacoesResponse.data.length > 0) {
            // Atualizar avaliação existente
            const avaliacao = avaliacoesResponse.data[0];
            await axios.put(`${API_BASE}/avaliacoes/${avaliacao.id_avaliacao}`, {
              nota: nota
            }, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } else {
            // Criar nova avaliação
            // Primeiro, precisamos obter o id_inscricao
            const inscricoesResponse = await axios.get(`${API_BASE}/inscricoes`, {
              params: {
                id_curso: cursoId,
                id_utilizador: submissao.id_trabalho_utilizador
              },
              headers: { Authorization: `Bearer ${token}` }
            });

            if (inscricoesResponse.data && inscricoesResponse.data.length > 0) {
              const inscricao = inscricoesResponse.data[0];
              await axios.post(`${API_BASE}/avaliacoes`, {
                id_inscricao: inscricao.id_inscricao,
                nota: nota,
                certificado: false,
                horas_totais: 0,
                horas_presenca: 0
              }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
            }
          }
        } catch (err) {
          console.error(`Erro ao salvar nota para submissão ${id}:`, err);
          throw err;
        }
      });

      await Promise.all(promises);

      // Atualizar submissões com novas notas
      setSubmissoes(submissoes.map(submissao => {
        if (notasAlteradas[submissao.id_trabalho]) {
          return { ...submissao, nota: notasAlteradas[submissao.id_trabalho] };
        }
        return submissao;
      }));

      setNotasAlteradas({});
      alert('Notas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas. Por favor, tente novamente.');
    } finally {
      setSalvandoNotas(false);
    }
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "Sem data";

    const data = new Date(dataString);
    return data.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para verificar se uma submissão está atrasada
  const isSubmissaoAtrasada = (submissao, dataLimite) => {
    if (!dataLimite || !submissao.data_entrega) return false;

    const limite = new Date(dataLimite);
    const entrega = new Date(submissao.data_entrega);

    return entrega > limite;
  };

  // Filtrar submissões
  const submissoesFiltradas = submissoes.filter(submissao => {
    if (!filtro) return true;

    const termoLowerCase = filtro.toLowerCase();
    return (
      (submissao.utilizador?.nome || '').toLowerCase().includes(termoLowerCase) ||
      (submissao.utilizador?.email || '').toLowerCase().includes(termoLowerCase) ||
      (submissao.nome_ficheiro || '').toLowerCase().includes(termoLowerCase)
    );
  });

  // Ordenar submissões
  const submissoesOrdenadas = [...submissoesFiltradas].sort((a, b) => {
    switch (ordenacao) {
      case 'nome_asc':
        return (a.utilizador?.nome || '').localeCompare(b.utilizador?.nome || '');
      case 'nome_desc':
        return (b.utilizador?.nome || '').localeCompare(a.utilizador?.nome || '');
      case 'data_asc':
        return new Date(a.data_entrega) - new Date(b.data_entrega);
      case 'data_desc':
        return new Date(b.data_entrega) - new Date(a.data_entrega);
      case 'nota_asc':
        return (a.nota || 0) - (b.nota || 0);
      case 'nota_desc':
        return (b.nota || 0) - (a.nota || 0);
      default:
        return 0;
    }
  });

  // Obter a data limite da pasta selecionada
  const obterDataLimite = () => {
    if (!pastaSelecionada) return null;
    const pasta = pastas.find(p => p.id_pasta.toString() === pastaSelecionada.toString());
    return pasta?.data_limite || null;
  };


  const gerarCertificado = async (submissao) => {
    try {
      // Verificar se o aluno tem nota de aprovação (≥ 10)
      if (!submissao.nota || submissao.nota < 10) {
        alert('O aluno precisa ter nota igual ou superior a 10 para obter certificado.');
        return;
      }

      const token = localStorage.getItem('token');

      // Primeiro, obter a inscrição do aluno
      const inscricoesResponse = await axios.get(`${API_BASE}/inscricoes`, {
        params: {
          id_curso: cursoId,
          id_utilizador: submissao.id_trabalho_utilizador
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!inscricoesResponse.data || inscricoesResponse.data.length === 0) {
        alert('Não foi possível encontrar a inscrição do aluno.');
        return;
      }

      const inscricao = inscricoesResponse.data[0];

      // Obter a avaliação atual
      const avaliacoesResponse = await axios.get(`${API_BASE}/avaliacoes`, {
        params: {
          id_curso: cursoId,
          id_utilizador: submissao.id_trabalho_utilizador
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (avaliacoesResponse.data && avaliacoesResponse.data.length > 0) {
        // Atualizar avaliação com certificado = true
        const avaliacao = avaliacoesResponse.data[0];
        await axios.put(`${API_BASE}/avaliacoes/${avaliacao.id_avaliacao}`, {
          certificado: true
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        alert(`Certificado gerado com sucesso para ${submissao.utilizador?.nome}!`);

        // Opcionalmente, abrir a página de impressão do certificado
        // window.open(`/certificado/${avaliacao.id_avaliacao}`, '_blank');

      } else {
        alert('Avaliação não encontrada para este aluno.');
      }
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Erro ao gerar certificado. Por favor, tente novamente.');
    }
  };



  if (carregando && submissoes.length === 0) {
    return (
      <div className="avaliar-trabalhos-loading">
        <div className="loading-spinner"></div>
        <p>A carregar submissões...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="avaliar-trabalhos-erro">
        <p className="erro-mensagem">{erro}</p>
        <button onClick={() => { setErro(null); carregarPastas(); }} className="btn-retry">
          Tentar novamente
        </button>
      </div>
    );
  }

  const dataLimite = obterDataLimite();

  return (
    <div className="avaliar-trabalhos-container">
      <div className="avaliar-trabalhos-header">
        <h2>Avaliar Trabalhos</h2>
        <button
          className="btn-voltar"
          onClick={() => navigate(`/curso/${cursoId}`)}
        >
          <i className="fas fa-arrow-left"></i> Voltar
        </button>
      </div>

      <div className="avaliar-trabalhos-filtros">
        <div className="filtro-pasta">
          <label htmlFor="pasta-select">Pasta:</label>
          <select
            id="pasta-select"
            value={pastaSelecionada}
            onChange={handleChangePasta}
          >
            {pastas.map(pasta => (
              <option key={pasta.id_pasta} value={pasta.id_pasta}>
                {pasta.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-busca">
          <input
            type="text"
            placeholder="Filtrar por nome ou email..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        <div className="filtro-ordenacao">
          <label htmlFor="ordenacao-select">Ordenar por:</label>
          <select
            id="ordenacao-select"
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value)}
          >
            <option value="data_desc">Data (mais recente)</option>
            <option value="data_asc">Data (mais antiga)</option>
            <option value="nome_asc">Nome (A-Z)</option>
            <option value="nome_desc">Nome (Z-A)</option>
            <option value="nota_desc">Nota (maior)</option>
            <option value="nota_asc">Nota (menor)</option>
          </select>
        </div>
      </div>

      {dataLimite && (
        <div className="info-data-limite">
          <i className="fas fa-clock"></i>
          <span>Data limite de entrega: {formatarData(dataLimite)}</span>
        </div>
      )}

      {Object.keys(notasAlteradas).length > 0 && (
        <div className="notas-alteradas-info">
          <i className="fas fa-info-circle"></i>
          <span>Existem notas alteradas que não foram salvas</span>
          <button
            className="btn-salvar-notas"
            onClick={salvarNotas}
            disabled={salvandoNotas}
          >
            {salvandoNotas ? 'A salvar...' : 'Salvar Notas'}
          </button>
        </div>
      )}

      {submissoesOrdenadas.length > 0 ? (
        <div className="tabela-submissoes-wrapper">
          <table className="tabela-submissoes">
            <thead>
              <tr>
                <th>Formando</th>
                <th>Email</th>
                <th>Ficheiro</th>
                <th>Data de Submissão</th>
                <th>Estado</th>
                <th>Nota (0-20)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissoesOrdenadas.map(submissao => {
                const atrasada = isSubmissaoAtrasada(submissao, dataLimite);
                return (
                  <tr key={submissao.id_trabalho} className={atrasada ? 'submissao-atrasada' : ''}>
                    <td>{submissao.utilizador?.nome || 'Sem nome'}</td>
                    <td>{submissao.utilizador?.email || 'Sem email'}</td>
                    <td className="ficheiro-cell">
                      {submissao.nome_ficheiro || submissao.ficheiro_path.split('/').pop()}
                    </td>
                    <td>{formatarData(submissao.data_entrega)}</td>
                    <td>
                      {atrasada ? (
                        <span className="status-atrasado">Atrasado</span>
                      ) : (
                        <span className="status-entregue">Entregue</span>
                      )}
                    </td>
                    <td className="nota-cell">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={notasAlteradas[submissao.id_trabalho] !== undefined ? notasAlteradas[submissao.id_trabalho] : submissao.nota || 0}
                        onChange={e => handleChangeNota(submissao.id_trabalho, e.target.value)}
                        className={notasAlteradas[submissao.id_trabalho] !== undefined ? 'nota-alterada' : ''}
                      />
                    </td>
                    <td className="acoes-cell">
                      <button
                        className="btn-download"
                        onClick={() => window.open(`${API_BASE}/${submissao.ficheiro_path}`, '_blank')}
                        title="Descarregar ficheiro"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        className="btn-comentarios"
                        onClick={() => navigate(`/curso/${cursoId}/avaliacao/submissao/${submissao.id_trabalho}`)}
                        title="Ver detalhes e adicionar comentários"
                      >
                        <i className="fas fa-comment"></i>
                      </button>
                      <button
                        className="btn-certificado"
                        onClick={() => gerarCertificado(submissao)}
                        title="Gerar certificado"
                        disabled={!submissao.nota || submissao.nota < 10}
                      >
                        <i className="fas fa-certificate"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sem-submissoes">
          <p>Nenhuma submissão encontrada para esta pasta.</p>
        </div>
      )}

      {submissoesOrdenadas.length > 0 && (
        <div className="actions-footer">
          <button
            className="btn-salvar-notas"
            onClick={salvarNotas}
            disabled={salvandoNotas || Object.keys(notasAlteradas).length === 0}
          >
            {salvandoNotas ? 'A salvar...' : 'Salvar Notas'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Avaliar_Trabalhos;