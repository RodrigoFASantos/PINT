import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Simplified version without Material UI or date-fns
const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  // Function to load notifications
  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notificacoes');

      // Sort by creation date (newest first)
      const notificacoesOrdenadas = response.data.sort((a, b) =>
        new Date(b.notificacao.data_criacao) - new Date(a.notificacao.data_criacao)
      );

      setNotificacoes(notificacoesOrdenadas);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError('Não foi possível carregar as notificações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    carregarNotificacoes();

    // Setup socket for new notifications
    if (window.socket) {
      window.socket.on('nova_notificacao', (data) => {
        carregarNotificacoes();
        setMessage(data.mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      });
    }

    return () => {
      if (window.socket) {
        window.socket.off('nova_notificacao');
      }
    };
  }, []);

  // Mark notification as read
  const marcarComoLida = async (idNotificacao) => {
    try {
      await axios.put(`/api/notificacoes/${idNotificacao}/lida`);

      // Update local state
      setNotificacoes(prevNotificacoes =>
        prevNotificacoes.map(notif =>
          notif.id_notificacao === idNotificacao
            ? { ...notif, lida: true }
            : notif
        )
      );

      setMessage('Notificação marcada como lida');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);

      // Reload unread notifications count
      if (window.atualizarContagemNotificacoes) {
        window.atualizarContagemNotificacoes();
      }
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      setMessage('Erro ao marcar notificação como lida');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  // Mark all notifications as read
  const marcarTodasComoLidas = async () => {
    try {
      await axios.put('/api/notificacoes/marcar-todas-como-lidas');

      // Update local state
      setNotificacoes(prevNotificacoes =>
        prevNotificacoes.map(notif => ({ ...notif, lida: true }))
      );

      setMessage('Todas as notificações foram marcadas como lidas');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      setMessage('Erro ao marcar todas notificações como lidas');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  // Navigate to related item
  const navegarParaItem = (notificacao) => {
    const { tipo, id_referencia } = notificacao.notificacao;

    if (tipo === 'curso_adicionado' || tipo === 'formador_alterado' || tipo === 'data_curso_alterada') {
      navigate(`/cursos/${id_referencia}`);
    } else if (tipo === 'formador_criado') {
      navigate(`/formadores/${id_referencia}`);
    } else if (tipo === 'admin_criado') {
      navigate(`/admin/users/${id_referencia}`);
    }
  };

  // Get notification icon type (text-based for now)
  const getNotificacaoIconText = (tipo) => {
    switch (tipo) {
      case 'curso_adicionado':
        return '📚';
      case 'formador_alterado':
        return '✏️';
      case 'formador_criado':
        return '👤';
      case 'admin_criado':
        return '👑';
      case 'data_curso_alterada':
        return '📅';
      default:
        return '🔔';
    }
  };

  // Format date as relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'há poucos segundos';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
  };

  // Count unread notifications
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>
          Notificações {notificacoesNaoLidas > 0 && <span style={{ 
            background: 'red', 
            color: 'white', 
            borderRadius: '50%', 
            padding: '2px 8px',
            fontSize: '14px',
            marginLeft: '10px'
          }}>
            {notificacoesNaoLidas}
          </span>}
        </h1>

        {notificacoesNaoLidas > 0 && (
          <button 
            onClick={marcarTodasComoLidas}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <p>Carregando notificações...</p>
      ) : error ? (
        <div style={{ 
          background: '#ffe0e0', 
          color: '#d32f2f', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '16px' 
        }}>
          {error}
        </div>
      ) : notificacoes.length === 0 ? (
        <div style={{ 
          background: '#e3f2fd', 
          color: '#0d47a1', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '16px' 
        }}>
          Você não tem notificações.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notificacoes.map((notificacao) => (
            <li key={notificacao.id_notificacao} style={{
              background: notificacao.lida ? 'transparent' : '#f5f5f5',
              padding: '16px',
              marginBottom: '8px',
              borderRadius: '4px',
              borderBottom: '1px solid #eee',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '24px', marginRight: '16px' }}>
                  {getNotificacaoIconText(notificacao.notificacao.tipo)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    fontWeight: notificacao.lida ? 'normal' : 'bold'
                  }}>
                    {notificacao.notificacao.titulo}
                  </h3>
                  <p style={{ margin: '0 0 8px 0' }}>{notificacao.notificacao.mensagem}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ color: '#777' }}>
                      {formatRelativeTime(notificacao.notificacao.data_criacao)}
                    </small>
                    {notificacao.notificacao.id_referencia && (
                      <button
                        onClick={() => navegarParaItem(notificacao)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#1976d2',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>
                </div>
                {!notificacao.lida && (
                  <button
                    onClick={() => marcarComoLida(notificacao.id_notificacao)}
                    title="Marcar como lida"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ✓
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Simple message toast */}
      {showMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#333',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Notificacoes;