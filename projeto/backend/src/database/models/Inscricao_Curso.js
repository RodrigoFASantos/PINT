// =============================================================================
// MODELO: INSCRIÇÕES EM CURSOS (VERSÃO SIMPLIFICADA)
// =============================================================================
// Modelo simplificado que corresponde à estrutura real da base de dados

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * Tabela central para gestão de inscrições de formandos em cursos
 * Versão simplificada com apenas os campos essenciais que existem na BD
 */
const Inscricao_Curso = sequelize.define("Inscricao_Curso", {
  id_inscricao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da inscrição no curso"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Referência ao formando que se inscreveu no curso"
  },
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "curso",
      key: "id_curso",
    },
    comment: "Referência ao curso no qual o formando se inscreveu"
  },
  data_inscricao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora exata da inscrição no curso"
  },
  estado: {
    type: DataTypes.ENUM("inscrito", "cancelado"),
    allowNull: false,
    defaultValue: "inscrito",
    comment: "Estado atual da inscrição - controla se está ativa ou foi cancelada"
  },
  motivacao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Motivação expressa pelo formando na altura da inscrição"
  },
  expectativas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Expectativas do formando relativamente ao curso e aprendizagem"
  },
  nota_final: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: "Nota final obtida no curso (escala 0.00 a 20.00)"
  },
  certificado_gerado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se o certificado de conclusão foi gerado"
  },
  motivo_cancelamento: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Motivo detalhado do cancelamento da inscrição (se aplicável)"
  },
  data_cancelamento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Data e hora do cancelamento da inscrição"
  },
  cancelado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "ID do utilizador que efetuou o cancelamento"
  }
}, {
  tableName: "inscricoes_cursos",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_utilizador', 'id_curso'],
      name: 'unique_utilizador_curso'
    },
    {
      fields: ['id_utilizador'],
      name: 'idx_inscricoes_utilizador'
    },
    {
      fields: ['id_curso'],
      name: 'idx_inscricoes_curso'
    },
    {
      fields: ['estado'],
      name: 'idx_inscricoes_estado'
    }
  ],
  comment: "Registo de inscrições de formandos em cursos"
});

/**
 * Métodos estáticos para operações comuns
 */

/**
 * Obtém todas as inscrições ativas de um utilizador
 */
Inscricao_Curso.getInscricoesAtivas = async function(utilizadorId) {
  return await this.findAll({
    where: {
      id_utilizador: utilizadorId,
      estado: 'inscrito'
    },
    order: [['data_inscricao', 'DESC']]
  });
};

/**
 * Verifica se um utilizador está inscrito num curso
 */
Inscricao_Curso.estaInscrito = async function(utilizadorId, cursoId) {
  const inscricao = await this.findOne({
    where: {
      id_utilizador: utilizadorId,
      id_curso: cursoId,
      estado: 'inscrito'
    }
  });
  return !!inscricao;
};

/**
 * Conta o número de inscrições ativas num curso
 */
Inscricao_Curso.contarInscricoesAtivas = async function(cursoId) {
  return await this.count({
    where: {
      id_curso: cursoId,
      estado: 'inscrito'
    }
  });
};

/**
 * Métodos de instância
 */

/**
 * Cancela esta inscrição específica
 */
Inscricao_Curso.prototype.cancelar = async function(motivo, canceladoPor) {
  this.estado = 'cancelado';
  this.motivo_cancelamento = motivo;
  this.data_cancelamento = new Date();
  this.cancelado_por = canceladoPor;
  return await this.save();
};

/**
 * Atualiza a nota final
 */
Inscricao_Curso.prototype.concluir = async function(nota) {
  this.nota_final = nota;
  return await this.save();
};

module.exports = Inscricao_Curso;