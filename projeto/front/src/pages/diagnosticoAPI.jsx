import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../api';

/**
 * Componente para diagnóstico e teste das rotas da API
 * Permite verificar se as ligações estão a funcionar correctamente
 */
const DiagnosticoAPI = () => {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testarAPI = async () => {
      try {
        // Obter token de autenticação do armazenamento local
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Token não encontrado. Faça login novamente.');
          setLoading(false);
          return;
        }
        
        // Testar rota raiz da API
        const rotaRaiz = await axios.get(`${API_BASE}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => ({ error: e }));
        
        // Testar rota de utilizadores
        const rotaUsers = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => ({ error: e }));

        // Testar rota alternativa
        const rotaAlternativa = await axios.get(`${API_BASE}/users/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => ({ error: e }));

        // Compilar resultados do diagnóstico
        setResultado({
          api_base: API_BASE,
          rota_raiz: rotaRaiz.error ? 'Erro' : 'OK',
          rota_raiz_data: rotaRaiz.error ? rotaRaiz.error.message : JSON.stringify(rotaRaiz.data),
          rota_users: rotaUsers.error ? 'Erro' : 'OK',
          rota_users_data: rotaUsers.error ? rotaUsers.error.message : JSON.stringify(rotaUsers.data),
          rota_alternativa: rotaAlternativa.error ? 'Erro' : 'OK',
          rota_alternativa_data: rotaAlternativa.error ? rotaAlternativa.error.message : JSON.stringify(rotaAlternativa.data),
          token_presente: !!token
        });
        
        setLoading(false);
      } catch (err) {
        setError(`Erro geral: ${err.message}`);
        setLoading(false);
      }
    };

    testarAPI();
  }, []);

  /**
   * Formatar resposta JSON para exibição, truncando se necessário
   */
  const formatarJSON = (jsonString) => {
    try {
      if (jsonString.length > 500) {
        return jsonString.substring(0, 500) + '... (truncado)';
      }
      return jsonString;
    } catch (e) {
      return jsonString;
    }
  };

  if (loading) {
    return <div>Realizando diagnóstico da API...</div>;
  }

  if (error) {
    return <div className="erro-diagnostico">{error}</div>;
  }

  return (
    <div className="diagnostico-container">
      <h2>Diagnóstico da API</h2>
      
      <div className="diagnostico-item">
        <strong>API Base:</strong> {resultado.api_base}
      </div>
      
      <div className="diagnostico-item">
        <strong>Token presente:</strong> {resultado.token_presente ? 'Sim' : 'Não'}
      </div>
      
      <div className="diagnostico-item">
        <strong>Rota Raiz (/api):</strong> {resultado.rota_raiz}
        <div className="diagnostico-data">
          {formatarJSON(resultado.rota_raiz_data)}
        </div>
      </div>
      
      <div className="diagnostico-item">
        <strong>Rota Users (/api/users):</strong> {resultado.rota_users}
        <div className="diagnostico-data">
          {formatarJSON(resultado.rota_users_data)}
        </div>
      </div>
      
      <div className="diagnostico-item">
        <strong>Rota Alternativa (/api/users/all):</strong> {resultado.rota_alternativa}
        <div className="diagnostico-data">
          {formatarJSON(resultado.rota_alternativa_data)}
        </div>
      </div>
      
      <div className="diagnostico-conclusao">
        <h3>Diagnóstico:</h3>
        {resultado.rota_users === 'OK' ? 
          <p>A API está a responder correctamente, mas o formato da resposta pode não ser compatível com o componente.</p> :
          <p>Há um problema na comunicação com a API. Verifique as credenciais e as permissões de acesso.</p>
        }
      </div>
    </div>
  );
};

export default DiagnosticoAPI;