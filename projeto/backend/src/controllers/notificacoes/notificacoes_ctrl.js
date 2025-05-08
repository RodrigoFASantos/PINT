const Notificacao = require('../../database/models/Notificacao');
const NotificacaoUtilizador = require('../../database/models/NotificacaoUtilizador');
const User = require('../../database/models/User');
const Curso = require('../../database/models/Curso');
const Inscricao_Curso = require('../../database/models/Inscricao_Curso');
const Categoria = require('../../database/models/Categoria');
const Area = require('../../database/models/Area');
const emailService = require('../../utils/emailService');
const { Op } = require('sequelize');

// Função para obter todas as notificações de um utilizador (autenticado)
const getNotificacoesUtilizador = async (req, res) => {
  try {
    const idUtilizador = req.user.id_utilizador;
    
    // Consulta corrigida usando a associação corretamente
    const notificacoes = await NotificacaoUtilizador.findAll({
      where: { id_utilizador: idUtilizador },
      include: [
        { 
          model: Notificacao, 
          as: 'notificacao' 
        }
      ],
      order: [
        [{ model: Notificacao, as: 'notificacao' }, 'data_criacao', 'DESC']
      ]
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

// Marcar todas as notificações do utilizador autenticado como lidas
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

// Obter contagem de notificações não lidas do utilizador autenticado
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

// Função para criar uma notificação e associá-la a vários utilizadores
const criarEAssociarNotificacao = async (titulo, mensagem, tipo, idReferencia, destinatarios) => {
  try {
    console.log(`A criar notificação: ${titulo} - Tipo: ${tipo}`);

    // Criar a notificação
    const notificacao = await Notificacao.create({
      titulo,
      mensagem,
      tipo,
      id_referencia: idReferencia,
      data_criacao: new Date(),
      enviado_email: false
    });

    console.log(`Notificação criada com ID: ${notificacao.id_notificacao}`);

    // Associar a notificação a cada destinatário
    const associacoesPromises = destinatarios.map(async (idUtilizador) => {
      try {
        const novaAssociacao = await NotificacaoUtilizador.create({
          id_notificacao: notificacao.id_notificacao,
          id_utilizador: idUtilizador,
          lida: false,
          data_leitura: null
        });

        return novaAssociacao;
      } catch (error) {
        console.error(`Erro ao associar notificação ao utilizador ${idUtilizador}:`, error);
        return null;
      }
    });

    const associacoes = await Promise.all(associacoesPromises);
    const associacoesSucesso = associacoes.filter(a => a !== null);

    console.log(`Notificação associada a ${associacoesSucesso.length} utilizadores`);

    return {
      notificacao,
      associacoes: associacoesSucesso
    };
  } catch (error) {
    console.error("Erro ao criar e associar notificação:", error);
    throw error;
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

    // Procurar administradores para notificar
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

    // Lista de IDs dos administradores (exceto o novo)
    const destinatarios = administradores
      .filter(admin => admin.id_utilizador !== parseInt(id_admin))
      .map(admin => admin.id_utilizador);

    if (destinatarios.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum outro administrador para notificar",
        count: 0
      });
    }

    // Criar e associar a notificação
    const resultado = await criarEAssociarNotificacao(
      "Novo Administrador",
      `Um novo administrador foi criado: ${nome_admin}`,
      "admin_criado",
      id_admin,
      destinatarios
    );

    // Enviar notificações push para cada destinatário
    for (const idUtilizador of destinatarios) {
      enviarPushNotification(
        req,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notificações enviadas com sucesso",
      count: resultado.associacoes.length
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

    // Procurar alunos inscritos para notificar
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

    // Lista de IDs dos alunos inscritos
    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    // Criar e associar a notificação
    const resultado = await criarEAssociarNotificacao(
      "Alteração de Formador",
      `O formador do curso "${nome_curso}" foi alterado ${nome_formador_antigo ? `de ${nome_formador_antigo}` : ""
      } para ${nome_formador_novo}.`,
      "formador_alterado",
      id_curso,
      destinatarios
    );

    // Enviar notificações push para cada destinatário
    for (const idUtilizador of destinatarios) {
      enviarPushNotification(
        req,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_curso }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de formador enviadas com sucesso",
      count: resultado.associacoes.length
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

    // Procurar alunos inscritos para notificar
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

    // Lista de IDs dos alunos inscritos
    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

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

    // Criar e associar a notificação
    const resultado = await criarEAssociarNotificacao(
      "Alteração nas Datas do Curso",
      `As datas do curso "${nome_curso}" foram alteradas: ${detalhesAlteracao.join(' e ')}`,
      "data_curso_alterada",
      id_curso,
      destinatarios
    );

    // Enviar notificações push para cada destinatário
    for (const idUtilizador of destinatarios) {
      enviarPushNotification(
        req,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_curso }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notificações de alteração de datas enviadas com sucesso",
      count: resultado.associacoes.length
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

// Notificar sobre um novo curso criado
const cursoCriado = async (req, res) => {
  try {
    console.log("A iniciar criação de notificação para novo curso");
    const { id_curso, nome_curso, id_categoria, id_area } = req.body;

    if (!id_curso || !nome_curso) {
      return res.status(400).json({
        success: false,
        message: "ID e nome do curso são obrigatórios"
      });
    }

    console.log(`Dados recebidos: Curso ${id_curso} - ${nome_curso}, Categoria: ${id_categoria}, Area: ${id_area}`);

    // Procurar formadores relacionados à categoria e área
    console.log("Procurar formadores relacionados...");
    let formadores = [];

    if (id_categoria) {
      // Procurar formadores da categoria
      const formadoresCategoria = await User.findAll({
        where: { id_cargo: 2 },
        include: [
          {
            model: Categoria,
            as: "categorias_formador",
            where: { id_categoria: id_categoria },
            required: true,
            through: { attributes: [] }
          }
        ],
        attributes: ['id_utilizador']
      });

      formadores = formadoresCategoria;
      console.log(`Encontrados ${formadores.length} formadores relacionados à categoria ${id_categoria}`);
    }

    // Procurar administradores para notificar
    console.log("Procurar administradores...");
    const administradores = await User.findAll({
      where: { id_cargo: 1 },
      attributes: ['id_utilizador']
    });
    console.log(`Encontrados ${administradores.length} administradores`);

    // Combinar os formadores e administradores (sem duplicatas)
    const formadoresIds = formadores.map(f => f.id_utilizador);
    const adminsIds = administradores.map(a => a.id_utilizador);

    // Usar Set para eliminar duplicatas
    const destinatariosSet = new Set([...formadoresIds, ...adminsIds]);
    const destinatarios = Array.from(destinatariosSet);

    console.log(`Total de destinatários: ${destinatarios.length}`);

    if (destinatarios.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Nenhum formador ou administrador para notificar",
        count: 0
      });
    }

    // Criar e associar a notificação
    console.log("A criar notificação...");
    const resultado = await criarEAssociarNotificacao(
      "Novo Curso Disponível",
      `Um novo curso foi criado: "${nome_curso}"`,
      "curso_adicionado",
      id_curso,
      destinatarios
    );

    // Enviar notificações push para cada destinatário
    console.log("A enviar notificações push...");
    for (const idUtilizador of destinatarios) {
      enviarPushNotification(
        req,
        idUtilizador,
        resultado.notificacao.titulo,
        resultado.notificacao.mensagem,
        resultado.notificacao.tipo,
        { id_curso }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Notificações de novo curso enviadas com sucesso para ${resultado.associacoes.length} utilizadores`,
      count: resultado.associacoes.length
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

// Função auxiliar para notificar formadores quando um curso é criado diretamente do controller
const notificarNovoCurso = async (curso) => {
  try {
    console.log(`A notificar novo curso: ${curso.id_curso} - ${curso.nome}`);

    // Procurar formadores da categoria e área
    const formadores = await User.findAll({
      where: { id_cargo: 2 },
      include: [
        {
          model: Categoria,
          as: "categorias_formador",
          where: { id_categoria: curso.id_categoria },
          required: true,
          through: { attributes: [] }
        }
      ],
      attributes: ['id_utilizador']
    });

    // Procurar administradores
    const administradores = await User.findAll({
      where: { id_cargo: 1 },
      attributes: ['id_utilizador']
    });

    // Combinar formadores e administradores sem duplicatas
    const formadoresIds = formadores.map(f => f.id_utilizador);
    const adminsIds = administradores.map(a => a.id_utilizador);

    const destinatariosSet = new Set([...formadoresIds, ...adminsIds]);
    const destinatarios = Array.from(destinatariosSet);

    if (destinatarios.length === 0) {
      console.log("Nenhum destinatário para notificar sobre o novo curso");
      return null;
    }

    // Criar e associar a notificação
    return await criarEAssociarNotificacao(
      "Novo Curso Disponível",
      `Um novo curso foi criado: "${curso.nome}"`,
      "curso_adicionado",
      curso.id_curso,
      destinatarios
    );
  } catch (error) {
    console.error("Erro ao notificar novo curso:", error);
    return null;
  }
};

// Função para notificar sobre alteração de formador (chamada diretamente do controller)
const notificarFormadorAlterado = async (curso, formadorAntigo, formadorNovo) => {
  try {
    console.log(`A notificar alteração de formador no curso: ${curso.id_curso} - ${curso.nome}`);

    // Procurar alunos inscritos
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: curso.id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    if (destinatarios.length === 0) {
      console.log("Nenhum aluno inscrito para notificar sobre a alteração de formador");
      return null;
    }

    // Criar e associar a notificação
    return await criarEAssociarNotificacao(
      "Alteração de Formador",
      `O formador do curso "${curso.nome}" foi alterado ${formadorAntigo ? `de ${formadorAntigo.nome}` : ""
      } para ${formadorNovo.nome}.`,
      "formador_alterado",
      curso.id_curso,
      destinatarios
    );
  } catch (error) {
    console.error("Erro ao notificar alteração de formador:", error);
    return null;
  }
};

// Função para notificar sobre alteração de datas do curso
const notificarDataCursoAlterada = async (curso, dataInicioAntiga, dataFimAntiga) => {
  try {
    console.log(`A notificar alteração de datas no curso: ${curso.id_curso} - ${curso.nome}`);

    // Procurar alunos inscritos
    const inscricoes = await Inscricao_Curso.findAll({
      where: {
        id_curso: curso.id_curso,
        estado: 'inscrito'
      },
      attributes: ['id_utilizador']
    });

    const destinatarios = inscricoes.map(inscricao => inscricao.id_utilizador);

    if (destinatarios.length === 0) {
      console.log("Nenhum aluno inscrito para notificar sobre a alteração de datas");
      return null;
    }

    // Detalhes da alteração
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
      console.log("Nenhuma alteração significativa nas datas do curso");
      return null;
    }

    // Criar e associar a notificação
    return await criarEAssociarNotificacao(
      "Alteração nas Datas do Curso",
      `As datas do curso "${curso.nome}" foram alteradas: ${detalhesAlteracao.join(' e ')}`,
      "data_curso_alterada",
      curso.id_curso,
      destinatarios
    );
  } catch (error) {
    console.error("Erro ao notificar alteração de datas do curso:", error);
    return null;
  }
};

// Função para enviar notificação push (websocket)
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

      console.log(`Notificação push enviada para o utilizador ${id_utilizador}`);
    } else {
      console.log(`Socket.io não disponível para enviar notificação ao utilizador ${id_utilizador}`);
    }
  } catch (error) {
    console.error("Erro ao enviar push notification:", error);
    // Don't throw, as this is a non-critical function
  }
};

module.exports = {
  getNotificacoesUtilizador,
  marcarComoLida,
  marcarTodasComoLidas,
  getNotificacoesNaoLidasContagem,
  adminCriado,
  formadorAlterado,
  dataCursoAlterada,
  cursoCriado,
  // Exportar funções para serem chamadas diretamente de outros controllers
  notificarNovoCurso,
  notificarFormadorAlterado,
  notificarDataCursoAlterada
};