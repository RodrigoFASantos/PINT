const cron = require('node-cron');
const { Op } = require('sequelize');
const { sequelize } = require("../config/db");
require('../database/associations');

/**
 * Sistema de agendamento automático de tarefas
 * Gere a actualização automática dos estados dos cursos
 */

// Importação dos modelos necessários
let Curso, Inscricao_Curso;

try {
  Curso = require('../database/models/Curso');
  Inscricao_Curso = require('../database/models/Inscricao_Curso');
} catch (error) {
  console.error('Erro ao carregar modelos:', error.message);
}

/**
 * Actualiza automaticamente os estados dos cursos baseado nas datas
 * Altera cursos de 'planeado' para 'em_curso' e de 'em_curso' para 'terminado'
 */
const atualizarEstadosCursos = async () => {
  try {
    if (!Curso) {
      console.warn('Modelo Curso não disponível');
      return;
    }

    const hoje = new Date();

    // Actualizar cursos para estado "em_curso"
    const cursosParaIniciar = await Curso.findAll({
      where: {
        estado: 'planeado',
        data_inicio: { [Op.lte]: hoje }
      }
    });

    for (const curso of cursosParaIniciar) {
      await curso.update({ estado: 'em_curso' });
      console.log(`Curso "${curso.nome}" actualizado para "em_curso"`);
    }

    // Actualizar cursos para estado "terminado"
    const cursosParaTerminar = await Curso.findAll({
      where: {
        estado: 'em_curso',
        data_fim: { [Op.lte]: hoje }
      }
    });

    for (const curso of cursosParaTerminar) {
      await curso.update({ estado: 'terminado' });
      console.log(`Curso "${curso.nome}" actualizado para "terminado"`);
    }

  } catch (error) {
    console.error('Erro ao actualizar estados dos cursos:', error.message);
    throw error;
  }
};

/**
 * Inicializa o sistema de agendamento automático
 * Configura tarefas para execução diária à meia-noite
 */
const iniciarAgendamentos = () => {
  // Execução inicial para garantir estados correctos
  atualizarEstadosCursos().catch(err =>
    console.error('Erro na actualização inicial:', err.message)
  );

  // Agendamento diário à meia-noite (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      await atualizarEstadosCursos();
      console.log('Actualização automática de estados executada com sucesso');
    } catch (error) {
      console.error('Erro no agendamento automático:', error.message);
    }
  });

  console.log('Sistema de agendamento automático inicializado');
};

module.exports = { iniciarAgendamentos };