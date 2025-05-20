import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE from '../../api';
import './css/Avaliar_Submissoes.css';

const Avaliar_Submissoes = () => {
  const { cursoId } = useParams();
  const [submissoes, setSubmissoes] = useState([]);
  const [notas, setNotas] = useState({});
  const [saving, setSaving] = useState({});

  // Carrega submissões para avaliação
  useEffect(() => {
    const fetchSubmissoes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE}/trabalhos/curso/${cursoId}/avaliar`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmissoes(response.data);
        // Inicializa notas
        const initial = {};
        response.data.forEach(item => { initial[item.id] = item.nota || '' });
        setNotas(initial);
      } catch (error) {
        console.error('Erro ao carregar submissões:', error);
      }
    };
    fetchSubmissoes();
  }, [cursoId]);

  // Ao alterar nota no campo
  const handleNotaChange = (id, value) => {
    setNotas(prev => ({ ...prev, [id]: value }));
  };

  // Salvar nota de uma submissão
  const handleSave = async (id) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/trabalhos/${id}`,
        { nota: notas[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Nota salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Não foi possível salvar a nota.');
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="avaliar-submissoes-container">
      <h2>Avaliar Submissões</h2>
      {submissoes.length > 0 ? (
        <table className="tabela-avaliar">
          <thead>
            <tr>
              <th>Nome Aluno</th>
              <th>Submissão</th>
              <th>Nota</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {submissoes.map(item => (
              <tr key={item.id}>
                <td>{item.nome_formando}</td>
                <td>
                  {item.ficheiro_path ? (
                    <a href={`${API_BASE}/${item.ficheiro_path}`} target="_blank" rel="noopener noreferrer">
                      Ver Ficheiro
                    </a>
                  ) : (
                    'Sem ficheiro'
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={notas[item.id]}
                    onChange={e => handleNotaChange(item.id, e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="btn-salvar-nota"
                    onClick={() => handleSave(item.id)}
                    disabled={saving[item.id]}
                    title="Salvar nota"
                  >
                    <i className="fas fa-save"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhuma submissão para avaliar.</p>
      )}
    </div>
  );
};

export default Avaliar_Submissoes;
