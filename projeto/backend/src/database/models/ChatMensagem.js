const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatMensagem = sequelize.define('chat_mensagens', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_comentario: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id; // Retorna o valor de 'id' quando 'id_comentario' é acessado
    },
    set(value) {
      // Não faz nada, apenas para compatibilidade
    }
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'topico_area',
      key: 'id_topico'
    }
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    }
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true // Permite mensagens só com anexo
  },
  anexo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  anexo_nome: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_anexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  foi_denunciada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  oculta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Campos adicionados como virtuais para manter compatibilidade
  denuncias: {
    type: DataTypes.VIRTUAL,
    get() {
      return 0; // Retorna um valor padrão para manter compatibilidade
    }
  },
  motivo_denuncia: {
    type: DataTypes.VIRTUAL,
    get() {
      return null; // Retorna um valor padrão para manter compatibilidade
    }
  }
}, {
  tableName: 'chat_mensagens',
  timestamps: false,
  hooks: {
    // Hook para garantir que os dados sejam consistentes com a interface
    afterFind: (result) => {
      if (!result) return result;
      
      // Para arrays de resultados (findAll)
      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item && !item.id_comentario) {
            item.id_comentario = item.id;
          }
          // Garantir que denuncias e motivo_denuncia estejam definidos
          if (item) {
            item.denuncias = 0;
            item.motivo_denuncia = null;
          }
        });
      } 
      // Para resultados únicos (findOne, findByPk)
      else if (result) {
        if (!result.id_comentario) {
          result.id_comentario = result.id;
        }
        // Garantir que denuncias e motivo_denuncia estejam definidos
        result.denuncias = 0;
        result.motivo_denuncia = null;
      }
      
      return result;
    }
  }
});

module.exports = ChatMensagem;