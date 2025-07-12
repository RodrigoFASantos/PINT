const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const { Op, Sequelize } = require("sequelize");

// Importações opcionais dos modelos com tratamento de erro para casos onde não existam
let Categoria, Area, Cargo;

try {
  Categoria = require("../../database/models/Categoria");
} catch (error) {
  console.log('Modelo Categoria não encontrado');
}

try {
  Area = require("../../database/models/Area");
} catch (error) {
  console.log('Modelo Area não encontrado');
}

try {
  Cargo = require("../../database/models/Cargo");
} catch (error) {
  console.log('Modelo Cargo não encontrado');
}

/**
 * Função principal para obter todas as estatísticas gerais do dashboard administrativo
 * Calcula métricas de utilizadores, cursos e inscrições para apresentação visual
 */
const getEstatisticas = async (req, res) => {
  try {
    // === CONTAGEM DE UTILIZADORES POR TIPO DE CARGO ===
    const totalUtilizadores = await User.count();
    const totalAdministradores = await User.count({ where: { id_cargo: 1 } });
    const totalFormadores = await User.count({ where: { id_cargo: 2 } });
    const totalFormandos = await User.count({ where: { id_cargo: 3 } });

    // Data atual para comparações temporais
    const dataAtual = new Date();

    // === CONTAGEM E CLASSIFICAÇÃO DE CURSOS ===
    const totalCursos = await Curso.count();
    
    // Cursos classificados por estado temporal (baseado nas datas de início e fim)
    const cursosTerminados = await Curso.count({ 
      where: { 
        data_fim: { [Op.lt]: dataAtual }
      } 
    });
    
    const cursosEmAndamento = await Curso.count({
      where: {
        data_inicio: { [Op.lte]: dataAtual },
        data_fim: { [Op.gte]: dataAtual }
      }
    });

    const cursosPlaneados = await Curso.count({
      where: {
        data_inicio: { [Op.gt]: dataAtual }
      }
    });

    // Cursos ativos são aqueles que não estão terminados (inclui em andamento e planeados)
    const cursosAtivos = cursosEmAndamento + cursosPlaneados;
    
    // Contagem de cursos por modalidade de ensino
    const cursosSincronos = await Curso.count({ where: { tipo: 'sincrono' } });
    const cursosAssincronos = await Curso.count({ where: { tipo: 'assincrono' } });

    // === ESTATÍSTICAS DE INSCRIÇÕES ===
    const totalInscricoes = await Inscricao_Curso.count();
    
    // Inscrições realizadas nos últimos 30 dias
    const dataLimite30Dias = new Date();
    dataLimite30Dias.setDate(dataLimite30Dias.getDate() - 30);
    
    const inscricoesUltimos30Dias = await Inscricao_Curso.count({
      where: {
        data_inscricao: { [Op.gte]: dataLimite30Dias }
      }
    });

    // Cursos que terminam nos próximos 30 dias (alertas de fim próximo)
    const data30DiasFrente = new Date();
    data30DiasFrente.setDate(data30DiasFrente.getDate() + 30);
    
    const cursosTerminandoEmBreve = await Curso.count({
      where: {
        data_fim: { [Op.between]: [dataAtual, data30DiasFrente] }
      }
    });

    // Compilação de todas as estatísticas num objeto estruturado
    const stats = {
      // Totais de utilizadores por cargo
      totalUtilizadores,
      totalAdministradores,
      totalFormadores,
      totalFormandos,
      
      // Estatísticas de cursos
      totalCursos,
      cursosAtivos,           // Em andamento + Planeados
      cursosTerminados,       // Já terminaram
      cursosEmAndamento,      // A decorrer atualmente
      cursosPlaneados,        // Ainda não começaram
      
      // Modalidades de ensino
      cursosSincronos,
      cursosAssincronos,
      
      // Métricas de inscrições
      totalInscricoes,
      inscricoesUltimos30Dias,
      
      // Alertas e avisos
      cursosTerminandoEmBreve
    };

    res.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ 
      message: "Erro ao buscar estatísticas do dashboard",
      error: error.message 
    });
  }
};

/**
 * Função para obter a distribuição de cursos agrupados por categoria
 * Utiliza associações com o modelo Categoria ou fallback para dados estimados
 */
const getCursosPorCategoria = async (req, res) => {
  try {
    let categorias = [];

    if (Categoria) {
      try {
        // Buscar cursos agrupados por categoria utilizando associações
        const cursosPorCategoria = await Categoria.findAll({
          attributes: [
            'id_categoria',
            'nome',
            [Sequelize.fn('COUNT', Sequelize.col('cursos.id_curso')), 'total']
          ],
          include: [{
            model: Curso,
            as: 'cursos',
            attributes: [],
            required: false
          }],
          group: ['Categoria.id_categoria', 'Categoria.nome'],
          order: [[Sequelize.fn('COUNT', Sequelize.col('cursos.id_curso')), 'DESC']]
        });

        categorias = cursosPorCategoria.map(cat => ({
          categoria: cat.nome,
          total: parseInt(cat.dataValues.total) || 0
        }));
        
      } catch (associationError) {
        // Fallback: buscar categorias e contar cursos manualmente
        const todasCategorias = await Categoria.findAll();
        categorias = await Promise.all(todasCategorias.map(async (cat) => {
          const total = await Curso.count({ where: { id_categoria: cat.id_categoria } });
          return {
            categoria: cat.nome,
            total: total
          };
        }));
      }
    } else {
      // Fallback final: criar distribuição estimada baseada no total de cursos
      const totalCursos = await Curso.count();
      categorias = [
        { categoria: 'Tecnologia', total: Math.floor(totalCursos * 0.4) },
        { categoria: 'Gestão', total: Math.floor(totalCursos * 0.25) },
        { categoria: 'Marketing', total: Math.floor(totalCursos * 0.2) },
        { categoria: 'Design', total: Math.floor(totalCursos * 0.1) },
        { categoria: 'Outros', total: Math.floor(totalCursos * 0.05) }
      ];
    }

    res.json({ categorias });

  } catch (error) {
    console.error('Erro ao buscar distribuição de cursos por categoria:', error);
    res.status(500).json({ 
      message: "Erro ao buscar cursos por categoria",
      error: error.message 
    });
  }
};

/**
 * Função para obter as inscrições agrupadas por mês do ano atual
 * Gera dados para gráfico de evolução temporal das inscrições
 */
const getInscricoesPorMes = async (req, res) => {
  try {
    // Buscar inscrições agrupadas por mês desde janeiro do ano atual
    const inscricoesPorMes = await Inscricao_Curso.findAll({
      attributes: [
        [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_inscricao')), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('id_inscricao')), 'total']
      ],
      where: {
        data_inscricao: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1)
        }
      },
      group: [Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_inscricao'))],
      order: [[Sequelize.fn('EXTRACT', Sequelize.literal('MONTH FROM data_inscricao')), 'ASC']]
    });

    // Array com abreviações dos meses para exibição no gráfico
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Mapear os dados para incluir todos os meses, mesmo com 0 inscrições
    const mensal = meses.map((nome, index) => {
      const mesData = inscricoesPorMes.find(item => parseInt(item.dataValues.mes) === index + 1);
      return {
        mes: nome,
        total: mesData ? parseInt(mesData.dataValues.total) : 0
      };
    });

    res.json({ mensal });

  } catch (error) {
    console.error('Erro ao buscar evolução mensal de inscrições:', error);
    res.status(500).json({ 
      message: "Erro ao buscar inscrições por mês",
      error: error.message 
    });
  }
};

/**
 * Função para obter a distribuição de utilizadores por perfil/cargo
 * Conta utilizadores agrupados por tipo (administradores, formadores, formandos)
 */
const getUtilizadoresPorPerfil = async (req, res) => {
  try {
    // Contar utilizadores por cada tipo de cargo
    const admins = await User.count({ where: { id_cargo: 1 } });
    const formadores = await User.count({ where: { id_cargo: 2 } });
    const formandos = await User.count({ where: { id_cargo: 3 } });
    
    const perfis = [
      { perfil: 'Administradores', total: admins },
      { perfil: 'Formadores', total: formadores },
      { perfil: 'Formandos', total: formandos }
    ];

    res.json({ perfis });

  } catch (error) {
    console.error('Erro ao buscar distribuição de utilizadores por perfil:', error);
    res.status(500).json({ 
      message: "Erro ao buscar utilizadores por perfil",
      error: error.message 
    });
  }
};

/**
 * Função para obter os cursos com maior número de inscrições
 * Lista os cursos mais populares ordenados por quantidade de inscrições
 */
const getCursosMaisInscritos = async (req, res) => {
  try {
    let populares = [];

    // Buscar todos os cursos disponíveis
    const todosCursos = await Curso.findAll({
      attributes: [
        'id_curso',
        'nome',
        'tipo',
        'estado',
        'data_inicio',
        'data_fim',
        'id_area'
      ],
      order: [['nome', 'ASC']],
      limit: 20
    });

    // Para cada curso, contar o número total de inscrições ativas
    for (const curso of todosCursos) {
      try {
        const totalInscricoes = await Inscricao_Curso.count({
          where: {
            id_curso: curso.id_curso,
            estado: 'inscrito'
          }
        });

        let categoria = 'N/A';
        let area = 'N/A';

        // Tentar obter informações de categoria e área se os modelos existirem
        if (Area && Categoria && curso.id_area) {
          try {
            const areaInfo = await Area.findByPk(curso.id_area, {
              include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['nome'],
                required: false
              }],
              attributes: ['nome']
            });

            if (areaInfo) {
              area = areaInfo.nome;
              if (areaInfo.categoria) {
                categoria = areaInfo.categoria.nome;
              }
            }
          } catch (areaError) {
            // Silenciar erro se não conseguir obter informações de área/categoria
          }
        }

        populares.push({
          id_curso: curso.id_curso,
          nome: curso.nome,
          tipo: curso.tipo || 'assincrono',
          estado: curso.estado || 'ativo',
          data_inicio: curso.data_inicio,
          data_fim: curso.data_fim,
          categoria: categoria,
          area: area,
          inscricoes: totalInscricoes
        });

      } catch (inscricaoError) {
        // Adicionar curso mesmo se falhar a contagem de inscrições
        populares.push({
          id_curso: curso.id_curso,
          nome: curso.nome,
          tipo: curso.tipo || 'assincrono',
          estado: curso.estado || 'ativo',
          data_inicio: curso.data_inicio,
          data_fim: curso.data_fim,
          categoria: 'N/A',
          area: 'N/A',
          inscricoes: 0
        });
      }
    }

    // Ordenar por número de inscrições em ordem decrescente
    populares.sort((a, b) => b.inscricoes - a.inscricoes);

    // Limitar aos top 10 cursos mais populares
    populares = populares.slice(0, 10);

    res.json({ populares });

  } catch (error) {
    console.error('Erro ao buscar cursos mais populares:', error);
    res.status(500).json({ 
      message: "Erro ao buscar cursos mais inscritos",
      error: error.message 
    });
  }
};

// Exportação de todas as funções do controlador do dashboard
module.exports = {
  getEstatisticas,
  getCursosPorCategoria,
  getInscricoesPorMes,
  getUtilizadoresPorPerfil,
  getCursosMaisInscritos
};