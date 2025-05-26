import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/Formador_Modal.css';

const FormadorModal = ({ isOpen, onClose, setFormador, users, currentFormadorId, tipoCurso = 'sincrono' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormador, setSelectedFormador] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Função para obter o ID do utilizador de forma consistente
  const getUserId = (user) => {
    return user.id_utilizador || user.id_user || user.id || user.idUser || user.userId;
  };

  // Função para obter o cargo do utilizador
  const getUserCargo = (user) => {
    return user.cargo?.id_cargo || user.id_cargo || null;
  };

  // Função para obter o nome do cargo
  const getCargoNome = (user) => {
    const cargoId = getUserCargo(user);
    if (user.cargo && user.cargo.nome_cargo) {
      return user.cargo.nome_cargo;
    }

    switch (cargoId) {
      case 1: return 'Administrador';
      case 2: return 'Formador';
      case 3: return 'Formando';
      default: return 'Cargo não definido';
    }
  };

  // Verificar se o utilizador é administrador
  const isAdministrador = (user) => {
    return getUserCargo(user) === 1;
  };

  // Quando o modal abre, definir o formador atual como selecionado
  useEffect(() => {
    if (isOpen && users && users.length > 0 && currentFormadorId) {
      const currentFormador = users.find(user =>
        getUserId(user).toString() === currentFormadorId.toString()
      );
      setSelectedFormador(currentFormador || null);
    } else if (isOpen) {
      // Reset ao abrir o modal se não houver formador selecionado
      setSelectedFormador(null);
    }

    // Reset estados da interface quando o modal é aberto
    setShowFilters(false);
    setSearchTerm('');
  }, [isOpen, users, currentFormadorId]);

  useEffect(() => {
    if (users && users.length > 0) {
      let filtered = [...users];

      // Para cursos assíncronos, filtrar apenas administradores
      if (tipoCurso === 'assincrono') {
        filtered = filtered.filter(user => isAdministrador(user));
      }

      // Aplicar pesquisa
      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Aplicar ordenação
      switch (sortOption) {
        case 'nameAsc':
          filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          break;
        case 'nameDesc':
          filtered.sort((a, b) => (b.nome || '').localeCompare(a.nome || ''));
          break;
        case 'cargoAsc':
          filtered.sort((a, b) => {
            const cargoA = getUserCargo(a) || 999;
            const cargoB = getUserCargo(b) || 999;
            return cargoA - cargoB;
          });
          break;
        case 'cargoDesc':
          filtered.sort((a, b) => {
            const cargoA = getUserCargo(a) || 999;
            const cargoB = getUserCargo(b) || 999;
            return cargoB - cargoA;
          });
          break;
        case 'dateAsc':
          filtered.sort((a, b) => {
            const dateA = a.data_inscricao ? new Date(a.data_inscricao) : new Date(0);
            const dateB = b.data_inscricao ? new Date(b.data_inscricao) : new Date(0);
            return dateA - dateB;
          });
          break;
        case 'dateDesc':
          filtered.sort((a, b) => {
            const dateA = a.data_inscricao ? new Date(a.data_inscricao) : new Date(0);
            const dateB = b.data_inscricao ? new Date(b.data_inscricao) : new Date(0);
            return dateB - dateA;
          });
          break;
        default:
          break;
      }

      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [users, searchTerm, sortOption, tipoCurso]);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Toggle seleção do formador (se clicar no mesmo, desseleciona)
  const handleToggleFormador = (user) => {
    if (selectedFormador && getUserId(selectedFormador).toString() === getUserId(user).toString()) {
      setSelectedFormador(null);
    } else {
      setSelectedFormador(user);
    }
  };

  // Selecionar formador e fechar modal
  const handleSelectFormador = () => {
    if (selectedFormador) {
      // Verificar se é curso assíncrono e se o formador é administrador
      if (tipoCurso === 'assincrono' && !isAdministrador(selectedFormador)) {
        alert('Para cursos assíncronos, apenas administradores podem ser formadores.');
        return;
      }

      // Passar o ID do formador conforme esperado pela aplicação
      setFormador(getUserId(selectedFormador));
      onClose();
    } else {
      // Se não houver formador selecionado, passar null ou '' para remover
      setFormador('');
      onClose();
    }
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Função auxiliar para verificar se um formador está selecionado
  const isFormadorSelected = (user) => {
    if (!selectedFormador) return false;
    return getUserId(selectedFormador).toString() === getUserId(user).toString();
  };

  return (
    <div className="formador-modal__overlay">
      <div className="formador-modal__container">

        <div className="formador-modal__header">
          <h2 className="formador-modal__title">
            {tipoCurso === 'assincrono' ? 'Selecionar Formador Administrador' : 'Selecionar Formador'}
          </h2>
          <button
            className="formador-modal__close-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Aviso para cursos assíncronos */}
        {tipoCurso === 'assincrono' && (
          <div className="formador-modal__info-banner">
            <i className="fas fa-info-circle"></i>
            <p>Para cursos assíncronos, apenas utilizadores com cargo de Administrador podem ser formadores.</p>
          </div>
        )}

        <div className="formador-modal__search-container">
          <div className="formador-modal__search-input-container">
            <i className="fas fa-search formador-modal__search-icon"></i>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="formador-modal__search-input"
            />
          </div>

          <button
            className="formador-modal__filter-button"
            onClick={toggleFilters}
          >
            <i className="fas fa-filter formador-modal__filter-icon"></i>
            <span>Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="formador-modal__filter-options">
            <div className="formador-modal__filter-group">
              <label className="formador-modal__filter-label">Ordenar por:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="formador-modal__filter-select"
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
                <option value="cargoAsc">Cargo (Admin primeiro)</option>
                <option value="cargoDesc">Cargo (Admin último)</option>
                <option value="dateAsc">Data de inscrição (Mais antiga)</option>
                <option value="dateDesc">Data de inscrição (Mais recente)</option>
              </select>
            </div>
          </div>
        )}

        <div className="formador-modal__users-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={getUserId(user)}
                className={`formador-modal__user-item ${isFormadorSelected(user) ? 'formador-modal__user-item--selected' : ''
                  } ${isAdministrador(user) ? 'formador-modal__user-item--admin' : ''
                  }`}
                onClick={() => handleToggleFormador(user)}
              >
                <div className="formador-modal__user-avatar">
                  {user.imagem_perfil ? (
                    <img
                      src={user.imagem_perfil}
                      alt={user.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{(user.nome || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="formador-modal__user-info">
                  <div className="formador-modal__user-name">
                    {user.nome}
                    {isAdministrador(user) && (
                      <span className="formador-modal__admin-badge">
                        <i className="fas fa-crown"></i>
                      </span>
                    )}
                  </div>
                  <div className="formador-modal__user-email">{user.email}</div>
                  <div className="formador-modal__user-cargo">
                    <i className="fas fa-user-tag"></i>
                    {getCargoNome(user)}
                  </div>
                </div>
                {isFormadorSelected(user) && (
                  <div className="formador-modal__check-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="formador-modal__no-results">
              <i className="fas fa-search formador-modal__no-results-icon"></i>
              <p>
                {tipoCurso === 'assincrono'
                  ? 'Nenhum administrador encontrado'
                  : searchTerm
                    ? 'Nenhum formador encontrado com os critérios de pesquisa'
                    : 'Nenhum formador disponível'
                }
              </p>
              {tipoCurso === 'assincrono' && (
                <p className="formador-modal__help-text">
                  Verifique se existem utilizadores com cargo de Administrador no sistema.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="formador-modal__footer">
          <button
            className="formador-modal__cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="formador-modal__select-button"
            onClick={handleSelectFormador}
            disabled={tipoCurso === 'assincrono' && selectedFormador && !isAdministrador(selectedFormador)}
          >
            {selectedFormador ? 'Selecionar' : 'Remover Seleção'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormadorModal;