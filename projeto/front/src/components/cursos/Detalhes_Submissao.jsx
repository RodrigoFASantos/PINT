import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import './css/DetalhesSubmissao.css';

const DetalhesSubmissao = ({ submissao, cursoId, pastaId }) => {
  const [detalhes, setDetalhes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        setCarregando(true);
        const token = localStorage.getItem('token');

        // Verificar se temos um ID válido para a submissão
        const submissaoId = submissao.id || submissao.id_trabalho;

        if (!submissaoId) {
          console.error('ID da submissão não encontrado:', submissao);
          setErro('Não foi possível identificar esta submissão. ID inválido.');
          setCarregando(false);
          return;
        }

        // Obter detalhes completos da submissão
        const response = await axios.get(
          `${API_BASE}/trabalhos/${submissaoId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Obter detalhes da pasta para verificar prazos
        const pastaResponse = await axios.get(
          `${API_BASE}/pastas-curso/${pastaId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Combinar dados
        setDetalhes({
          ...response.data,
          prazo: pastaResponse.data.data_limite || null,
          comentarios: response.data.comentarios || []
        });

        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar detalhes da submissão:', error);
        setErro('Não foi possível carregar os detalhes. Por favor, tente novamente.');
        setCarregando(false);
      }
    };

    if (submissao) {
      carregarDetalhes();
    } else {
      setErro('Nenhuma submissão selecionada');
      setCarregando(false);
    }
  }, [submissao, cursoId, pastaId]);

  // Calcular tempo até o prazo ou após submissão
  const calcularTempoRestante = (dataLimite, dataSubmissao) => {
    if (!dataLimite) return "Sem prazo definido";

    const limite = new Date(dataLimite);
    const submissao = new Date(dataSubmissao);

    if (submissao < limite) {
      // Calcular a diferença em dias e horas
      const diff = Math.abs(limite - submissao);
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return `O trabalho foi submetido '${dias} dias ${horas} horas' antes do prazo`;
    } else {
      // Caso tenha submetido após o prazo
      const diff = Math.abs(submissao - limite);
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return `O trabalho foi submetido '${dias} dias ${horas} horas' após o prazo`;
    }
  };

  // Função para normalizar nomes de forma semelhante ao backend

  const normalizarNomeFrontend = (nome) => {
    if (!nome) return '';

    // Converter para minúsculas
    let normalizado = nome.toLowerCase();

    // Remover acentos
    normalizado = normalizado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Substituir espaços por hífens
    normalizado = normalizado.replace(/\s+/g, '-');

    // Remover caracteres especiais
    normalizado = normalizado.replace(/[^a-z0-9-_]/g, '');

    return normalizado;
  };

  // Formatar data em PT
  const formatarData = (dataString) => {
    if (!dataString) return "Data não disponível";

    const data = new Date(dataString);
    const dias = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const meses = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const diaSemana = dias[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');

    return `${diaSemana}, ${dia} de ${mes} de ${ano} às ${horas}:${minutos}`;
  };

  if (carregando) {
    return <div className="carregando-detalhes">Carregando detalhes...</div>;
  }

  if (erro) {
    return <div className="erro-detalhes">{erro}</div>;
  }

  if (!detalhes) {
    return <div className="sem-detalhes">Detalhes não disponíveis</div>;
  }

  return (
    <div className="detalhes-submissao-container">
      <h3>Estado do trabalho</h3>

      <table className="tabela-detalhes">
        <tbody>
          <tr>
            <td className="label-detalhe">Estado da submissão</td>
            <td className="valor-detalhe">Submetido para avaliação</td>
          </tr>

          <tr>
            <td className="label-detalhe">Estado da avaliação</td>
            <td className="valor-detalhe">{detalhes.nota ? `Avaliado (${detalhes.nota})` : "Sem avaliação"}</td>
          </tr>

          <tr>
            <td className="label-detalhe">Data limite para submeter trabalhos</td>
            <td className="valor-detalhe">{formatarData(detalhes.prazo)}</td>
          </tr>

          <tr className="row-destaque">
            <td className="label-detalhe">Tempo restante</td>
            <td className="valor-detalhe">
              {calcularTempoRestante(detalhes.prazo, detalhes.data_entrega || detalhes.data_submissao)}
            </td>
          </tr>

          <tr>
            <td className="label-detalhe">Última modificação</td>
            <td className="valor-detalhe">{formatarData(detalhes.data_entrega || detalhes.data_submissao)}</td>
          </tr>

          <tr>
            <td className="label-detalhe">Submissão de ficheiros</td>
            <td className="valor-detalhe">
              {detalhes.ficheiro_path && (
                <div className="ficheiro-item">
                  <div className="ficheiro-icone pdf-icon"></div>
                  <a
                    href={`${API_BASE}/${detalhes.ficheiro_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ficheiro-link"
                  >
                    {detalhes.nome_ficheiro}
                  </a>

                  <span className="ficheiro-data">
                    {formatarData(detalhes.data_entrega || detalhes.data_submissao)}
                  </span>
                </div>
              )}
            </td>
          </tr>

          <tr>
            <td className="label-detalhe">Comentários à submissão</td>
            <td className="valor-detalhe">
              <div className="comentarios-dropdown">
                <a href="#" className="comentarios-toggle">Comentários ({detalhes.comentarios?.length || 0})</a>

                {detalhes.comentarios && detalhes.comentarios.length > 0 ? (
                  <div className="comentarios-lista">
                    {detalhes.comentarios.map((comentario, index) => (
                      <div key={index} className="comentario-item">
                        <div className="comentario-autor">{comentario.nome_utilizador}</div>
                        <div className="comentario-data">{formatarData(comentario.data_comentario)}</div>
                        <div className="comentario-texto">{comentario.texto}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sem-comentarios">Sem comentários</div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DetalhesSubmissao;