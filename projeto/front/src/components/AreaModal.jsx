import React, { useState, useEffect } from "react";
import "./css/Modal.css";

const AreaModal = ({ isOpen, onClose, areas, areasSelecionadas, onSelect }) => {
  const [localAreasSelecionadas, setLocalAreasSelecionadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Inicializar selecionadas locais com as que vieram como prop
    setLocalAreasSelecionadas(areasSelecionadas || []);
  }, [areasSelecionadas]);

  // Filtrar áreas com base no termo de busca
  const areasFiltradas = areas.filter(
    (area) => area.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAreaClick = (area) => {
    const jaSelecionada = localAreasSelecionadas.some(
      (a) => a.id_area === area.id_area
    );
    
    if (jaSelecionada) {
      // Remover da seleção
      setLocalAreasSelecionadas(
        localAreasSelecionadas.filter(
          (a) => a.id_area !== area.id_area
        )
      );
    } else {
      // Adicionar à seleção
      setLocalAreasSelecionadas([...localAreasSelecionadas, area]);
    }
  };

  const handleConfirmar = () => {
    onSelect(localAreasSelecionadas);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Áreas</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            placeholder="Buscar áreas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="modal-body">
          {areasFiltradas.length === 0 ? (
            <p className="no-results">Nenhuma área encontrada para a categoria selecionada</p>
          ) : (
            <div className="item-list">
              {areasFiltradas.map((area) => (
                <div
                  key={area.id_area}
                  className={`item ${
                    localAreasSelecionadas.some(
                      (a) => a.id_area === area.id_area
                    )
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleAreaClick(area)}
                >
                  <div className="item-info">
                    <div className="item-name">{area.nome}</div>
                    {area.categoriaParent && (
                      <div className="item-description">
                        Categoria: {area.categoriaParent.nome}
                      </div>
                    )}
                  </div>
                  
                  {localAreasSelecionadas.some(
                    (a) => a.id_area === area.id_area
                  ) && <div className="selected-icon">✓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <span className="selection-count">
            {localAreasSelecionadas.length} áreas selecionadas
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

export default AreaModal;