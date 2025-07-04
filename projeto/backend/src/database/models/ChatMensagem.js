// =============================================================================
// MODELO: MENSAGENS DE CHAT
// =============================================================================
// Sistema de mensagens de chat em tempo real para cada tópico
// Suporta texto, anexos (imagens, vídeos, ficheiros) e sistema de likes/dislikes

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatMensagem = sequelize.define('chat_mensagens', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  // Campo virtual para compatibilidade com código antigo
  id_comentario: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id; // Retorna o valor de 'id' quando 'id_comentario' é acedido
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
    },
    comment: "Tópico ao qual a mensagem pertence"
  },
  id_utilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'utilizadores',
      key: 'id_utilizador'
    },
    comment: "Utilizador que enviou a mensagem"
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Conteúdo textual da mensagem (pode ser null se só tiver anexo)"
  },
  anexo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "URL do ficheiro anexo"
  },
  anexo_nome: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Nome original do ficheiro anexo"
  },
  tipo_anexo: {
    type: DataTypes.ENUM('imagem', 'video', 'file'),
    allowNull: true,
    comment: "Tipo de anexo da mensagem"
  },
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Data e hora de criação da mensagem"
  },
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de likes da mensagem"
  },
  dislikes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "Contador de dislikes da mensagem"
  },
  foi_denunciada: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se a mensagem foi denunciada"
  },
  oculta: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indica se a mensagem está oculta (moderação)"
  },
  // Campos virtuais para manter compatibilidade com interfaces antigas
  denuncias: {
    type: DataTypes.VIRTUAL,
    get() {
      return 0;
    }
  },
  motivo_denuncia: {
    type: DataTypes.VIRTUAL,
    get() {
      return null;
    }
  }
}, {
  tableName: 'chat_mensagens',
  timestamps: false,
  hooks: {
    // Hook que garante compatibilidade com código que usa id_comentario
    afterFind: (result) => {
      if (!result) return result;
      
      // Para arrays de resultados (findAll)
      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item && !item.id_comentario) {
            item.id_comentario = item.id;
          }
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
        result.denuncias = 0;
        result.motivo_denuncia = null;
      }
      
      return result;
    }
  }
});

module.exports = ChatMensagem;