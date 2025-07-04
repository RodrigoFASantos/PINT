const webpush = require("web-push");
require("dotenv").config();

/**
 * Serviço de notificações push nativas para navegadores
 * 
 * Implementa sistema completo de push notifications usando Web Push API
 * e protocolo VAPID. Permite enviar alertas mesmo quando utilizadores
 * não estão ativamente na aplicação.
 */

// Validar e configurar chaves VAPID durante inicialização
if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  console.warn('⚠️ [PUSH] Chaves VAPID não configuradas - notificações push desativadas');
  console.log('ℹ️ [PUSH] Para ativar: define PUBLIC_VAPID_KEY e PRIVATE_VAPID_KEY no ficheiro .env');
} else {
  try {
    // Configurar autenticação VAPID para o serviço
    webpush.setVapidDetails(
      process.env.ADMIN_EMAIL ? `mailto:${process.env.ADMIN_EMAIL}` : 'mailto:admin@exemplo.com',
      process.env.PUBLIC_VAPID_KEY,
      process.env.PRIVATE_VAPID_KEY
    );
    console.log('✅ [PUSH] Serviço de notificações push inicializado com sucesso');
  } catch (error) {
    console.error('❌ [PUSH] Erro ao configurar notificações push:', error.message);
  }
}

/**
 * Valida estrutura da subscrição recebida do navegador
 * 
 * Verifica se contém todos os campos obrigatórios para envio seguro.
 * 
 * @param {Object} subscription - Objeto de subscrição do browser
 * @returns {Object} Resultado da validação com flag e mensagem de erro
 */
const validarSubscription = (subscription) => {
  if (!subscription) {
    return { valido: false, erro: 'Subscrição não fornecida' };
  }
  
  if (!subscription.endpoint) {
    return { valido: false, erro: 'Endpoint em falta na subscrição' };
  }
  
  if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return { valido: false, erro: 'Chaves de encriptação em falta na subscrição' };
  }
  
  return { valido: true };
};

/**
 * Cria payload estruturado para notificação push
 * 
 * Gera objeto de notificação com configurações otimizadas para
 * diferentes tipos de alertas e contextos.
 * 
 * @param {string} titulo - Título principal da notificação
 * @param {string} corpo - Texto do corpo da notificação
 * @param {Object} dadosExtras - Configurações e dados adicionais
 * @returns {string} JSON payload pronto para envio
 */
const criarPayloadNotificacao = (titulo, corpo, dadosExtras = {}) => {
  // Configuração base da notificação
  const notificacao = {
    title: titulo,
    body: corpo,
    icon: dadosExtras.icon || '/logo.png',
    badge: dadosExtras.badge || '/badge.png',
    image: dadosExtras.image || null,
    vibrate: dadosExtras.vibrate || [100, 50, 100], // Padrão de vibração
    tag: dadosExtras.tag || `notif-${Date.now()}`,   // Tag para agrupamento
    renotify: dadosExtras.renotify || false,
    requireInteraction: dadosExtras.requireInteraction || false,
    silent: dadosExtras.silent || false,
    timestamp: Date.now(),
    data: {
      url: dadosExtras.url || '/',
      id: dadosExtras.id || null,
      tipo: dadosExtras.tipo || 'geral',
      ...dadosExtras.data
    }
  };
  
  // Adicionar ações interativas se fornecidas (máximo 2)
  if (dadosExtras.actions && Array.isArray(dadosExtras.actions)) {
    notificacao.actions = dadosExtras.actions.slice(0, 2);
  }
  
  return JSON.stringify({ notification: notificacao });
};

/**
 * Envia notificação push para utilizador específico
 * 
 * Processa envio individual com validação completa e tratamento
 * de diferentes tipos de erros para debugging adequado.
 * 
 * @param {Object} subscription - Subscrição do utilizador alvo
 * @param {string} titulo - Título da notificação
 * @param {string} corpo - Corpo da notificação
 * @param {Object} dadosExtras - Configurações adicionais
 * @returns {Promise<Object>} Resultado do envio com status e detalhes
 */
const sendPushNotification = async (subscription, titulo, corpo, dadosExtras = {}) => {
  // Validar parâmetros obrigatórios
  if (!titulo || !corpo) {
    console.error('❌ [PUSH] Título e corpo são obrigatórios para notificação push');
    return { success: false, error: 'Título e corpo obrigatórios' };
  }
  
  const validacao = validarSubscription(subscription);
  if (!validacao.valido) {
    console.error('❌ [PUSH] Subscrição inválida:', validacao.erro);
    return { success: false, error: validacao.erro };
  }
  
  try {
    console.log('📤 [PUSH] A enviar notificação:', titulo);
    
    // Criar payload estruturado da notificação
    const payload = criarPayloadNotificacao(titulo, corpo, dadosExtras);
    
    // Configurações de envio otimizadas
    const opcoes = {
      vapidDetails: {
        subject: process.env.ADMIN_EMAIL ? `mailto:${process.env.ADMIN_EMAIL}` : 'mailto:admin@exemplo.com',
        publicKey: process.env.PUBLIC_VAPID_KEY,
        privateKey: process.env.PRIVATE_VAPID_KEY
      },
      TTL: dadosExtras.ttl || 24 * 60 * 60,        // 24 horas por defeito
      urgency: dadosExtras.urgency || 'normal',     // low, normal, high
      topic: dadosExtras.topic || null             // Para substituir notificações anteriores
    };
    
    // Enviar através do serviço web push
    const resultado = await webpush.sendNotification(subscription, payload, opcoes);
    
    console.log('✅ [PUSH] Notificação enviada com sucesso');
    return { 
      success: true, 
      statusCode: resultado.statusCode,
      headers: resultado.headers 
    };
    
  } catch (error) {
    console.error('❌ [PUSH] Erro ao enviar notificação:', error.message);
    
    // Análise detalhada do tipo de erro
    let tipoErro = 'unknown';
    let mensagemErro = error.message;
    
    if (error.statusCode === 410) {
      tipoErro = 'expired';
      mensagemErro = 'Subscrição expirada - deve ser removida da base de dados';
    } else if (error.statusCode === 413) {
      tipoErro = 'payload_too_large';
      mensagemErro = 'Payload da notificação demasiado grande';
    } else if (error.statusCode === 429) {
      tipoErro = 'rate_limit';
      mensagemErro = 'Rate limit excedido - aguardar antes de tentar novamente';
    } else if (error.statusCode >= 400 && error.statusCode < 500) {
      tipoErro = 'client_error';
      mensagemErro = 'Erro do cliente - verificar subscrição';
    } else if (error.statusCode >= 500) {
      tipoErro = 'server_error';
      mensagemErro = 'Erro do servidor push - tentar novamente mais tarde';
    }
    
    return { 
      success: false, 
      error: mensagemErro, 
      type: tipoErro,
      statusCode: error.statusCode 
    };
  }
};

/**
 * Envia notificações push para múltiplos utilizadores
 * 
 * Processa envios em lote com gestão de concorrência e relatórios
 * detalhados. Identifica subscrições expiradas para limpeza.
 * 
 * @param {Array} subscriptions - Lista de subscrições de utilizadores
 * @param {string} titulo - Título da notificação
 * @param {string} corpo - Corpo da notificação
 * @param {Object} dadosExtras - Configurações adicionais
 * @returns {Promise<Object>} Relatório completo do envio em lote
 */
const sendNotificationToMany = async (subscriptions, titulo, corpo, dadosExtras = {}) => {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    console.warn('⚠️ [PUSH] Lista de subscrições vazia ou inválida');
    return { success: false, error: 'Lista de subscrições inválida' };
  }
  
  console.log(`📤 [PUSH] A enviar notificação para ${subscriptions.length} utilizadores...`);
  
  const resultados = [];
  const erros = [];
  const subscriptionsExpiradas = [];
  
  // Configurar limite de concorrência para evitar sobrecarga
  const LIMITE_CONCORRENCIA = 10;
  const chunks = [];
  
  // Dividir subscrições em grupos menores
  for (let i = 0; i < subscriptions.length; i += LIMITE_CONCORRENCIA) {
    chunks.push(subscriptions.slice(i, i + LIMITE_CONCORRENCIA));
  }
  
  // Processar cada chunk sequencialmente
  for (const chunk of chunks) {
    const promessasChunk = chunk.map(async (subscription, index) => {
      try {
        const resultado = await sendPushNotification(subscription, titulo, corpo, dadosExtras);
        
        if (resultado.success) {
          return { subscription, success: true, index };
        } else {
          // Identificar subscrições expiradas
          if (resultado.type === 'expired') {
            subscriptionsExpiradas.push(subscription);
          }
          
          erros.push({
            subscription,
            error: resultado.error,
            type: resultado.type,
            statusCode: resultado.statusCode
          });
          
          return { subscription, success: false, error: resultado.error };
        }
      } catch (error) {
        erros.push({
          subscription,
          error: error.message,
          type: 'exception'
        });
        
        return { 
          subscription, 
          success: false, 
          error: error.message 
        };
      }
    });
    
    // Aguardar conclusão do chunk atual
    const resultadosChunk = await Promise.all(promessasChunk);
    resultados.push(...resultadosChunk);
    
    // Pausa entre chunks para evitar rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Compilar estatísticas finais
  const sucessos = resultados.filter(r => r.success).length;
  const falhas = resultados.filter(r => !r.success).length;
  
  console.log(`📊 [PUSH] Resultados do envio em lote:`);
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Falhas: ${falhas}`);
  console.log(`   🗑️ Subscrições expiradas: ${subscriptionsExpiradas.length}`);
  
  return {
    success: sucessos > 0,
    total: subscriptions.length,
    sucessos,
    falhas,
    subscriptionsExpiradas,
    resultados,
    erros: erros.length > 0 ? erros : undefined
  };
};

/**
 * Template especializado para notificações de curso atualizado
 * 
 * Cria notificação formatada para alterações em cursos com
 * ações interativas e dados contextuais.
 * 
 * @param {Array} subscriptions - Subscrições dos utilizadores alvo
 * @param {string} nomeCurso - Nome do curso alterado
 * @param {string} tipoAlteracao - Tipo específico de alteração
 * @param {Object} detalhes - Detalhes adicionais da alteração
 * @returns {Promise<Object>} Resultado do envio
 */
const notificarCursoAtualizado = async (subscriptions, nomeCurso, tipoAlteracao, detalhes = {}) => {
  const titulo = `Curso Atualizado: ${nomeCurso}`;
  let corpo = '';
  
  // Personalizar mensagem baseada no tipo de alteração
  switch (tipoAlteracao) {
    case 'formador_alterado':
      corpo = `O formador do curso foi alterado`;
      break;
    case 'data_alterada':
      corpo = `As datas do curso foram alteradas`;
      break;
    case 'conteudo_adicionado':
      corpo = `Novo conteúdo foi adicionado ao curso`;
      break;
    case 'informacoes_gerais':
      corpo = `Informações do curso foram atualizadas`;
      break;
    default:
      corpo = `O curso foi atualizado`;
  }
  
  const dadosExtras = {
    icon: '/icons/curso.png',
    tag: `curso-${detalhes.idCurso}`,
    url: `/cursos/${detalhes.idCurso}`,
    tipo: 'curso_atualizado',
    requireInteraction: true, // Requer interação do utilizador
    data: {
      idCurso: detalhes.idCurso,
      tipoAlteracao,
      ...detalhes
    },
    actions: [
      {
        action: 'ver_curso',
        title: 'Ver Curso'
      },
      {
        action: 'dispensar',
        title: 'Dispensar'
      }
    ]
  };
  
  return await sendNotificationToMany(subscriptions, titulo, corpo, dadosExtras);
};

/**
 * Template especializado para notificações de novo curso
 * 
 * Anuncia novos cursos com formatação específica e ações de inscrição.
 * 
 * @param {Array} subscriptions - Subscrições dos utilizadores alvo
 * @param {string} nomeCurso - Nome do novo curso
 * @param {string} categoria - Categoria do curso
 * @param {Object} detalhes - Detalhes adicionais do curso
 * @returns {Promise<Object>} Resultado do envio
 */
const notificarNovoCurso = async (subscriptions, nomeCurso, categoria, detalhes = {}) => {
  const titulo = 'Novo Curso Disponível';
  const corpo = `${nomeCurso} está agora disponível na categoria ${categoria}`;
  
  const dadosExtras = {
    icon: '/icons/novo-curso.png',
    tag: `novo-curso-${detalhes.idCurso}`,
    url: `/cursos/${detalhes.idCurso}`,
    tipo: 'novo_curso',
    requireInteraction: true, // Importante para novos cursos
    vibrate: [200, 100, 200], // Vibração mais notável
    data: {
      idCurso: detalhes.idCurso,
      categoria,
      ...detalhes
    },
    actions: [
      {
        action: 'ver_curso',
        title: 'Ver Curso'
      },
      {
        action: 'inscrever',
        title: 'Inscrever-me'
      }
    ]
  };
  
  return await sendNotificationToMany(subscriptions, titulo, corpo, dadosExtras);
};

/**
 * Função de teste para verificar configuração push
 * 
 * Útil para debugging e verificação de funcionamento.
 * 
 * @param {Object} subscription - Subscrição de teste
 * @returns {Promise<Object>} Resultado do teste
 */
const testarNotificacaoPush = async (subscription) => {
  const titulo = 'Teste de Notificação';
  const corpo = 'Esta é uma notificação de teste para verificar a configuração push';
  
  const dadosExtras = {
    tag: 'teste-push',
    icon: '/icons/teste.png',
    tipo: 'teste',
    vibrate: [100, 50, 100, 50, 100] // Padrão de teste
  };
  
  return await sendPushNotification(subscription, titulo, corpo, dadosExtras);
};

/**
 * Gera chaves VAPID para configuração inicial
 * 
 * Função auxiliar para setup quando não há chaves configuradas.
 * 
 * @returns {Object|null} Chaves VAPID geradas ou null se erro
 */
const gerarChavesVAPID = () => {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    
    console.log('🔑 [PUSH] Novas chaves VAPID geradas:');
    console.log('PUBLIC_VAPID_KEY=', vapidKeys.publicKey);
    console.log('PRIVATE_VAPID_KEY=', vapidKeys.privateKey);
    console.log('⚠️ [PUSH] Guarda estas chaves no ficheiro .env com segurança');
    
    return vapidKeys;
  } catch (error) {
    console.error('❌ [PUSH] Erro ao gerar chaves VAPID:', error.message);
    return null;
  }
};

module.exports = {
  // Funções principais de envio
  sendPushNotification,
  sendNotificationToMany,
  
  // Templates especializados por tipo de notificação
  notificarCursoAtualizado,
  notificarNovoCurso,
  
  // Funções auxiliares e utilitárias
  testarNotificacaoPush,
  gerarChavesVAPID,
  validarSubscription,
  criarPayloadNotificacao
};