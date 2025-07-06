// =============================================================================
// MODELO: CURSOS DE FORMAÇÃO (VERSÃO CORRIGIDA)
// =============================================================================
// Modelo corrigido que corresponde à estrutura real da base de dados

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Curso = sequelize.define("curso", {
  id_curso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Nome do curso"
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Descrição detalhada do curso"
  },
  tipo: {
    type: DataTypes.ENUM("sincrono", "assincrono"),
    allowNull: false,
    comment: "Tipo: síncrono (horário fixo) ou assíncrono (auto-ritmo)"
  },
  vagas: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Número máximo de vagas (null = sem limite)"
  },
  duracao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Duração do curso em horas"
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "Data de início do curso"
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "Data de fim do curso"
  },
  estado: {
    type: DataTypes.ENUM("planeado", "em_curso", "terminado"),
    allowNull: false,
    defaultValue: "planeado",
    comment: "Estado atual do curso"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se o curso está ativo/visível"
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Formador responsável pelo curso"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Categoria à qual o curso pertence"
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "areas",
      key: "id_area",
    },
    comment: "Área específica dentro da categoria"
  },
  id_topico_area: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "topico_area",
      key: "id_topico",
    },
    comment: "Tópico de discussão associado ao curso"
  },
  imagem_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para a imagem de capa do curso"
  },
  dir_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Caminho para o diretório de ficheiros do curso"
  }
}, {
  tableName: "curso",
  timestamps: false, // ✅ CRÍTICO: Desativar timestamps automáticos
});

/**
 * Métodos estáticos úteis para operações comuns
 */

/**
 * Obtém cursos ativos disponíveis para inscrição
 */
Curso.getCursosDisponiveis = async function() {
  return await this.findAll({
    where: {
      ativo: true,
      data_inicio: {
        [require('sequelize').Op.gt]: new Date()
      }
    },
    order: [['data_inicio', 'ASC']]
  });
};

/**
 * Obtém cursos por formador
 */
Curso.getCursosPorFormador = async function(formadorId) {
  return await this.findAll({
    where: {
      id_formador: formadorId,
      ativo: true
    },
    order: [['data_inicio', 'DESC']]
  });
};

/**
 * Conta vagas disponíveis num curso
 */
Curso.prototype.vagasDisponiveis = async function() {
  if (this.tipo === 'assincrono' || !this.vagas) {
    return null; // Sem limite
  }
  
  const Inscricao_Curso = require('./Inscricao_Curso');
  const inscricoesAtivas = await Inscricao_Curso.count({
    where: {
      id_curso: this.id_curso,
      estado: 'inscrito'
    }
  });
  
  return Math.max(0, this.vagas - inscricoesAtivas);
};

/**
 * Verifica se o curso ainda aceita inscrições
 */
Curso.prototype.aceitaInscricoes = function() {
  if (!this.ativo) return false;
  
  const agora = new Date();
  const dataInicio = new Date(this.data_inicio);
  
  return agora < dataInicio;
};

/**
 * Calcula o estado atual do curso baseado nas datas
 */
Curso.prototype.estadoAtual = function() {
  const agora = new Date();
  const dataInicio = new Date(this.data_inicio);
  const dataFim = new Date(this.data_fim);
  
  if (agora < dataInicio) {
    return 'agendado';
  } else if (agora >= dataInicio && agora <= dataFim) {
    return 'em_curso';
  } else {
    return 'terminado';
  }
};

module.exports = Curso;