import React, { useState, useEffect } from "react";
import "./css/Modal.css";

const CategoriaModal = ({ isOpen, onClose, categorias, categoriasSelecionadas, onSelect }) => {
  const [localCategoriasSelecionadas, setLocalCategoriasSelecionadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Removendo estados não utilizados ou adicionando os que faltam
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Inicializar selecionadas locais com as que vieram como prop
    setLocalCategoriasSelecionadas(categoriasSelecionadas || []);
  }, [categoriasSelecionadas]);

  // Filtrar categorias com base no termo de busca
  const categoriasFiltradas = categorias.filter(
    (categoria) => categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoriaClick = (categoria) => {
    const jaSelecionada = localCategoriasSelecionadas.some(
      (cat) => cat.id_categoria === categoria.id_categoria
    );
    
    if (jaSelecionada) {
      // Remover da seleção
      setLocalCategoriasSelecionadas(
        localCategoriasSelecionadas.filter(
          (cat) => cat.id_categoria !== categoria.id_categoria
        )
      );
    } else {
      // Adicionar à seleção
      setLocalCategoriasSelecionadas([...localCategoriasSelecionadas, categoria]);
    }
  };

  const handleConfirmar = () => {
    onSelect(localCategoriasSelecionadas);
  };

  if (!isOpen) return null;

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Categorias</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="modal-body">
          {categoriasFiltradas.length === 0 ? (
            <p className="no-results">Nenhuma categoria encontrada</p>
          ) : (
            <div className="item-list">
              {categoriasFiltradas.map((categoria) => (
                <div
                  key={categoria.id_categoria}
                  className={`item ${
                    localCategoriasSelecionadas.some(
                      (cat) => cat.id_categoria === categoria.id_categoria
                    )
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleCategoriaClick(categoria)}
                >
                  <div className="item-name">{categoria.nome}</div>
                  {localCategoriasSelecionadas.some(
                    (cat) => cat.id_categoria === categoria.id_categoria
                  ) && <div className="selected-icon">✓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <span className="selection-count">
            {localCategoriasSelecionadas.length} categorias selecionadas
          </span>
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button className="confirm-button" onClick={handleConfirmar}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriaModal;