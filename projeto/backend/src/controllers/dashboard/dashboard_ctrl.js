const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Avaliacao = require("../../database/models/Avaliacao");
const { Op } = require("sequelize");

// Estatísticas gerais
const getEstatisticas = async (req, res) => {
  try {
    const totalUtilizadores = await User.count();
    const totalFormadores = await User.count({ where: { id_cargo: 2 } });
    const totalFormandos = await User.count({ where: { id_cargo: 3 } });
    
    const totalCursos = await Curso.count();
    const cursosAtivos = await Curso.count({ where: { estado: 'em_curso', ativo: true } });
    
    const totalInscricoes = await Inscricao_Curso.count();
    
    // Cursos que terminam em breve (próximos 30 dias)
    const dataAtual = new Date();
    const data30Dias = new Date();
    data30Dias.setDate(data30Dias.getDate() + 30);
    
    const cursosFinalizar = await Curso.count({
      where: {
        data_fim: {
          [Op.between]: [dataAtual, data30Dias]
        },
        estado: 'em_curso'
      }
    });
    
    res.json({
      utilizadores: {
        total: totalUtilizadores,
        formadores: totalFormadores,
        formandos: totalFormandos
      },
      cursos: {
        total: totalCursos,
        ativos: cursosAtivos,
        finalizandoEmBreve: cursosFinalizar
      },
      inscricoes: {
        total: totalInscricoes
      }
    });
  } catch (error) {
    console.error("Erro ao procurar estatísticas:", error);
    res.status(500).json({ message: "Erro ao procurar estatísticas" });
  }
};

module.exports = { getEstatisticas };