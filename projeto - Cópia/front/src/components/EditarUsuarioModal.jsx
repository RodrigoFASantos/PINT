import React, { useState } from 'react';
import axios from 'axios';
import './css/EditarUsuarioModal.css';

const EditarUsuarioModal = ({ usuario, onClose, onSuccess }) => {
  const [nome, setNome] = useState(usuario.nome || '');
  const [email, setEmail] = useState(usuario.email || '');
  const [perfil, setPerfil] = useState(usuario.perfil || '');
  const [departamento, setDepartamento] = useState(usuario.departamento || '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      setErro('O nome é obrigatório.');
      return;
    }
    
    if (!email.trim()) {
      setErro('O email é obrigatório.');
      return;
    }
    
    if (!perfil) {
      setErro('O perfil é obrigatório.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin/usuarios/${usuario.id}`, 
        { 
          nome,
          email,
          perfil,
          departamento
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess(response.data);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar usuário. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="editar-usuario-overlay">
      <div className="editar-usuario-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Editar Usuário</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="perfil">Perfil:</label>
            <select
              id="perfil"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              <option value="formando">Formando</option>
              <option value="formador">Formador</option>
              <option value="gestor">Gestor</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="departamento">Departamento:</label>
            <input
              type="text"
              id="departamento"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            />
          </div>
          
          {erro && <p className="erro-message">{erro}</p>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancelar-btn"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="confirmar-btn"
              disabled={enviando}
            >
              {enviando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuarioModal;