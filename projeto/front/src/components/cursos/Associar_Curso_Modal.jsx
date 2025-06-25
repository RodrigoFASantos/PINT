import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import '../css/Modal.css';

const CursoAssociacaoModal = ({ isOpen, onClose, onSelectCurso, cursoAtualId }) => {
  // Estados para gestão do modal
  const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carregar dados quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      carregarRecursos();
      carregarCursos();
    }
  }, [isOpen, page, searchTerm, selectedCategoria, selectedArea]);

  // Resetar estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); 
      setSelectedCategoria('');
      setSelectedArea('');
      setPage(1);
      setCursosDisponiveis([]);
    }
  }, [isOpen]);

  // Carregar categorias e áreas
  const carregarRecursos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [categoriasRes, areasRes] = await Promise.all([
        axios.get(`${API_BASE}/categorias`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/areas`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCategorias(categoriasRes.data || []);
      setAreas(areasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    }
  };

  // Carregar cursos disponíveis
  const carregarCursos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir parâmetros de pesquisa
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategoria) {
        params.append('categoria', selectedCategoria);
      }
      
      if (selectedArea) {
        params.append('area', selectedArea);
      }

      const response = await axios.get(`${API_BASE}/cursos?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let cursosData = [];
      let total = 0;

      if (response.data.cursos) {
        cursosData = response.data.cursos;
        total = response.data.totalPages || 1;
      } else if (Array.isArray(response.data)) {
        cursosData = response.data;
        total = 1;
      }

      // Filtrar o curso atual se fornecido
      if (cursoAtualId) {
        cursosData = cursosData.filter(curso => curso.id_curso !== cursoAtualId);
      }

      setCursosDisponiveis(cursosData);
      setTotalPages(total);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      setCursosDisponiveis([]);
    } finally {
      setLoading(false);
    }
  };

  // Manipular seleção de curso
  const handleSelectCurso = (curso) => {
    onSelectCurso(curso);
    onClose();
  };

  // Manipular mudança de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Filtrar áreas por categoria selecionada
  const areasFiltradas = selectedCategoria 
    ? areas.filter(area => area.id_categoria == selectedCategoria)
    : areas;

  // Obter URL da imagem do curso
  const getImageUrl = (curso) => {
    if (curso.imagem_path) {
      return `${API_BASE}/${curso.imagem_path}`;
    }
    return '/placeholder-curso.jpg';
  };

  // Formatar estado do curso
  const formatarEstado = (estado) => {
    const estados = {
      'planeado': 'Planeado',
      'em_curso': 'Em Curso',
      'terminado': 'Terminado',
      'inativo': 'Inativo'
    };
    return estados[estado] || estado;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content associacao-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Associar Curso</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Pesquisar por nome do curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-row">
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                setSelectedArea(''); // Limpar área quando categoria muda
              }}
              className="filter-select"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="filter-select"
              disabled={!selectedCategoria}
            >
              <option value="">Todas as áreas</option>
              {areasFiltradas.map(area => (
                <option key={area.id_area} value={area.id_area}>
                  {area.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>A carregar cursos...</p>
            </div>
          ) : cursosDisponiveis.length > 0 ? (
            <div className="cursos-list">
              {cursosDisponiveis.map(curso => (
                <div
                  key={curso.id_curso}
                  className="curso-item"
                  onClick={() => handleSelectCurso(curso)}
                >
                  <div className="curso-image">
                    <img
                      src={getImageUrl(curso)}
                      alt={curso.nome}
                      onError={(e) => {
                        e.target.src = '/placeholder-curso.jpg';
                      }}
                    />
                  </div>
                  <div className="curso-info">
                    <h3 className="curso-nome">{curso.nome}</h3>
                    <div className="curso-meta">
                      <span className={`curso-estado ${curso.estado}`}>
                        {formatarEstado(curso.estado)}
                      </span>
                      <span className="curso-tipo">
                        {curso.tipo === 'sincrono' ? 'Síncrono' : 'Assíncrono'}
                      </span>
                    </div>
                    {curso.descricao && (
                      <p className="curso-descricao">{curso.descricao}</p>
                    )}
                    <div className="curso-detalhes">
                      {curso.categoria && (
                        <span>Categoria: {curso.categoria.nome}</span>
                      )}
                      {curso.area && (
                        <span>Área: {curso.area.nome}</span>
                      )}
                    </div>
                  </div>
                  <div className="curso-action">
                    <i className="fas fa-plus"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-courses">
              <i className="fas fa-graduation-cap"></i>
              <p>Nenhum curso encontrado com os filtros selecionados</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="modal-pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="pagination-info">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoAssociacaoModal;