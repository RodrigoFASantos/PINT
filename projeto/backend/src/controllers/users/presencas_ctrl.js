const Curso_Presenca = require("../../database/models/Curso_Presenca");
const Formando_Presenca = require("../../database/models/Formando_Presenca");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Utilizador = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const { Op } = require("sequelize");

// Obter presenças de um curso
exports.getPresencasByCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar todas as presenças do curso
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso: id },
      order: [['data_inicio', 'DESC'], ['hora_inicio', 'DESC']]
    });

    // Para cada presença, calcular estatísticas (para formadores)
    const presencasComEstatisticas = await Promise.all(
      presencas.map(async (presenca) => {
        const presencaObj = presenca.toJSON();

        // Contar presenças marcadas para esta sessão
        const presentes = await Formando_Presenca.count({
          where: {
            id_curso_presenca: presenca.id_curso_presenca,
            presenca: true
          }
        });

        // Contar total de formandos inscritos no curso
        const total = await Inscricao_Curso.count({
          where: { id_curso: id }
        });

        return {
          ...presencaObj,
          presentes,
          total
        };
      })
    );

    res.status(200).json(presencasComEstatisticas);
  } catch (error) {
    console.error("Erro ao buscar presenças:", error);
    res.status(500).json({ message: "Erro ao buscar presenças do curso" });
  }
};

// Obter lista de formandos para uma presença específica
exports.getFormandosPresenca = async (req, res) => {
  try {
    const { presencaId } = req.params;

    // Verificar se a presença existe
    const presenca = await Curso_Presenca.findByPk(presencaId);
    if (!presenca) {
      return res.status(404).json({ message: "Presença não encontrada" });
    }

    // Obter todos os formandos inscritos no curso
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso: presenca.id_curso },
      include: [
        {
          model: Utilizador,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email']
        }
      ]
    });

    // Obter os registros de presença para esta sessão específica
    const presencasFormandos = await Formando_Presenca.findAll({
      where: { id_curso_presenca: presencaId }
    });

    // Mapear os IDs de utilizadores que estavam presentes
    const formandosPresentes = presencasFormandos.reduce((acc, registro) => {
      if (registro.presenca) {
        acc[registro.id_utilizador] = true;
      }
      return acc;
    }, {});

    // Criar lista final de formandos com status de presença
    const listaFormandos = inscricoes.map(inscricao => {
      const { utilizador } = inscricao;
      return {
        id_utilizador: utilizador.id_utilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        presenca: formandosPresentes[utilizador.id_utilizador] || false
      };
    });

    // Ordenar por nome
    listaFormandos.sort((a, b) => a.nome.localeCompare(b.nome));

    res.status(200).json(listaFormandos);
  } catch (error) {
    console.error("Erro ao buscar lista de formandos:", error);
    res.status(500).json({ message: "Erro ao buscar lista de formandos" });
  }
};

// Obter as horas disponíveis em um curso
exports.getHorasDisponiveisCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar duração total do curso
    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Buscar todas as presenças do curso
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso: id }
    });

    // Calcular total de horas já utilizadas
    let horasUtilizadas = 0;

    for (const presenca of presencas) {
      const inicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
      const fim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
      const diferencaMs = fim - inicio;
      const diferencaHoras = diferencaMs / (1000 * 60 * 60);
      horasUtilizadas += diferencaHoras;
    }

    // Calcular horas disponíveis
    const horasDisponiveis = Math.max(0, curso.duracao - horasUtilizadas);

    res.status(200).json({
      duracaoCurso: curso.duracao,
      horasUtilizadas,
      horasDisponiveis
    });
  } catch (error) {
    console.error("Erro ao calcular horas disponíveis:", error);
    res.status(500).json({ message: "Erro ao calcular horas disponíveis do curso" });
  }
};

// Obter presenças de um formando em um curso
exports.getPresencasByFormando = async (req, res) => {
  try {
    const { cursoId, userId } = req.params;

    // Buscar IDs de todas as presenças do curso
    const presencasCurso = await Curso_Presenca.findAll({
      where: { id_curso: cursoId },
      attributes: ['id_curso_presenca']
    });

    const idsPresencasCurso = presencasCurso.map(p => p.id_curso_presenca);

    // Buscar registros de presença do formando
    const presencasFormando = await Formando_Presenca.findAll({
      where: {
        id_curso_presenca: { [Op.in]: idsPresencasCurso },
        id_utilizador: userId
      }
    });

    res.status(200).json(presencasFormando);
  } catch (error) {
    console.error("Erro ao buscar presenças do formando:", error);
    res.status(500).json({ message: "Erro ao buscar presenças do formando" });
  }
};

// Criar nova presença (formador)
exports.criarPresenca = async (req, res) => {
  try {
    const { id_curso, data_inicio, hora_inicio, data_fim, hora_fim, codigo } = req.body;
    // Obter o ID do formador a partir do token
    const id_formador = req.user.id_utilizador;

    // verificar se data/hora_fim > data/hora_inicio
    const inicioTime = new Date(`${data_inicio}T${hora_inicio}`);
    const fimTime = new Date(`${data_fim}T${hora_fim}`);

    if (fimTime <= inicioTime) {
      return res.status(400).json({
        message: "Data/hora de fim inválida",
        detalhe: "A data/hora de fim deve ser posterior à data/hora de início"
      });
    }

    // Validação para verificar se existe presença ativa
    const agora = new Date();

    // Buscar presenças que ainda não terminaram
    const presencaAtiva = await Curso_Presenca.findOne({
      where: {
        id_curso,
        [Op.or]: [
          {
            // Data de fim é futura
            data_fim: { [Op.gt]: agora.toISOString().split('T')[0] }
          },
          {
            // Data de fim é hoje mas hora fim ainda não passou
            data_fim: agora.toISOString().split('T')[0],
            hora_fim: { [Op.gte]: agora.toTimeString().split(' ')[0] }
          }
        ]
      }
    });

    if (presencaAtiva) {
      return res.status(400).json({
        message: "Já existe uma presença ativa para este curso",
        detalhe: "Não é possível criar uma nova presença enquanto existir uma ativa"
      });
    }

    // Verificar horas disponíveis e Buscar duração total do curso
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Buscar todas as presenças do curso
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso }
    });

    // Calcular total de horas já utilizadas
    let horasUtilizadas = 0;

    for (const presenca of presencas) {
      const inicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
      const fim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
      const diferencaMs = fim - inicio;
      const diferencaHoras = diferencaMs / (1000 * 60 * 60);
      horasUtilizadas += diferencaHoras;
    }

    // Calcular horas da nova presença
    const diferencaMsNovo = fimTime - inicioTime;
    const diferencaHorasNovo = diferencaMsNovo / (1000 * 60 * 60);

    // Verificar se ultrapassa a duração do curso
    if (horasUtilizadas + diferencaHorasNovo > curso.duracao) {
      return res.status(400).json({
        message: "A presença não pode ser criada",
        detalhe: `Ultrapassaria a duração total do curso. Restam ${(curso.duracao - horasUtilizadas).toFixed(2)} horas disponíveis.`
      });
    }

    // Criar nova presença
    const novaPresenca = await Curso_Presenca.create({
      id_curso,
      data_inicio,
      hora_inicio,
      data_fim,
      hora_fim,
      codigo
    });

    // Marcar presença do formador automaticamente
    await Formando_Presenca.create({
      id_curso_presenca: novaPresenca.id_curso_presenca,
      id_utilizador: id_formador,
      presenca: true,
      duracao: diferencaHorasNovo
    });

    res.status(201).json(novaPresenca);
  } catch (error) {
    console.error("Erro ao criar presença:", error);
    res.status(500).json({ message: "Erro ao criar presença" });
  }
};

// Marcar presença (formando)
exports.marcarPresenca = async (req, res) => {
  try {
    const { id_curso, id_utilizador, codigo } = req.body;

    console.log('=== TESTE COMPLETO DE MARCAÇÃO DE PRESENÇA ===');
    console.log('Requisição recebida:', { id_curso, id_utilizador, codigo });

    // 1. Primeiro, vamos verificar se o curso existe
    const todasPresencas = await Curso_Presenca.findAll();
    console.log('TODAS as presenças no sistema:', todasPresencas.length);

    // 2. Verificar presenças deste curso específico
    const presencasDoCurso = await Curso_Presenca.findAll({
      where: { id_curso }
    });
    console.log(`Presenças do curso ${id_curso}:`, presencasDoCurso.length);

    if (presencasDoCurso.length > 0) {
      console.log('Detalhes das presenças do curso:', presencasDoCurso.map(p => ({
        id: p.id_curso_presenca,
        codigo: p.codigo,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        hora_inicio: p.hora_inicio,
        hora_fim: p.hora_fim
      })));
    }

    // 3. Busca específica pelo código
    const presencaPorCodigo = await Curso_Presenca.findOne({
      where: { codigo }
    });

    console.log('Presença encontrada com este código (em qualquer curso):',
      presencaPorCodigo ? 'SIM' : 'NÃO');

    if (presencaPorCodigo) {
      console.log('Curso da presença encontrada:', presencaPorCodigo.id_curso);
      console.log('Curso solicitado:', id_curso);
    }

    // 4. Verificar se já existe registro de presença
    if (presencasDoCurso.length > 0) {
      const checarPresencaExistente = await Formando_Presenca.findOne({
        where: {
          id_curso_presenca: presencasDoCurso[0].id_curso_presenca,
          id_utilizador
        }
      });

      console.log('Já existe registro de presença para este usuário:',
        checarPresencaExistente ? 'SIM' : 'NÃO');
    }

    // 5. Resposta apropriada com base na análise
    if (presencasDoCurso.length === 0) {
      return res.status(400).json({
        message: "Não foram encontradas presenças ativas para este curso",
        detalhes: "Aguarde o formador criar uma sessão de presença"
      });
    }

    if (presencaPorCodigo && presencaPorCodigo.id_curso != id_curso) {
      return res.status(400).json({
        message: "Código válido, mas pertence a outro curso",
        detalhes: "Verifique se você está no curso correto"
      });
    }

    // Execução normal
    const agora = new Date();

    // Buscar presença com os critérios corretos
    const presencaAtiva = await Curso_Presenca.findOne({
      where: {
        id_curso,
        codigo,
        [Op.or]: [
          {
            // Data de fim é futura
            data_fim: { [Op.gt]: agora.toISOString().split('T')[0] }
          },
          {
            // Data de fim é hoje mas hora fim ainda não passou
            data_fim: agora.toISOString().split('T')[0],
            hora_fim: { [Op.gte]: agora.toTimeString().split(' ')[0] }
          }
        ]
      }
    });

    if (!presencaAtiva) {
      return res.status(400).json({
        message: "Código inválido ou expirado"
      });
    }

    // Verificar se já marcou presença
    const presencaExistente = await Formando_Presenca.findOne({
      where: {
        id_curso_presenca: presencaAtiva.id_curso_presenca,
        id_utilizador
      }
    });

    if (presencaExistente) {
      return res.status(400).json({ message: "Presença já registrada" });
    }

    // Calcular a duração da presença
    const inicio = new Date(`${presencaAtiva.data_inicio}T${presencaAtiva.hora_inicio}`);
    const fim = new Date(`${presencaAtiva.data_fim}T${presencaAtiva.hora_fim}`);
    const diferencaMs = fim - inicio;
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);

    // Registrar a presença
    const novaPresenca = await Formando_Presenca.create({
      id_curso_presenca: presencaAtiva.id_curso_presenca,
      id_utilizador,
      presenca: true,
      duracao: diferencaHoras
    });

    res.status(201).json(novaPresenca);
  } catch (error) {
    console.error("ERRO COMPLETO:", error);
    res.status(500).json({
      message: "Erro ao marcar presença",
      erro: error.message
    });
  }
};

// Atualizar presença (apenas admin)
exports.atualizarPresenca = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, data_inicio, hora_inicio, data_fim, hora_fim } = req.body;

    // Verificar se a presença existe
    const presenca = await Curso_Presenca.findByPk(id);
    if (!presenca) {
      return res.status(404).json({ message: "Presença não encontrada" });
    }

    // Nova validação: verificar se data/hora_fim > data/hora_inicio
    const inicioTime = new Date(`${data_inicio}T${hora_inicio}`);
    const fimTime = new Date(`${data_fim}T${hora_fim}`);

    if (fimTime <= inicioTime) {
      return res.status(400).json({
        message: "Data/hora de fim inválida",
        detalhe: "A data/hora de fim deve ser posterior à data/hora de início"
      });
    }

    // Atualizar a presença
    await presenca.update({
      codigo,
      data_inicio,
      hora_inicio,
      data_fim,
      hora_fim
    });

    res.status(200).json({
      message: "Presença atualizada com sucesso",
      presenca
    });
  } catch (error) {
    console.error("Erro ao atualizar presença:", error);
    res.status(500).json({ message: "Erro ao atualizar presença" });
  }
};