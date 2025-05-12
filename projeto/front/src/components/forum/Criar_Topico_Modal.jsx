import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import './css/Criar_Topico_Modal.css';

const CriarTopicoModal = ({ categoria, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');

  const categoriaId = categoria?.id_categoria || categoria?.id || '';
  const categoriaNome = categoria?.nome || 'Categoria';

  console.log('Categoria recebida no modal:', categoria);
  console.log('Categoria ID:', categoriaId);

  // Carregar áreas relacionadas à categoria selecionada
  useEffect(() => {
    const fetchAreas = async () => {
      if (!categoriaId) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/areas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(response.data)) {
          // Filtrar áreas pela categoria
          const areasFiltered = response.data.filter(area => 
            area.id_categoria === parseInt(categoriaId)
          );
          setAreas(areasFiltered);
        }
      } catch (error) {
        console.error('Erro ao carregar áreas:', error);
        setError('Não foi possível carregar as áreas. Por favor, tente novamente.');
      }
    };
    
    fetchAreas();
  }, [categoriaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('O título do tópico é obrigatório');
      return;
    }
    
    // Verifica se categoriaId está definido
    if (!categoriaId) {
      setError('Categoria inválida');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Incluir id_area na requisição se estiver selecionada
      const requestData = {
        id_categoria: categoriaId,
        titulo: titulo,
        descricao: descricao
      };
      
      // Adicionar id_area apenas se estiver selecionada
      if (selectedArea) {
        requestData.id_area = selectedArea;
      }
      
      const response = await axios.post(
        `${API_BASE}/topicos`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success || response.status === 201) {
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setError(error.response?.data?.message || 'Erro ao criar tópico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Criar Novo Tópico</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Categoria:</label>
              <p className="categoria-name">{categoriaNome}</p>
            </div>
            
            {/* Seleção de Área - Novo campo */}
            <div className="form-group">
              <label htmlFor="area">Área:</label>
              <select
                id="area"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="area-select"
              >
                <option value="">Selecione uma área (opcional)</option>
                {areas.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="titulo">Título do Tópico:</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título do tópico"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descricao">Descrição (opcional):</label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite uma breve descrição do tópico"
                rows="4"
              ></textarea>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{
                display: 'inline-block',
                visibility: 'visible',
                backgroundColor: '#4b6ba5',
                color: 'white',
                padding: '0.6rem 1.2rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {loading ? 'Criando...' : 'Criar Tópico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarTopicoModal;