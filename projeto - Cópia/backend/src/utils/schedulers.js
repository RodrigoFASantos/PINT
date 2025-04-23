const cron = require('node-cron');
const { Op } = require('sequelize');
const sequelize = require('../../config/db');
require('../database/associations');

// Importar os modelos necessários
let Curso, Inscricao_Curso;

try {
  Curso = require('../database/models/Curso');
  Inscricao_Curso = require('../database/models/Inscricao_Curso');
} catch (error) {
  console.error('Erro ao importar modelos:', error.message);
}

// Função para atualizar os estados dos cursos
const atualizarEstadosCursos = async () => {
  try {
    if (!Curso) {
      console.warn('Modelo Curso não disponível para atualizar estados');
      return;
    }

    const hoje = new Date();
    
    // Atualizar para "em_curso"
    const cursosParaIniciar = await Curso.findAll({
      where: {
        estado: 'planeado', 
        data_inicio: { [Op.lte]: hoje }
      }
    });

    for (const curso of cursosParaIniciar) {
      await curso.update({ estado: 'em_curso' });
      console.log(`Curso ${curso.id_curso} - ${curso.nome} atualizado para "em_curso"`);
    }

    // Atualizar para "terminado"
    const cursosParaTerminar = await Curso.findAll({
      where: {
        estado: 'em_curso', 
        data_fim: { [Op.lte]: hoje }
      }
    });

    for (const curso of cursosParaTerminar) {
      await curso.update({ estado: 'terminado' });
      console.log(`Curso ${curso.id_curso} - ${curso.nome} atualizado para "terminado"`);
    }

  } catch (error) {
    console.error('Erro ao atualizar estados dos cursos:', error);
    throw error;
  }
};

// Iniciar agendamentos
const iniciarAgendamentos = () => {
  // Executar uma vez no início para garantir estados corretos
  atualizarEstadosCursos().catch(err => 
    console.error('Erro na execução inicial de atualização de estados:', err)
  );

  // Agendar para executar todos os dias à meia-noite
  cron.schedule('0 0 * * *', async () => {
    try {
      await atualizarEstadosCursos();
      console.log('Agendamento de atualização de estados executado com sucesso!');
    } catch (error) {
      console.error('Erro no agendamento de atualização de estados:', error);
    }
  });

  console.log('Agendamento para atualização de estados dos cursos inicializado');
};

module.exports = { iniciarAgendamentos };