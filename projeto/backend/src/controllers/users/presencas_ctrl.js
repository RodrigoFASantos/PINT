const Curso_Presenca = require("../../database/models/Curso_Presenca");
const Formando_Presenca = require("../../database/models/Formando_Presenca");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Utilizador = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const { Op } = require("sequelize");

/**
 * Obtém todas as presenças de um curso específico com estatísticas
 * Calcula quantos utilizadores estão presentes vs total de inscritos
 * Verifica se cada presença ainda está ativa (dentro do período válido)
 */
exports.getPresencasByCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar todas as presenças do curso ordenadas por data/hora mais recente primeiro
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso: id },
      order: [['data_inicio', 'DESC'], ['hora_inicio', 'DESC']]
    });

    // Para cada presença, calcular estatísticas e disponibilidade
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

        // Contar total de utilizadores inscritos no curso
        const total = await Inscricao_Curso.count({
          where: { id_curso: id }
        });

        // Verificar se a presença ainda está ativa (disponível para marcar)
        const agora = new Date();
        
        try {
          const dataHoraInicio = new Date(`${presencaObj.data_inicio}T${presencaObj.hora_inicio}`);
          const dataHoraFim = new Date(`${presencaObj.data_fim}T${presencaObj.hora_fim}`);
          
          // Uma presença está disponível se já começou e ainda não terminou
          const disponivel = dataHoraInicio <= agora && dataHoraFim > agora;
          const minutos_restantes = Math.max(0, Math.floor((dataHoraFim - agora) / (1000 * 60)));
          
          presencaObj.disponivel = disponivel;
          presencaObj.minutos_restantes = minutos_restantes;
        } catch (e) {
          console.error(`Erro ao verificar disponibilidade da presença: ${e.message}`);
          presencaObj.disponivel = false;
          presencaObj.minutos_restantes = 0;
        }

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

/**
 * Obtém lista detalhada de formandos para uma presença específica
 * Mostra quem estava presente e quem estava ausente numa sessão
 * Funcionalidade disponível apenas para formadores e administradores
 */
exports.getFormandosPresenca = async (req, res) => {
  try {
    const { presencaId } = req.params;

    // Verificar se a presença existe
    const presenca = await Curso_Presenca.findByPk(presencaId);
    if (!presenca) {
      return res.status(404).json({ message: "Presença não encontrada" });
    }

    // Obter todos os utilizadores inscritos no curso
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

    // Obter os registos de presença para esta sessão específica
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

    // Criar lista final de formandos com estado de presença
    const listaFormandos = inscricoes.map(inscricao => {
      const { utilizador } = inscricao;
      return {
        id_utilizador: utilizador.id_utilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        presenca: formandosPresentes[utilizador.id_utilizador] || false
      };
    });

    // Ordenar por nome para facilitar a consulta
    listaFormandos.sort((a, b) => a.nome.localeCompare(b.nome));

    res.status(200).json(listaFormandos);
  } catch (error) {
    console.error("Erro ao buscar lista de formandos:", error);
    res.status(500).json({ message: "Erro ao buscar lista de formandos" });
  }
};

/**
 * Calcula as horas disponíveis, utilizadas e totais de um curso
 * Essencial para controlar se ainda é possível criar mais presenças
 * sem exceder a duração prevista do curso
 */
exports.getHorasDisponiveisCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dados básicos do curso
    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Buscar todas as presenças já criadas para o curso
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso: id }
    });

    // Calcular total de horas já utilizadas em presenças
    let horasUtilizadas = 0;

    for (const presenca of presencas) {
      const inicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
      const fim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);
      const diferencaMs = fim - inicio;
      const diferencaHoras = diferencaMs / (1000 * 60 * 60);
      horasUtilizadas += diferencaHoras;
    }

    // Calcular horas ainda disponíveis (não pode ser negativo)
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

/**
 * Obtém todas as presenças marcadas por um formando específico num curso
 * Retorna apenas os registos onde o utilizador efetivamente marcou presença
 */
exports.getPresencasByFormando = async (req, res) => {
  try {
    const { cursoId, userId } = req.params;

    // Buscar IDs de todas as presenças do curso
    const presencasCurso = await Curso_Presenca.findAll({
      where: { id_curso: cursoId },
      attributes: ['id_curso_presenca']
    });

    const idsPresencasCurso = presencasCurso.map(p => p.id_curso_presenca);

    // Buscar registos de presença do utilizador específico
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

/**
 * Cria uma nova presença para um curso
 * Inclui validações de horários, horas disponíveis e conflitos
 * Apenas formadores podem criar presenças
 */
exports.criarPresenca = async (req, res) => {
  try {
    const { id_curso, data_inicio, hora_inicio, data_fim, hora_fim, codigo } = req.body;
    const id_formador = req.user.id_utilizador;

    // Validar se data/hora de fim é posterior ao início
    const inicioTime = new Date(`${data_inicio}T${hora_inicio}`);
    const fimTime = new Date(`${data_fim}T${hora_fim}`);

    if (fimTime <= inicioTime) {
      return res.status(400).json({
        message: "Data/hora de fim inválida",
        detalhe: "A data/hora de fim deve ser posterior à data/hora de início"
      });
    }

    // Verificar se já existe uma presença ativa para este curso
    const agora = new Date();

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

    // Verificar se a nova presença não excede as horas disponíveis do curso
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Calcular horas já utilizadas
    const presencas = await Curso_Presenca.findAll({
      where: { id_curso }
    });

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

    // Verificar se ultrapassa a duração total do curso
    if (horasUtilizadas + diferencaHorasNovo > curso.duracao) {
      return res.status(400).json({
        message: "A presença não pode ser criada",
        detalhe: `Ultrapassaria a duração total do curso. Restam ${(curso.duracao - horasUtilizadas).toFixed(2)} horas disponíveis.`
      });
    }

    // Criar a nova presença
    const novaPresenca = await Curso_Presenca.create({
      id_curso,
      data_inicio,
      hora_inicio,
      data_fim,
      hora_fim,
      codigo
    });

    // Marcar presença automaticamente para o formador que criou
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

/**
 * Permite a um utilizador marcar presença numa sessão ativa
 * Suporta reutilização de códigos entre diferentes sessões
 * Verifica se a presença está dentro do período válido
 */
exports.marcarPresenca = async (req, res) => {
  try {
    const { id_curso, id_utilizador, codigo } = req.body;

    const agoraServidor = new Date();

    // Buscar todas as presenças com o código fornecido no curso específico
    const presencasComCodigo = await Curso_Presenca.findAll({
      where: {
        id_curso,
        codigo
      },
      order: [['data_inicio', 'DESC'], ['hora_inicio', 'DESC']]
    });

    if (presencasComCodigo.length === 0) {
      return res.status(400).json({
        message: "Código inválido ou presença não encontrada",
        detalhes: "Verifica se o código está correto e se pertence ao curso atual"
      });
    }

    // Encontrar a presença que está ativa no momento
    let presencaValida = null;

    for (const presenca of presencasComCodigo) {
      const dataHoraInicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
      const dataHoraFim = new Date(`${presenca.data_fim}T${presenca.hora_fim}`);

      // Verificar se a presença está no período válido
      if (dataHoraInicio <= agoraServidor && dataHoraFim > agoraServidor) {
        // Verificar se o utilizador já marcou presença nesta sessão específica
        const presencaExistente = await Formando_Presenca.findOne({
          where: {
            id_curso_presenca: presenca.id_curso_presenca,
            id_utilizador
          }
        });

        if (!presencaExistente) {
          presencaValida = presenca;
          break;
        }
      }
    }

    if (!presencaValida) {
      // Verificar se todas as presenças com este código já foram marcadas pelo utilizador
      const todasMarcadas = await Promise.all(
        presencasComCodigo.map(async (presenca) => {
          const presencaExistente = await Formando_Presenca.findOne({
            where: {
              id_curso_presenca: presenca.id_curso_presenca,
              id_utilizador
            }
          });
          return !!presencaExistente;
        })
      );

      if (todasMarcadas.every(marcada => marcada)) {
        return res.status(400).json({
          message: "Presença já registada",
          detalhes: "Já marcou presença em todas as sessões com este código"
        });
      }

      // Verificar se há alguma presença que ainda não começou
      const presencaFutura = presencasComCodigo.find(presenca => {
        const dataHoraInicio = new Date(`${presenca.data_inicio}T${presenca.hora_inicio}`);
        return dataHoraInicio > agoraServidor;
      });

      if (presencaFutura) {
        return res.status(400).json({
          message: "Esta presença ainda não começou",
          detalhes: `A presença começará às ${presencaFutura.hora_inicio} do dia ${presencaFutura.data_inicio}`
        });
      }

      return res.status(400).json({
        message: "Nenhuma presença ativa encontrada",
        detalhes: "Todas as presenças com este código já expiraram ou já marcou presença"
      });
    }

    // Calcular a duração da presença para estatísticas
    const dataHoraInicio = new Date(`${presencaValida.data_inicio}T${presencaValida.hora_inicio}`);
    const dataHoraFim = new Date(`${presencaValida.data_fim}T${presencaValida.hora_fim}`);
    const diferencaMs = dataHoraFim - dataHoraInicio;
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);

    // Registar a presença na base de dados
    const novaPresenca = await Formando_Presenca.create({
      id_curso_presenca: presencaValida.id_curso_presenca,
      id_utilizador,
      presenca: true,
      duracao: diferencaHoras
    });

    const minutosRestantes = Math.floor((dataHoraFim - agoraServidor) / (1000 * 60));

    res.status(201).json({
      success: true,
      message: "Presença marcada com sucesso!",
      data: novaPresenca,
      presenca_info: {
        id_curso_presenca: presencaValida.id_curso_presenca,
        data_inicio: presencaValida.data_inicio,
        hora_inicio: presencaValida.hora_inicio,
        data_fim: presencaValida.data_fim,
        hora_fim: presencaValida.hora_fim,
        minutos_restantes: minutosRestantes
      }
    });
  } catch (error) {
    console.error("Erro ao marcar presença:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      detalhes: "Ocorreu um erro ao processar a marcação de presença",
      erro: error.message
    });
  }
};

/**
 * Atualiza dados de uma presença existente
 * Funcionalidade restrita a administradores
 * Valida horários antes de aplicar alterações
 */
exports.atualizarPresenca = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, data_inicio, hora_inicio, data_fim, hora_fim } = req.body;

    // Verificar se a presença existe
    const presenca = await Curso_Presenca.findByPk(id);
    if (!presenca) {
      return res.status(404).json({ message: "Presença não encontrada" });
    }

    // Validar se data/hora de fim é posterior ao início
    const inicioTime = new Date(`${data_inicio}T${hora_inicio}`);
    const fimTime = new Date(`${data_fim}T${hora_fim}`);

    if (fimTime <= inicioTime) {
      return res.status(400).json({
        message: "Data/hora de fim inválida",
        detalhe: "A data/hora de fim deve ser posterior à data/hora de início"
      });
    }

    // Aplicar as alterações
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