const { Topico_Categoria, Categoria, Comentario_Topico, User, Area } = require('../../database/associations');
const { sendTopicRequestEmail } = require('../../utils/Email_Criar_Topico');
const uploadUtils = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');


const getAllTopicos = async (req, res) => {
  try {
    console.log('A iniciar busca de tópicos com includes completos...');
    
    // Abordagem mais robusta com includes e tratamento de erros
    const topicos = await Topico_Categoria.findAll({
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ['id_categoria', 'nome'],
          required: false
        },
        {
          model: Area,
          as: "area",
          attributes: ['id_area', 'nome'],
          required: false
        },
        {
          model: User,
          as: "criador",
          attributes: ['id_utilizador', 'nome', 'email'],
          required: false
        }
      ],
      order: [['data_criacao', 'DESC']]
    });
    
    console.log(`Encontrados ${topicos.length} tópicos com informações completas.`);
    
    // Converter para formato JSON plano com tratamento de valores nulos
    const topicosMapeados = topicos.map(topico => {
      const t = topico.get({ plain: true });
      
      // Adicionar campo id para compatibilidade com frontend
      t.id = t.id_topico;
      
      // Garantir que propriedades estejam sempre presentes
      if (!t.categoria) t.categoria = { nome: 'Não disponível' };
      if (!t.area) t.area = { nome: 'Não disponível' };
      if (!t.criador) t.criador = { nome: 'Utilizador desconhecido' };
      
      return t;
    });
    
    return res.status(200).json(topicosMapeados);
  } catch (error) {
    console.error('Erro ao listar tópicos:', error);
    console.error('Stack de erro completo:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar tópicos',
      error: error.message
    });
  }
};


const createTopico = async (req, res) => {
  try {
    console.log('=== DADOS DA REQUISIÇÃO PARA CRIAR TÓPICO ===');
    console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.id_utilizador || req.user.id);
    console.log('================================');

    const userId = req.user.id_utilizador || req.user.id;
    const { id_categoria, id_area, titulo, descricao } = req.body; // Adicionado id_area aqui


    console.log(`Valores extraídos: id_categoria=${id_categoria}, id_area=${id_area}, titulo="${titulo}", desc="${descricao?.substring(0, 20)}..."`);


    // Validação básica dos dados de entrada
    if (!id_categoria || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Categoria e título do tópico são obrigatórios',
      });
    }

    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
    }

    console.log(`A criar tópico "${titulo}" na categoria ${id_categoria}${id_area ? ', área ' + id_area : ''} pelo utilizador ${userId}`);

    // Criar o tópico incluindo id_area
    const novoTopico = await Topico_Categoria.create({
      id_categoria: id_categoria,
      id_area: id_area || null,
      criado_por: userId,
      titulo: titulo,
      descricao: descricao || '',
      data_criacao: new Date()
    });

    // Retornar o tópico criado
    return res.status(201).json({
      success: true,
      message: 'Tópico criado com sucesso',
      data: novoTopico,
    });
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar tópico',
      error: error.message,
    });
  }
};

// Solicitar a criação de um novo tópico (para utilizadores não admin/gestor)
const solicitarTopico = async (req, res) => {
  try {
    const userId = req.user.id_utilizador || req.user.id;
    const { id_categoria, titulo, descricao } = req.body;

    if (!id_categoria || !titulo) {
      return res.status(400).json({
        success: false,
        message: 'Categoria e título do tópico são obrigatórios',
      });
    }

    // Verificar se a categoria existe para obter o nome
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
    }

    // Dados do solicitante (utilizador atual)
    const solicitanteNome = req.user.nome || req.user.name || 'Utilizador';
    const solicitanteEmail = req.user.email;

    console.log(`Solicitação de novo tópico "${titulo}" na categoria ${id_categoria} por utilizador ${userId}`);

    // Enviar email de solicitação ao administrador
    await sendTopicRequestEmail(categoria.nome, titulo, descricao, { nome: solicitanteNome, email: solicitanteEmail });

    // Responder sucesso da solicitação (email enviado)
    return res.status(200).json({
      success: true,
      message: 'Solicitação de criação de tópico enviada com sucesso. Aguarde aprovação do administrador.',
    });
  } catch (error) {
    console.error('Erro ao solicitar criação de tópico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao solicitar criação de tópico',
      error: error.message,
    });
  }
};


// Atualizar um tópico existente
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o utilizador é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para atualizar este tópico'
      });
    }

    // Atualizar o tópico
    await topico.update({
      titulo: titulo || topico.titulo,
      descricao: descricao || topico.descricao
    });

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.to(`topico_${id}`).emit('topicoAtualizado', {
        id_topico: topico.id_topico,
        titulo: topico.titulo,
        descricao: topico.descricao
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tópico atualizado com sucesso',
      data: topico
    });
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tópico',
      error: error.message
    });
  }
};

// Remover um tópico
const deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    // Usar id_utilizador se disponível, caso contrário usar id
    const id_utilizador = req.user.id_utilizador || req.user.id;

    // Verificar se o tópico existe
    const topico = await Topico_Categoria.findByPk(id);
    if (!topico) {
      return res.status(404).json({
        success: false,
        message: 'Tópico não encontrado'
      });
    }

    // Verificar se o utilizador é o criador do tópico ou tem cargo 1 ou 2 (admin/gestor)
    if (topico.criado_por !== id_utilizador && req.user.id_cargo !== 1 && req.user.id_cargo !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para eliminar este tópico'
      });
    }

    // Verificar se o modelo Comentario_Topico está disponível
    if (typeof Comentario_Topico === 'undefined') {
      console.error('Modelo Comentario_Topico não está definido');
      // Continuar mesmo sem poder eliminar comentários
    } else {
      try {
        // Procurar todos os comentários do tópico para remover anexos
        const comentarios = await Comentario_Topico.findAll({
          where: { id_topico: id }
        });

        // Remover anexos dos comentários, se houver
        if (comentarios && comentarios.length > 0) {
          for (const comentario of comentarios) {
            if (comentario.anexo_url) {
              try {
                const filePath = path.join(
                  uploadUtils.BASE_UPLOAD_DIR || process.env.CAMINHO_PASTA_UPLOADS || 'uploads',
                  comentario.anexo_url.replace(/^\/?(uploads|backend\/uploads)\//, '')
                );

                if (fs.existsSync(filePath)) {
                  try {
                    fs.unlinkSync(filePath);
                    console.log(`Ficheiro anexo removido: ${filePath}`);
                  } catch (err) {
                    console.error(`Erro ao remover anexo: ${err.message}`);
                  }
                }
              } catch (error) {
                console.error('Erro ao processar anexo:', error);
                // Continuar mesmo com erro no processamento de anexos
              }
            }
          }
        }

        // Eliminar todos os comentários relacionados ao tópico
        await Comentario_Topico.destroy({
          where: { id_topico: id }
        });
      } catch (error) {
        console.error('Erro ao eliminar comentários do tópico:', error);
        // Continuar mesmo com erro na eliminação de comentários
      }
    }

    // Eliminar o tópico
    await topico.destroy();

    // Notificar os utilizadores conectados via Socket.IO
    if (req.io) {
      req.io.emit('topicoExcluido', {
        id_topico: id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tópico eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar tópico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar tópico',
      error: error.message
    });
  }
};

const getAllTopicosByCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    
    console.log(`A iniciar busca de tópicos para a categoria ${id_categoria}...`);
    
    // Verificar se a categoria existe
    const categoria = await Categoria.findByPk(id_categoria);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    // Buscar tópicos filtrados por categoria
    const topicos = await Topico_Categoria.findAll({
      where: { id_categoria: id_categoria },
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: ['id_categoria', 'nome'],
          required: false
        },
        {
          model: Area,
          as: "area",
          attributes: ['id_area', 'nome'],
          required: false
        },
        {
          model: User,
          as: "criador",
          attributes: ['id_utilizador', 'nome', 'email'],
          required: false
        }
      ],
      order: [['data_criacao', 'DESC']]
    });
    
    console.log(`Encontrados ${topicos.length} tópicos para a categoria ${id_categoria}`);
    
    // Formatar os resultados como no getAllTopicos
    const topicosMapeados = topicos.map(topico => {
      const t = topico.get({ plain: true });
      
      // Adicionar campo id para compatibilidade com frontend
      t.id = t.id_topico;
      
      // Garantir que propriedades estejam sempre presentes
      if (!t.categoria) t.categoria = { nome: 'Não disponível' };
      if (!t.area) t.area = { nome: 'Não disponível' };
      if (!t.criador) t.criador = { nome: 'Utilizador desconhecido' };
      
      return t;
    });
    
    return res.status(200).json(topicosMapeados);
  } catch (error) {
    console.error('Erro ao listar tópicos por categoria:', error);
    console.error('Stack de erro completo:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar tópicos para esta categoria',
      error: error.message
    });
  }
};

// Não esquecer de adicionar a função ao module.exports
module.exports = {
  getAllTopicos,
  createTopico,
  solicitarTopico,
  updateTopico,
  deleteTopico,
  getAllTopicosByCategoria // Adicionar aqui
};
