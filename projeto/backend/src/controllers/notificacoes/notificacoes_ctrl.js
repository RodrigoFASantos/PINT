const Notificacao = require('../../database/models/Notificacao');
const NotificacaoUtilizador = require('../../database/models/NotificacaoUtilizador');
const User = require('../../database/models/User');
const Curso = require('../../database/models/Curso');
const Inscricao_Curso = require('../../database/models/Inscricao_Curso');
const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const { Op } = require('sequelize');

/**
 * Controlador completo para sistema de notificações em tempo real
 * 
 * Gere todo o sistema de notificações da plataforma, desde consultas
 * pessoais até criação automática de alertas para eventos do sistema.
 */

/**
 * Obtém histórico completo de notificações do utilizador autenticado
 * 
 * Lista todas as notificações dirigidas ao utilizador atual com
 * estado de leitura e dados da notificação original.
 * 
 * @param {Object} req - Requisição Express com utilizador autenticado
 * @param {Object} res - Resposta Express com lista de notificações
 */
const getNotificacoesUtilizador = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    console.log(`📖 [NOTIF] A carregar histórico de notificações para utilizador ${idUtilizador}`);
    
    const notificacoes = await NotificacaoUtilizador.findAll({
      where: { id_utilizador: idUtilizador },
      include: [
        { 
          model: Notificacao, 
          as: 'notificacao',
          required: true // INNER JOIN para garantir dados da notificação
        }
      ],
      order: [
        [{ model: Notificacao, as: 'notificacao' }, 'data_criacao', 'DESC']
      ]
    });
    
    console.log(`✅ [NOTIF] ${notificacoes.length} notificações carregadas para utilizador ${idUtilizador}`);
    
    // Debug: mostrar estrutura das notificações encontradas
    if (process.env.NODE_ENV === 'development' && notificacoes.length > 0) {
      console.log('🔍 [NOTIF] Estrutura da primeira notificação:', JSON.stringify(notificacoes[0], null, 2));
    }
    
    return res.status(200).json(notificacoes);
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao obter notificações:', error.message);
    console.error('📋 [NOTIF] Stack trace:', error.stack);
    return res.status(500).json({ 
      message: 'Erro ao obter notificações',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Marca notificação específica como lida
 * 
 * Atualiza estado individual e regista timestamp de leitura
 * para auditoria e estatísticas de engagement.
 * 
 * @param {Object} req - Requisição com ID da notificação nos parâmetros
 * @param {Object} res - Resposta Express com confirmação
 */
const marcarComoLida = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    const { id_notificacao } = req.params;
    
    console.log(`✓ [NOTIF] A marcar notificação ${id_notificacao} como lida para utilizador ${idUtilizador}`);
    
    const notificacaoUtilizador = await NotificacaoUtilizador.findOne({
      where: { id_utilizador: idUtilizador, id_notificacao }
    });
    
    if (!notificacaoUtilizador) {
      console.warn(`⚠️ [NOTIF] Notificação ${id_notificacao} não encontrada para utilizador ${idUtilizador}`);
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }
    
    // Atualizar estado e timestamp de leitura
    notificacaoUtilizador.lida = true;
    notificacaoUtilizador.data_leitura = new Date();
    await notificacaoUtilizador.save();
    
    console.log(`✅ [NOTIF] Notificação ${id_notificacao} marcada como lida`);
    return res.status(200).json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao marcar notificação como lida:', error.message);
    return res.status(500).json({ 
      message: 'Erro ao marcar notificação como lida',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Marca todas as notificações como lidas
 * 
 * Operação em lote otimizada para limpar todas as notificações
 * pendentes do utilizador.
 * 
 * @param {Object} req - Requisição Express com utilizador autenticado
 * @param {Object} res - Resposta Express com estatísticas da operação
 */
const marcarTodasComoLidas = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    console.log(`✓ [NOTIF] A marcar todas as notificações como lidas para utilizador ${idUtilizador}`);
    
    // Atualização em lote para melhor performance
    const [numAtualizadas] = await NotificacaoUtilizador.update(
      { lida: true, data_leitura: new Date() },
      { where: { id_utilizador: idUtilizador, lida: false } }
    );
    
    console.log(`✅ [NOTIF] ${numAtualizadas} notificações marcadas como lidas para utilizador ${idUtilizador}`);
    return res.status(200).json({ 
      message: 'Todas as notificações marcadas como lidas',
      notificacoesAtualizadas: numAtualizadas
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao marcar todas como lidas:', error.message);
    return res.status(500).json({ 
      message: 'Erro ao marcar notificações',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Obtém contagem de notificações não lidas
 * 
 * Endpoint otimizado para badges e indicadores visuais.
 * Retorna apenas o número para atualizações frequentes.
 * 
 * @param {Object} req - Requisição Express com utilizador autenticado
 * @param {Object} res - Resposta Express com contagem
 */
const getNotificacoesNaoLidasContagem = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    
    const count = await NotificacaoUtilizador.count({
      where: { id_utilizador: idUtilizador, lida: false }
    });
    
    console.log(`📊 [NOTIF] ${count} notificações não lidas para utilizador ${idUtilizador}`);
    return res.status(200).json({ count });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao obter contagem:', error.message);
    return res.status(500).json({ 
      message: 'Erro ao obter contagem de notificações',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Cria notificação central e distribui a múltiplos destinatários
 * 
 * Função nuclear que cria a notificação base e distribui
 * automaticamente através da tabela de relacionamento.
 * 
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Conteúdo detalhado
 * @param {string} tipo - Categoria da notificação
 * @param {number} idReferencia - ID do objeto relacionado
 * @param {Array} destinatarios - Array de IDs de utilizadores alvo
 * @returns {Promise<Object>} Resultado com notificação e associações
 */
const criarEAssociarNotificacao = async (titulo, mensagem, tipo, idReferencia, destinatarios) => {
  try {
    console.log(`📤 [NOTIF] A criar notificação "${titulo}" para ${destinatarios.length} destinatários`);
    
    // Criar registo central da notificação
    const notificacao = await Notificacao.create({
      titulo,
      mensagem,
      tipo,
      id_referencia: idReferencia,
      data_criacao: new Date(),
      enviado_email: false // Para sistema futuro de envio por email
    });

    console.log(`✅ [NOTIF] Notificação central criada com ID ${notificacao.id_notificacao}`);

    // Criar associações individuais para cada destinatário
    const associacoesPromises = destinatarios.map(async (idUtilizador) => {
      try {
        const novaAssociacao = await NotificacaoUtilizador.create({
          id_notificacao: notificacao.id_notificacao,
          id_utilizador: idUtilizador,
          lida: false,
          data_leitura: null
        });

        console.log(`✓ [NOTIF] Associação criada para utilizador ${idUtilizador}`);
        return novaAssociacao;
      } catch (error) {
        console.error(`❌ [NOTIF] Erro ao associar para utilizador ${idUtilizador}:`, error.message);
        return null; // Continuar com outros destinatários
      }
    });

    // Aguardar criação de todas as associações
    const associacoes = await Promise.all(associacoesPromises);
    const associacoesSucesso = associacoes.filter(a => a !== null);

    console.log(`✅ [NOTIF] ${associacoesSucesso.length}/${destinatarios.length} associações criadas com sucesso`);

    return {
      notificacao,
      associacoes: associacoesSucesso
    };
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao criar e associar notificação:', error.message);
    throw error;
  }
};

/**
 * Envia notificação push instantânea via WebSocket
 * 
 * Transmite alertas em tempo real para utilizadores ligados,
 * complementando o sistema de persistência na base de dados.
 * 
 * @param {Object} io - Instância do Socket.IO do servidor
 * @param {number} id_utilizador - ID do utilizador destinatário
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Conteúdo da mensagem
 * @param {string} tipo - Tipo da notificação
 * @param {Object} dados - Dados adicionais contextuais
 */
const enviarPushNotification = async (io, id_utilizador, titulo, mensagem, tipo, dados = {}) => {
  try {
    if (io && io.to) {
      console.log(`📡 [NOTIF] A enviar push WebSocket para utilizador ${id_utilizador}`);
      
      // Enviar para sala específica do utilizador
      io.to(`user_${id_utilizador}`).emit('nova_notificacao', {
        titulo,
        mensagem,
        tipo,
        data: new Date(),
        ...dados
      });
      
      console.log(`✅ [NOTIF] Push WebSocket enviado com sucesso para utilizador ${id_utilizador}`);
    } else {
      console.warn('⚠️ [NOTIF] WebSocket não disponível - apenas persistência na BD');
    }
  } catch (error) {
    console.error('❌ [NOTIF] Erro no push WebSocket:', error.message);
    // Não falhar por erros de WebSocket
  }
};

/**
 * Notifica criação de novo administrador (alerta de segurança)
 * 
 * Envia alerta crítico para todos os administradores existentes
 * sobre mudanças nas permissões administrativas.
 * 
 * @param {Object} req - Requisição com dados do novo administrador
 * @param {Object} res - Resposta Express com resultado
 */
const adminCriado = async (req, res) => {
  try {
    const { id_admin, nome_admin } = req.body;

    if (!id_admin || !nome_admin) {
      console.warn('⚠️ [NOTIF] Dados insuficientes para notificação de admin criado');
      return res.status(400).json({
        success: false,
        message: "ID e nome do administrador são obrigatórios"
      });
    }

    console.log(`🔐 [NOTIF] A processar criação de administrador: ${nome_admin} (ID: ${id_admin})`);

    // Procurar todos os administradores ativos
    const administradores = await User.findAll({
      where: { id_cargo: 1 }, // Cargo 1 = Administrador
      attributes: ['id_utilizador']
    });

    if (administradores.length === 0) {
      console.log('ℹ️ [NOTIF] Nenhum administrador existente para notificar');
      return res.status(200).json({
        success: true,
        message: "Nenhum administrador para notificar",
        count: 0
      });
    }

    // Excluir o próprio novo administrador da lista
    const destinatarios = administradores
      .filter(admin => admin.id_utilizador !== parseInt(id_admin))
      .map(admin => admin.id_utilizador);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF] Apenas o novo admin existe - nenhuma notificação necessária');
      return res.status(200).json({
        success: true,
        message: "Nenhum outro administrador para notificar",
        count: 0
      });
    }

    // Criar e distribuir notificação de segurança
    const resultado = await criarEAssociarNotificacao(
      "🔐 Novo Administrador Criado",
      `Um novo administrador foi adicionado ao sistema: ${nome_admin}. Verifica se esta alteração foi autorizada.`,
      "admin_criado",
      id_admin,
      destinatarios
    );

    // Enviar notificações push em tempo real
    for (const idUtilizador of destinatarios) {
      await enviarPushNotification(
        req.io,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_admin, nome_admin }
      );
    }

    console.log(`✅ [NOTIF] Notificações de segurança enviadas para ${resultado.associacoes.length} administradores`);
    return res.status(200).json({
      success: true,
      message: "Notificações de segurança enviadas com sucesso",
      count: resultado.associacoes.length
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao processar admin criado:', error.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações de segurança",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Notifica alteração de formador de curso
 * 
 * Informa todos os inscritos sobre mudanças no formador
 * responsável pelo curso.
 * 
 * @param {Object} req - Requisição com dados da alteração
 * @param {Object} res - Resposta Express com resultado
 */
const formadorAlterado = async (req, res) => {
  try {
    const { 
      id_curso, nome_curso, 
      id_formador_antigo, nome_formador_antigo, 
      id_formador_novo, nome_formador_novo 
    } = req.body;

    if (!id_curso || !nome_curso) {
      console.warn('⚠️ [NOTIF] Dados insuficientes para notificação de formador alterado');
      return res.status(400).json({
        success: false,
        message: "ID e nome do curso são obrigatórios"
      });
    }

    console.log(`👨‍🏫 [NOTIF] A processar alteração de formador no curso: ${nome_curso}`);

    // Procurar todos os inscritos ativos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: id_curso,
        estado: 'inscrito' // Apenas inscritos ativos
      },
      attributes: ['id_utilizador']
    });

    if (inscricoes.length === 0) {
      console.log('ℹ️ [NOTIF] Nenhum aluno inscrito para notificar sobre formador');
      return res.status(200).json({
        success: true,
        message: "Nenhum aluno inscrito para notificar",
        count: 0
      });
    }

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    // Construir mensagem detalhada sobre a alteração
    let mensagem = `O formador do curso "${nome_curso}" foi alterado`;
    if (nome_formador_antigo && nome_formador_novo) {
      mensagem += ` de ${nome_formador_antigo} para ${nome_formador_novo}`;
    } else if (nome_formador_novo) {
      mensagem += ` para ${nome_formador_novo}`;
    } else if (nome_formador_antigo) {
      mensagem += `. O formador anterior era ${nome_formador_antigo}`;
    }
    mensagem += '. Consulta os detalhes do curso para mais informações.';

    const resultado = await criarEAssociarNotificacao(
      "👨‍🏫 Alteração de Formador",
      mensagem,
      "formador_alterado",
      id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket
    for (const idUtilizador of destinatarios) {
      await enviarPushNotification(
        req.io,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { 
          id_curso, 
          nome_curso,
          formador_antigo: nome_formador_antigo,
          formador_novo: nome_formador_novo
        }
      );
    }

    console.log(`✅ [NOTIF] Notificações de formador alterado enviadas para ${resultado.associacoes.length} inscritos`);
    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de formador enviadas com sucesso",
      count: resultado.associacoes.length
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao processar formador alterado:', error.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações de formador",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Notifica alteração crítica de datas de curso
 * 
 * Alerta todos os inscritos sobre mudanças no cronograma,
 * permitindo reorganização de agendas pessoais.
 * 
 * @param {Object} req - Requisição com dados das alterações
 * @param {Object} res - Resposta Express com resultado
 */
const dataCursoAlterada = async (req, res) => {
  try {
    const { 
      id_curso, nome_curso, 
      data_inicio_antiga, data_fim_antiga, 
      data_inicio_nova, data_fim_nova 
    } = req.body;

    if (!id_curso || !nome_curso || (!data_inicio_nova && !data_fim_nova)) {
      console.warn('⚠️ [NOTIF] Dados insuficientes para notificação de data alterada');
      return res.status(400).json({
        success: false,
        message: "Dados incompletos para a notificação de datas"
      });
    }

    console.log(`📅 [NOTIF] A processar alteração de datas do curso: ${nome_curso}`);

    // Procurar inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    if (inscricoes.length === 0) {
      console.log('ℹ️ [NOTIF] Nenhum aluno inscrito para notificar sobre datas');
      return res.status(200).json({
        success: true,
        message: "Nenhum aluno inscrito para notificar",
        count: 0
      });
    }

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    // Construir detalhes legíveis das alterações
    let detalhesAlteracao = [];
    if (data_inicio_nova && data_inicio_antiga) {
      const dataInicioAntiga = new Date(data_inicio_antiga).toLocaleDateString('pt-PT');
      const dataInicioNova = new Date(data_inicio_nova).toLocaleDateString('pt-PT');
      detalhesAlteracao.push(`data de início de ${dataInicioAntiga} para ${dataInicioNova}`);
    }
    if (data_fim_nova && data_fim_antiga) {
      const dataFimAntiga = new Date(data_fim_antiga).toLocaleDateString('pt-PT');
      const dataFimNova = new Date(data_fim_nova).toLocaleDateString('pt-PT');
      detalhesAlteracao.push(`data de fim de ${dataFimAntiga} para ${dataFimNova}`);
    }

    const mensagem = `As datas do curso "${nome_curso}" foram alteradas: ${detalhesAlteracao.join(' e ')}. Por favor, ajusta a tua agenda conforme necessário.`;

    const resultado = await criarEAssociarNotificacao(
      "📅 Alteração nas Datas do Curso",
      mensagem,
      "data_curso_alterada",
      id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket
    for (const idUtilizador of destinatarios) {
      await enviarPushNotification(
        req.io,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { 
          id_curso, 
          nome_curso,
          data_inicio_antiga,
          data_fim_antiga,
          data_inicio_nova,
          data_fim_nova
        }
      );
    }

    console.log(`✅ [NOTIF] Notificações de data alterada enviadas para ${resultado.associacoes.length} inscritos`);
    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de datas enviadas com sucesso",
      count: resultado.associacoes.length
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao processar data alterada:', error.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações de datas",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Notifica criação de novo curso
 * 
 * Informa utilizadores relevantes sobre disponibilidade
 * de novos conteúdos formativos.
 * 
 * @param {Object} req - Requisição com dados do novo curso
 * @param {Object} res - Resposta Express com resultado
 */
const cursoCriado = async (req, res) => {
  try {
    const { id_curso, nome_curso, id_categoria, id_area } = req.body;

    if (!id_curso || !nome_curso) {
      console.warn('⚠️ [NOTIF] Dados insuficientes para notificação de curso criado');
      return res.status(400).json({
        success: false,
        message: "ID e nome do curso são obrigatórios"
      });
    }

    console.log(`📚 [NOTIF] A processar criação de curso: ${nome_curso}`);

    // Estratégia simplificada: notificar administradores e formadores
    const administradores = await User.findAll({
      where: { id_cargo: 1 }, // Cargo 1 = Administrador
      attributes: ['id_utilizador']
    });

    // Procurar formadores de forma simples
    let formadores = [];
    try {
      formadores = await User.findAll({
        where: { id_cargo: 2 }, // Cargo 2 = Formador
        attributes: ['id_utilizador']
      });
      console.log(`✓ [NOTIF] ${formadores.length} formadores encontrados`);
    } catch (formadorError) {
      console.warn('⚠️ [NOTIF] Erro ao procurar formadores (continuando só com admins):', formadorError.message);
      formadores = [];
    }

    console.log(`✓ [NOTIF] ${administradores.length} administradores encontrados`);

    // Combinar destinatários evitando duplicatas
    const formadoresIds = formadores.map(f => f.id_utilizador);
    const adminsIds = administradores.map(a => a.id_utilizador);

    const destinatariosSet = new Set([...formadoresIds, ...adminsIds]);
    const destinatarios = Array.from(destinatariosSet);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF] Nenhum destinatário encontrado para notificação de novo curso');
      return res.status(200).json({
        success: true,
        message: "Nenhum destinatário encontrado",
        count: 0
      });
    }

    // Criar e distribuir notificação
    const resultado = await criarEAssociarNotificacao(
      "📚 Novo Curso Disponível",
      `Um novo curso foi criado: "${nome_curso}". Consulta os detalhes e considera divulgá-lo aos interessados.`,
      "curso_adicionado",
      id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket
    for (const idUtilizador of destinatarios) {
      await enviarPushNotification(
        req.io,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_curso, nome_curso, id_categoria, id_area }
      );
    }

    console.log(`✅ [NOTIF] Notificações de novo curso enviadas para ${resultado.associacoes.length} utilizadores`);
    return res.status(200).json({
      success: true,
      message: `Notificações de novo curso enviadas com sucesso para ${resultado.associacoes.length} utilizadores`,
      count: resultado.associacoes.length
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao processar curso criado:', error.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações de novo curso",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Notifica alterações gerais do curso
 * 
 * Informa todos os inscritos sobre mudanças nos dados como
 * nome, descrição, tipo, duração, etc.
 * 
 * @param {Object} req - Requisição com dados das alterações
 * @param {Object} res - Resposta Express com resultado
 */
const cursoAlterado = async (req, res) => {
  try {
    const { 
      id_curso, 
      nome_curso, 
      alteracoes
    } = req.body;

    if (!id_curso || !nome_curso || !alteracoes || alteracoes.length === 0) {
      console.warn('⚠️ [NOTIF] Dados insuficientes para notificação de curso alterado');
      return res.status(400).json({
        success: false,
        message: "Dados incompletos para a notificação de alterações"
      });
    }

    console.log(`✏️ [NOTIF] A processar alterações do curso: ${nome_curso} (${alteracoes.length} alterações)`);

    // Procurar inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    if (inscricoes.length === 0) {
      console.log('ℹ️ [NOTIF] Nenhum aluno inscrito para notificar sobre alterações');
      return res.status(200).json({
        success: true,
        message: "Nenhum aluno inscrito para notificar",
        count: 0
      });
    }

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    // Construir mensagem detalhada das alterações
    const detalhesAlteracoes = alteracoes.map(alt => {
      const nomesCampos = {
        nome: 'nome',
        descricao: 'descrição', 
        tipo: 'tipo',
        vagas: 'número de vagas',
        duracao: 'duração',
        id_area: 'área',
        id_categoria: 'categoria',
        id_topico_area: 'tópico'
      };

      const nomeCampo = nomesCampos[alt.campo] || alt.campo;
      
      // Formatação especial para tipos de curso
      if (alt.campo === 'tipo') {
        const tipos = { sincrono: 'Síncrono', assincrono: 'Assíncrono' };
        return `${nomeCampo} alterado de "${tipos[alt.valor_antigo] || alt.valor_antigo}" para "${tipos[alt.valor_novo] || alt.valor_novo}"`;
      }
      
      return `${nomeCampo} alterado de "${alt.valor_antigo}" para "${alt.valor_novo}"`;
    });

    const mensagem = `O curso "${nome_curso}" foi atualizado. Alterações: ${detalhesAlteracoes.join('; ')}. Consulta os detalhes do curso para mais informações.`;

    const resultado = await criarEAssociarNotificacao(
      "✏️ Curso Atualizado",
      mensagem,
      "curso_alterado",
      id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket
    for (const idUtilizador of destinatarios) {
      await enviarPushNotification(
        req.io,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_curso, nome_curso, alteracoes }
      );
    }

    console.log(`✅ [NOTIF] Notificações de curso alterado enviadas para ${resultado.associacoes.length} inscritos`);
    return res.status(200).json({
      success: true,
      message: "Notificações de alteração do curso enviadas com sucesso",
      count: resultado.associacoes.length
    });
  } catch (error) {
    console.error('❌ [NOTIF] Erro ao processar curso alterado:', error.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações de alterações",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

/**
 * Versão interna para notificar novo curso
 * Função utilizada por outros controladores para envio automático
 * 
 * @param {Object} curso - Dados do curso criado
 * @param {Object} io - Instância WebSocket opcional
 * @returns {Promise<Object|null>} Resultado ou null se erro
 */
const notificarNovoCurso = async (curso, io = null) => {
  try {
    console.log(`📚 [NOTIF-INT] A processar notificação interna de novo curso: ${curso.nome}`);
    
    // Procurar administradores
    const administradores = await User.findAll({
      where: { id_cargo: 1 },
      attributes: ['id_utilizador']
    });

    // Procurar formadores
    let formadores = [];
    try {
      formadores = await User.findAll({
        where: { id_cargo: 2 },
        attributes: ['id_utilizador']
      });
      console.log(`✓ [NOTIF-INT] ${formadores.length} formadores encontrados`);
    } catch (error) {
      console.warn('⚠️ [NOTIF-INT] Erro ao procurar formadores (continuando):', error.message);
      formadores = [];
    }

    console.log(`✓ [NOTIF-INT] ${administradores.length} administradores encontrados`);

    // Combinar destinatários únicos
    const formadoresIds = formadores.map(f => f.id_utilizador);
    const adminsIds = administradores.map(a => a.id_utilizador);
    const destinatariosSet = new Set([...formadoresIds, ...adminsIds]);
    const destinatarios = Array.from(destinatariosSet);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhum destinatário encontrado para novo curso interno');
      return null;
    }

    // Criar e distribuir notificação
    const resultado = await criarEAssociarNotificacao(
      "📚 Novo Curso Disponível",
      `Um novo curso foi criado: "${curso.nome}". Consulta os detalhes na plataforma.`,
      "curso_adicionado",
      curso.id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket se disponível
    if (io) {
      for (const idUtilizador of destinatarios) {
        await enviarPushNotification(
          io,
          idUtilizador,
          resultado.notificacao.titulo,
          resultado.notificacao.mensagem,
          resultado.notificacao.tipo,
          { id_curso: curso.id_curso, nome_curso: curso.nome }
        );
      }
    }

    console.log(`✅ [NOTIF-INT] Notificação interna de novo curso processada para ${resultado.associacoes.length} utilizadores`);
    return resultado;
  } catch (error) {
    console.error('❌ [NOTIF-INT] Erro na notificação interna de novo curso:', error.message);
    return null;
  }
};

/**
 * Versão interna para notificar alteração de formador
 * 
 * @param {Object} curso - Dados do curso
 * @param {Object} formadorAntigo - Dados do formador anterior
 * @param {Object} formadorNovo - Dados do novo formador
 * @param {Object} io - Instância WebSocket opcional
 * @returns {Promise<Object|null>} Resultado ou null se erro
 */
const notificarFormadorAlterado = async (curso, formadorAntigo, formadorNovo, io = null) => {
  try {
    console.log(`👨‍🏫 [NOTIF-INT] A processar alteração de formador interno: ${curso.nome}`);
    
    // Procurar inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: curso.id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhum inscrito para notificar sobre formador alterado');
      return null;
    }

    // Criar mensagem sobre a alteração
    let mensagem = `O formador do curso "${curso.nome}" foi alterado`;
    if (formadorAntigo && formadorNovo) {
      mensagem += ` de ${formadorAntigo.nome} para ${formadorNovo.nome}`;
    } else if (formadorNovo) {
      mensagem += ` para ${formadorNovo.nome}`;
    }
    mensagem += '. Consulta os detalhes do curso para mais informações.';

    const resultado = await criarEAssociarNotificacao(
      "👨‍🏫 Alteração de Formador",
      mensagem,
      "formador_alterado",
      curso.id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket se disponível
    if (io) {
      for (const idUtilizador of destinatarios) {
        await enviarPushNotification(
          io,
          idUtilizador,
          resultado.notificacao.titulo,
          resultado.notificacao.mensagem,
          resultado.notificacao.tipo,
          { id_curso: curso.id_curso }
        );
      }
    }

    console.log(`✅ [NOTIF-INT] Notificação interna de formador alterado processada para ${resultado.associacoes.length} inscritos`);
    return resultado;
  } catch (error) {
    console.error('❌ [NOTIF-INT] Erro na notificação interna de formador alterado:', error.message);
    return null;
  }
};

/**
 * Versão interna para notificar alteração de datas
 * 
 * @param {Object} curso - Dados do curso atualizado
 * @param {Date} dataInicioAntiga - Data de início anterior
 * @param {Date} dataFimAntiga - Data de fim anterior
 * @param {Object} io - Instância WebSocket opcional
 * @returns {Promise<Object|null>} Resultado ou null se erro
 */
const notificarDataCursoAlterada = async (curso, dataInicioAntiga, dataFimAntiga, io = null) => {
  try {
    console.log(`📅 [NOTIF-INT] A processar alteração de datas interno: ${curso.nome}`);
    
    // Procurar inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: curso.id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhum inscrito para notificar sobre datas alteradas');
      return null;
    }

    // Verificar se houve alterações significativas
    let detalhesAlteracao = [];
    if (dataInicioAntiga && curso.data_inicio &&
      new Date(dataInicioAntiga).getTime() !== new Date(curso.data_inicio).getTime()) {
      const dataInicioAntigaFormatada = new Date(dataInicioAntiga).toLocaleDateString('pt-PT');
      const dataInicioNovaFormatada = new Date(curso.data_inicio).toLocaleDateString('pt-PT');
      detalhesAlteracao.push(`data de início de ${dataInicioAntigaFormatada} para ${dataInicioNovaFormatada}`);
    }

    if (dataFimAntiga && curso.data_fim &&
      new Date(dataFimAntiga).getTime() !== new Date(curso.data_fim).getTime()) {
      const dataFimAntigaFormatada = new Date(dataFimAntiga).toLocaleDateString('pt-PT');
      const dataFimNovaFormatada = new Date(curso.data_fim).toLocaleDateString('pt-PT');
      detalhesAlteracao.push(`data de fim de ${dataFimAntigaFormatada} para ${dataFimNovaFormatada}`);
    }

    if (detalhesAlteracao.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhuma alteração significativa de datas detetada');
      return null;
    }

    const mensagem = `As datas do curso "${curso.nome}" foram alteradas: ${detalhesAlteracao.join(' e ')}. Ajusta a tua agenda conforme necessário.`;

    const resultado = await criarEAssociarNotificacao(
      "📅 Alteração nas Datas do Curso",
      mensagem,
      "data_curso_alterada",
      curso.id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket se disponível
    if (io) {
      for (const idUtilizador of destinatarios) {
        await enviarPushNotification(
          io,
          idUtilizador,
          resultado.notificacao.titulo,
          resultado.notificacao.mensagem,
          resultado.notificacao.tipo,
          { id_curso: curso.id_curso }
        );
      }
    }

    console.log(`✅ [NOTIF-INT] Notificação interna de datas alteradas processada para ${resultado.associacoes.length} inscritos`);
    return resultado;
  } catch (error) {
    console.error('❌ [NOTIF-INT] Erro na notificação interna de datas alteradas:', error.message);
    return null;
  }
};

/**
 * Versão interna para notificar alterações do curso
 * 
 * @param {Object} curso - Dados do curso atualizado
 * @param {Array} alteracoes - Lista de alterações realizadas
 * @param {Object} io - Instância WebSocket opcional
 * @returns {Promise<Object|null>} Resultado ou null se erro
 */
const notificarCursoAlterado = async (curso, alteracoes, io = null) => {
  try {
    if (!alteracoes || alteracoes.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhuma alteração para notificar');
      return null;
    }

    console.log(`✏️ [NOTIF-INT] A processar alterações internas do curso: ${curso.nome} (${alteracoes.length} alterações)`);

    // Procurar inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: curso.id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    if (destinatarios.length === 0) {
      console.log('ℹ️ [NOTIF-INT] Nenhum inscrito para notificar sobre alterações');
      return null;
    }

    // Construir mensagem detalhada das alterações
    const detalhesAlteracoes = alteracoes.map(alt => {
      const nomesCampos = {
        nome: 'nome',
        descricao: 'descrição', 
        tipo: 'tipo',
        vagas: 'número de vagas',
        duracao: 'duração',
        id_area: 'área',
        id_categoria: 'categoria',
        id_topico_area: 'tópico'
      };

      const nomeCampo = nomesCampos[alt.campo] || alt.campo;
      
      if (alt.campo === 'tipo') {
        const tipos = { sincrono: 'Síncrono', assincrono: 'Assíncrono' };
        return `${nomeCampo} alterado de "${tipos[alt.valor_antigo] || alt.valor_antigo}" para "${tipos[alt.valor_novo] || alt.valor_novo}"`;
      }
      
      return `${nomeCampo} alterado de "${alt.valor_antigo}" para "${alt.valor_novo}"`;
    });

    const mensagem = `O curso "${curso.nome}" foi atualizado. Alterações: ${detalhesAlteracoes.join('; ')}. Consulta os detalhes do curso.`;

    const resultado = await criarEAssociarNotificacao(
      "✏️ Curso Atualizado", 
      mensagem,
      "curso_alterado",
      curso.id_curso,
      destinatarios
    );

    // Enviar notificações push via WebSocket se disponível
    if (io) {
      for (const idUtilizador of destinatarios) {
        await enviarPushNotification(
          io,
          idUtilizador,
          resultado.notificacao.titulo,
          resultado.notificacao.mensagem,
          resultado.notificacao.tipo,
          { id_curso: curso.id_curso, alteracoes }
        );
      }
    }

    console.log(`✅ [NOTIF-INT] Notificação interna de curso alterado processada para ${resultado.associacoes.length} inscritos`);
    return resultado;
  } catch (error) {
    console.error('❌ [NOTIF-INT] Erro na notificação interna de curso alterado:', error.message);
    return null;
  }
};

module.exports = {
  // Funções para rotas HTTP públicas
  getNotificacoesUtilizador,
  marcarComoLida,
  marcarTodasComoLidas,
  getNotificacoesNaoLidasContagem,
  adminCriado,
  formadorAlterado,
  dataCursoAlterada,
  cursoCriado,
  cursoAlterado,
  
  // Funções internas para integração com outros controladores
  notificarNovoCurso,
  notificarFormadorAlterado,
  notificarDataCursoAlterada,
  notificarCursoAlterado
};