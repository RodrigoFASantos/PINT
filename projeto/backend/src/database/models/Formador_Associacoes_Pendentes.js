// =============================================================================
// MODELO: ASSOCIAÇÕES PENDENTES DE FORMADORES
// =============================================================================
// Armazena temporariamente as especializações solicitadas por utilizadores
// que se candidataram a formador mas ainda não foram aprovados pelo sistema

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

/**
 * Tabela temporária para guardar especializações de candidatos a formador
 * 
 * Esta tabela funciona como um armazenamento temporário das categorias, áreas
 * e cursos que um candidato a formador pretende lecionar. Os dados ficam aqui
 * guardados até a candidatura ser aprovada ou rejeitada pelos administradores.
 * 
 * Fluxo de funcionamento:
 * 1. Candidato regista-se como formador e especifica especializações
 * 2. Dados ficam armazenados nesta tabela enquanto pendente
 * 3. Se aprovado: dados são transferidos para tabelas definitivas
 * 4. Se rejeitado: registo é eliminado da tabela de pendentes
 * 
 * Utilização de JSONB permite flexibilidade na estrutura dos dados
 * e facilita queries complexas sobre as especializações solicitadas.
 */
const FormadorAssociacoesPendentes = sequelize.define("formador_associacoes_pendentes", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Identificador único da associação pendente"
  },
  id_pendente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "User_Pendente",
      key: "id",
    },
    unique: true, // Cada utilizador pendente só pode ter uma entrada
    comment: "Referência ao utilizador pendente que fez a candidatura a formador"
  },
  categorias: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        // Valida que é um array e que todos os elementos são números
        if (value !== null && (!Array.isArray(value) || !value.every(id => Number.isInteger(id)))) {
          throw new Error('Categorias deve ser um array de IDs numéricos');
        }
      }
    },
    comment: "Array com IDs das categorias nas quais o candidato se especializa (formato JSON)"
  },
  areas: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        // Valida que é um array e que todos os elementos são números
        if (value !== null && (!Array.isArray(value) || !value.every(id => Number.isInteger(id)))) {
          throw new Error('Áreas deve ser um array de IDs numéricos');
        }
      }
    },
    comment: "Array com IDs das áreas específicas nas quais tem especialização (formato JSON)"
  },
  cursos: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        // Valida que é um array e que todos os elementos são números
        if (value !== null && (!Array.isArray(value) || !value.every(id => Number.isInteger(id)))) {
          throw new Error('Cursos deve ser um array de IDs numéricos');
        }
      }
    },
    comment: "Array com IDs dos cursos específicos que o candidato pode lecionar (formato JSON)"
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data de criação da candidatura - utilizada para limpeza automática de registos expirados"
  }
}, {
  tableName: "formador_associacoes_pendentes",
  timestamps: false,
  indexes: [
    {
      // Índice único para garantir uma associação por candidato
      unique: true,
      fields: ['id_pendente'],
      name: 'unique_pendente_associacao'
    },
    {
      // Índice para consultas por data de criação (limpeza automática)
      fields: ['created_at'],
      name: 'idx_associacoes_pendentes_created_at'
    }
  ],
  comment: "Especializações temporárias solicitadas por candidatos a formador"
});

/**
 * Métodos de instância para manipulação das especializações
 */

/**
 * Adiciona categoria à lista de especializações solicitadas
 * @param {number} categoriaId - ID da categoria a adicionar
 */
FormadorAssociacoesPendentes.prototype.adicionarCategoria = function(categoriaId) {
  if (!this.categorias.includes(categoriaId)) {
    this.categorias.push(categoriaId);
  }
};

/**
 * Remove categoria da lista de especializações solicitadas
 * @param {number} categoriaId - ID da categoria a remover
 */
FormadorAssociacoesPendentes.prototype.removerCategoria = function(categoriaId) {
  this.categorias = this.categorias.filter(id => id !== categoriaId);
};

/**
 * Adiciona área específica à lista de especializações
 * @param {number} areaId - ID da área a adicionar
 */
FormadorAssociacoesPendentes.prototype.adicionarArea = function(areaId) {
  if (!this.areas.includes(areaId)) {
    this.areas.push(areaId);
  }
};

/**
 * Remove área específica da lista de especializações
 * @param {number} areaId - ID da área a remover
 */
FormadorAssociacoesPendentes.prototype.removerArea = function(areaId) {
  this.areas = this.areas.filter(id => id !== areaId);
};

/**
 * Verifica se o candidato tem especializações em determinada categoria
 * @param {number} categoriaId - ID da categoria a verificar
 * @returns {boolean} True se tiver especialização na categoria
 */
FormadorAssociacoesPendentes.prototype.temCategoria = function(categoriaId) {
  return this.categorias.includes(categoriaId);
};

/**
 * Verifica se o candidato tem especialização em determinada área
 * @param {number} areaId - ID da área a verificar
 * @returns {boolean} True se tiver especialização na área
 */
FormadorAssociacoesPendentes.prototype.temArea = function(areaId) {
  return this.areas.includes(areaId);
};

/**
 * Retorna o total de especializações solicitadas
 * @returns {Object} Contadores das especializações
 */
FormadorAssociacoesPendentes.prototype.getEstatisticas = function() {
  return {
    totalCategorias: this.categorias.length,
    totalAreas: this.areas.length,
    totalCursos: this.cursos.length,
    totalEspecializacoes: this.categorias.length + this.areas.length + this.cursos.length
  };
};

module.exports = FormadorAssociacoesPendentes;