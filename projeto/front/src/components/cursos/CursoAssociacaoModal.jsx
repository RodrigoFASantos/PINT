import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from "../../api";
import './css/Modal.css';

const CursoAssociacaoModal = ({ isOpen, onClose, onSelectCurso, cursoAtualId }) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCurso, setSelectedCurso] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCursos();
    }
  }, [isOpen]);

  const loadCursos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/cursos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Filtrar o curso atual, se estiver em modo de edição
      const filteredCursos = cursoAtualId 
        ? response.data.cursos.filter(curso => curso.id_curso !== cursoAtualId)
        : response.data.cursos;
      
      setCursos(filteredCursos);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSelectCurso = (curso) => {
    setSelectedCurso(curso);
  };

  const handleConfirm = () => {
    if (selectedCurso) {
      onSelectCurso(selectedCurso);
      onClose();
    }
  };

  const filteredCursos = cursos.filter(curso => 
    curso.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Curso para Associar</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Pesquisar cursos..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="loading-spinner">A carregar cursos...</div>
          ) : (
            <div className="cursos-list">
              {filteredCursos.length === 0 ? (
                <p className="no-results">Nenhum curso encontrado</p>
              ) : (
                filteredCursos.map(curso => (
                  <div 
                    key={curso.id_curso}
                    className={`curso-item ${selectedCurso?.id_curso === curso.id_curso ? 'selected' : ''}`}
                    onClick={() => handleSelectCurso(curso)}
                  >
                    <div className="curso-info">
                      <h3>{curso.nome}</h3>
                      <p className="curso-categoria">{curso.categoria?.nome || 'Sem categoria'}</p>
                      <p className="curso-area">{curso.area?.nome || 'Sem área'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={!selectedCurso}
          >
            Associar Curso
          </button>
        </div>
      </div>
    </div>
  );
};

export default CursoAssociacaoModal;