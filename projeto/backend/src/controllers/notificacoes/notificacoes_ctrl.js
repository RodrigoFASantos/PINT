const { sequelize } = require('../../config/db');
const Notificacao = require('../../database/models/Notificacao');
const NotificacaoUtilizador = require('../../database/models/NotificacaoUtilizador');
const User = require('../../database/models/User');
const Curso = require('../../database/models/Curso');
const Inscricao_Curso = require('../../database/models/Inscricao_Curso');
const emailService = require('../../utils/emailService');







// Função para obter todas as notificações de um utilizador (logado)
const getNotificacoesUsuario = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    const notificacoes = await NotificacaoUtilizador.findAll({
      where: { id_utilizador: idUtilizador },
      include: [{ model: Notificacao, as: 'notificacao' }],
      order: [[Notificacao, 'data_criacao', 'DESC']]
    });
    return res.status(200).json(notificacoes);
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    return res.status(500).json({ message: 'Erro ao obter notificações' });
  }
};

// Marcar uma notificação específica como lida
const marcarComoLida = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    const { id_notificacao } = req.params;
    const notificacaoUtilizador = await NotificacaoUtilizador.findOne({
      where: { id_utilizador: idUtilizador, id_notificacao }
    });
    if (!notificacaoUtilizador) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }
    notificacaoUtilizador.lida = true;
    notificacaoUtilizador.data_leitura = new Date();
    await notificacaoUtilizador.save();
    return res.status(200).json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
  }
};

// Marcar todas as notificações do utilizador logado como lidas
const marcarTodasComoLidas = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    await NotificacaoUtilizador.update(
      { lida: true, data_leitura: new Date() },
      { where: { id_utilizador: idUtilizador, lida: false } }
    );
    return res.status(200).json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return res.status(500).json({ message: 'Erro ao marcar notificações' });
  }
};


// Obter contagem de notificações não lidas do utilizador logado
const getNotificacoesNaoLidasContagem = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    const count = await NotificacaoUtilizador.count({
      where: { id_utilizador: idUtilizador, lida: false }
    });
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return res.status(500).json({ message: 'Erro ao obter contagem de notificações' });
  }
};



// Send notification when a new admin is created
const adminCriado = async (req, res) => {
  try {
    const { id_admin, nome_admin } = req.body;
    
    if (!id_admin || !nome_admin) {
      return res.status(400).json({ 
        success: false, 
        message: "ID e nome do administrador são obrigatórios" 
      });
    }

    // Buscar administradores para notificar
    const administradores = await User.findAll({
      where: { id_cargo: 1 },
      attributes: ['id_utilizador']
    });

    if (administradores.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum administrador para notificar",
        count: 0
      });
    }

    // Criar a notificação
    const notificacao = await Notificacao.create({
      titulo: "Novo Administrador",
      mensagem: `Um novo administrador foi criado: ${nome_admin}`,
      tipo: "admin_criado",
      id_referencia: id_admin,
      data_criacao: new Date()
    });

    // Associar notificação a cada administrador (exceto o novo)
    let notificacoesEnviadas = 0;
    
    for (const admin of administradores) {
      // Skip sending notification to the newly created admin
      if (admin.id_utilizador === parseInt(id_admin)) continue;
      
      // Create association between notification and user
      await NotificacaoUtilizador.create({
        id_notificacao: notificacao.id_notificacao,
        id_utilizador: admin.id_utilizador,
        lida: false
      });
      
      // Enviar notificação push
      enviarPushNotification(req, admin.id_utilizador, notificacao.titulo, notificacao.mensagem, notificacao.tipo);
      notificacoesEnviadas++;
    }

    return res.status(200).json({
      success: true,
      message: "Notificações enviadas com sucesso",
      count: notificacoesEnviadas
    });
  } catch (error) {
    console.error("Erro ao enviar notificação de administrador criado:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações",
      error: error.message
    });
  }
};

// Send notification when course instructor is changed
const formadorAlterado = async (req, res) => {
  try {
    const { id_curso, nome_curso, id_formador_antigo, nome_formador_antigo, id_formador_novo, nome_formador_novo } = req.body;
    
    if (!id_curso || !nome_curso) {
      return res.status(400).json({ 
        success: false, 
        message: "ID e nome do curso são obrigatórios" 
      });
    }

    // Buscar alunos inscritos para notificar
    const inscricoes = await Inscricao_Curso.findAll({
      where: { 
        id_curso: id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    if (inscricoes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum aluno inscrito para notificar",
        count: 0
      });
    }

    // Criar a notificação
    const notificacao = await Notificacao.create({
      titulo: "Alteração de Formador",
      mensagem: `O formador do curso "${nome_curso}" foi alterado ${
        nome_formador_antigo ? `de ${nome_formador_antigo}` : ""
      } para ${nome_formador_novo}.`,
      tipo: "formador_alterado",
      id_referencia: id_curso,
      data_criacao: new Date()
    });

    // Associar notificação a cada aluno inscrito
    for (const inscricao of inscricoes) {
      await NotificacaoUtilizador.create({
        id_notificacao: notificacao.id_notificacao,
        id_utilizador: inscricao.id_utilizador,
        lida: false
      });
      
      // Enviar notificação push
      enviarPushNotification(req, inscricao.id_utilizador, notificacao.titulo, notificacao.mensagem, notificacao.tipo, { id_curso });
    }

    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de formador enviadas com sucesso",
      count: inscricoes.length
    });
  } catch (error) {
    console.error("Erro ao enviar notificação de alteração de formador:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações",
      error: error.message
    });
  }
};

// Send notification when course dates are changed
const dataCursoAlterada = async (req, res) => {
  try {
    const { id_curso, nome_curso, data_inicio_antiga, data_fim_antiga, data_inicio_nova, data_fim_nova } = req.body;
    
    if (!id_curso || !nome_curso || (!data_inicio_nova && !data_fim_nova)) {
      return res.status(400).json({ 
        success: false, 
        message: "Dados incompletos para a notificação" 
      });
    }

    // Buscar alunos inscritos para notificar
    const inscricoes = await Inscricao_Curso.findAll({
      where: { 
        id_curso: id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    if (inscricoes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum aluno inscrito para notificar",
        count: 0
      });
    }

    // Detalhes da alteração
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

    // Criar a notificação
    const notificacao = await Notificacao.create({
      titulo: "Alteração nas Datas do Curso",
      mensagem: `As datas do curso "${nome_curso}" foram alteradas: ${detalhesAlteracao.join(' e ')}`,
      tipo: "data_curso_alterada",
      id_referencia: id_curso,
      data_criacao: new Date()
    });

    // Associar notificação a cada aluno inscrito
    for (const inscricao of inscricoes) {
      await NotificacaoUtilizador.create({
        id_notificacao: notificacao.id_notificacao,
        id_utilizador: inscricao.id_utilizador,
        lida: false
      });
      
      // Enviar notificação push
      enviarPushNotification(req, inscricao.id_utilizador, notificacao.titulo, notificacao.mensagem, notificacao.tipo, { id_curso });
    }

    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de datas enviadas com sucesso",
      count: inscricoes.length
    });
  } catch (error) {
    console.error("Erro ao enviar notificação de alteração de datas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações",
      error: error.message
    });
  }
};

const cursoCriado = async (req, res) => {
  try {
    const { id_curso, nome_curso, id_categoria, id_area } = req.body;
    
    if (!id_curso || !nome_curso) {
      return res.status(400).json({ 
        success: false, 
        message: "ID e nome do curso são obrigatórios" 
      });
    }

    // Buscar formadores da categoria e área para notificar
    const formadores = await User.findAll({
      where: { id_cargo: 2 },
      include: [
        {
          model: Categoria,
          as: "categorias_formador",
          where: { id_categoria: id_categoria },
          required: false
        }
      ]
    });

    // Buscar administradores para notificar
    const administradores = await User.findAll({
      where: { id_cargo: 1 },
      attributes: ['id_utilizador']
    });

    // Combinar os formadores e administradores (sem duplicatas)
    const destinatarios = [...administradores, ...formadores.filter(f => 
      !administradores.some(a => a.id_utilizador === f.id_utilizador)
    )];

    if (destinatarios.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum formador ou administrador para notificar",
        count: 0
      });
    }

    // Criar a notificação
    const notificacao = await Notificacao.create({
      titulo: "Novo Curso Disponível",
      mensagem: `Um novo curso foi criado: "${nome_curso}"`,
      tipo: "curso_adicionado",
      id_referencia: id_curso,
      data_criacao: new Date()
    });

    // Associar notificação a cada destinatário
    for (const destinatario of destinatarios) {
      await NotificacaoUtilizador.create({
        id_notificacao: notificacao.id_notificacao,
        id_utilizador: destinatario.id_utilizador,
        lida: false
      });
      
      // Enviar notificação push
      enviarPushNotification(req, destinatario.id_utilizador, notificacao.titulo, notificacao.mensagem, notificacao.tipo, { id_curso });
    }

    return res.status(200).json({
      success: true,
      message: "Notificações de novo curso enviadas com sucesso",
      count: destinatarios.length
    });
  } catch (error) {
    console.error("Erro ao enviar notificação de novo curso:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao enviar notificações",
      error: error.message
    });
  }
};


const enviarPushNotification = async (req, id_utilizador, titulo, mensagem, tipo, dados = {}) => {
  try {
    if (req.io) {
      // Emit notification via socket.io
      req.io.to(`user_${id_utilizador}`).emit('nova_notificacao', {
        titulo,
        mensagem,
        tipo,
        data: new Date(),
        ...dados
      });
      
      console.log(`Notificação push enviada para o usuário ${id_utilizador}`);
    }
  } catch (error) {
    console.error("Erro ao enviar push notification:", error);
    // Don't throw, as this is a non-critical function
  }
};


module.exports = {
  getNotificacoesUsuario,
  marcarComoLida,
  marcarTodasComoLidas,
  getNotificacoesNaoLidasContagem,
  adminCriado,
  formadorAlterado,
  dataCursoAlterada,
  cursoCriado
};
