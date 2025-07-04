// =============================================================================
// MODELO: CURSOS DE FORMAÇÃO
// =============================================================================
// Modelo principal que define os cursos disponíveis na plataforma
// Suporta cursos síncronos (presenciais/horário fixo) e assíncronos (auto-ritmo)

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
  timestamps: false,
});

module.exports = Curso;