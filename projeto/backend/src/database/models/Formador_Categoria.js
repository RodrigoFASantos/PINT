// =============================================================================
// MODELO: CATEGORIAS DOS FORMADORES
// =============================================================================
// Define as categorias gerais de formação nas quais cada formador está habilitado
// Permite controlar quais tipos de cursos cada formador pode lecionar

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * Tabela de associação entre formadores e categorias gerais de conhecimento
 * 
 * Esta tabela implementa a relação muitos-para-muitos entre formadores e categorias,
 * permitindo que:
 * - Um formador possa ter habilitação em múltiplas categorias
 * - Uma categoria possa ter múltiplos formadores habilitados
 * 
 * As categorias representam áreas amplas de conhecimento (ex: Informática, Gestão,
 * Saúde) enquanto as áreas (tabela FormadorArea) representam especializações mais
 * específicas dentro de cada categoria.
 * 
 * Estrutura de controlo:
 * - Índice único previne duplicação de associações
 * - Data de associação permite auditoria e histórico
 * - Referências com integridade garantem consistência
 */
const FormadorCategoria = sequelize.define("formador_categoria", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da associação formador-categoria"
  },
  id_formador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "utilizadores",
      key: "id_utilizador",
    },
    comment: "Referência ao formador que recebe a habilitação na categoria"
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "categorias",
      key: "id_categoria",
    },
    comment: "Referência à categoria geral na qual o formador está habilitado"
  },
  data_associacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data em que a habilitação foi atribuída - utilizada para auditoria e histórico"
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Observações adicionais sobre a habilitação (certificações, experiência, etc.)"
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: "Indica se a habilitação está ativa - permite desativar sem eliminar o histórico"
  }
}, {
  tableName: "formador_categoria",
  timestamps: false,
  indexes: [
    {
      // Índice único para prevenir duplicação da mesma associação
      unique: true,
      fields: ['id_formador', 'id_categoria'],
      name: 'unique_formador_categoria'
    },
    {
      // Índice para consultas eficientes por formador
      fields: ['id_formador'],
      name: 'idx_formador_categoria_formador'
    },
    {
      // Índice para consultas eficientes por categoria
      fields: ['id_categoria'],
      name: 'idx_formador_categoria_categoria'
    },
    {
      // Índice para filtrar apenas habilitações ativas
      fields: ['ativo'],
      name: 'idx_formador_categoria_ativo'
    },
    {
      // Índice composto para consultas com filtro de ativo
      fields: ['id_formador', 'ativo'],
      name: 'idx_formador_categoria_formador_ativo'
    }
  ],
  comment: "Associações entre formadores e categorias gerais de especialização"
});

/**
 * Métodos estáticos para operações comuns
 */

/**
 * Obtém todas as categorias ativas de um formador
 * @param {number} formadorId - ID do formador
 * @returns {Promise<Array>} Lista de categorias ativas
 */
FormadorCategoria.getCategoriasAtivasFormador = async function(formadorId) {
  return await this.findAll({
    where: {
      id_formador: formadorId,
      ativo: true
    },
    order: [['data_associacao', 'DESC']]
  });
};

/**
 * Obtém todos os formadores ativos de uma categoria
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<Array>} Lista de formadores ativos na categoria
 */
FormadorCategoria.getFormadoresAtivosCategoria = async function(categoriaId) {
  return await this.findAll({
    where: {
      id_categoria: categoriaId,
      ativo: true
    },
    order: [['data_associacao', 'DESC']]
  });
};

/**
 * Verifica se um formador tem habilitação ativa numa categoria
 * @param {number} formadorId - ID do formador
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<boolean>} True se tiver habilitação ativa
 */
FormadorCategoria.temHabilitacaoAtiva = async function(formadorId, categoriaId) {
  const associacao = await this.findOne({
    where: {
      id_formador: formadorId,
      id_categoria: categoriaId,
      ativo: true
    }
  });
  return !!associacao;
};

/**
 * Desativa uma associação sem eliminar o histórico
 * @param {number} formadorId - ID do formador
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<boolean>} True se foi desativada com sucesso
 */
FormadorCategoria.desativarAssociacao = async function(formadorId, categoriaId) {
  const [affectedRows] = await this.update(
    { ativo: false },
    {
      where: {
        id_formador: formadorId,
        id_categoria: categoriaId
      }
    }
  );
  return affectedRows > 0;
};

/**
 * Reativa uma associação previamente desativada
 * @param {number} formadorId - ID do formador
 * @param {number} categoriaId - ID da categoria
 * @returns {Promise<boolean>} True se foi reativada com sucesso
 */
FormadorCategoria.reativarAssociacao = async function(formadorId, categoriaId) {
  const [affectedRows] = await this.update(
    { ativo: true },
    {
      where: {
        id_formador: formadorId,
        id_categoria: categoriaId
      }
    }
  );
  return affectedRows > 0;
};

/**
 * Métodos de instância para manipulação individual
 */

/**
 * Desativa esta associação específica
 * @returns {Promise<FormadorCategoria>} Instância atualizada
 */
FormadorCategoria.prototype.desativar = async function() {
  this.ativo = false;
  return await this.save();
};

/**
 * Reativa esta associação específica
 * @returns {Promise<FormadorCategoria>} Instância atualizada
 */
FormadorCategoria.prototype.reativar = async function() {
  this.ativo = true;
  return await this.save();
};

/**
 * Adiciona observações à associação
 * @param {string} novasObservacoes - Texto das observações
 * @returns {Promise<FormadorCategoria>} Instância atualizada
 */
FormadorCategoria.prototype.adicionarObservacoes = async function(novasObservacoes) {
  this.observacoes = novasObservacoes;
  return await this.save();
};

module.exports = FormadorCategoria;