const ConteudoCurso = require('../database/models/ConteudoCurso');
const PastaCurso = require('../database/models/PastaCurso');
const TopicoCurso = require('../database/models/TopicoCurso');
const Curso = require('../database/models/Curso');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/cursos/conteudos_curso';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Função para filtrar tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  // Permitir qualquer tipo de arquivo por enquanto
  cb(null, true);
};

// Configuração do upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
}).single('arquivo');

// Middleware de upload para ser usado nas rotas
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Erro do Multer
      return res.status(400).json({
        message: 'Erro no upload do arquivo',
        error: err.message
      });
    } else if (err) {
      // Outro erro
      return res.status(500).json({
        message: 'Erro desconhecido no upload',
        error: err.message
      });
    }
    // Tudo ok, continuar
    next();
  });
};

// Obter todos os conteúdos
const getAllConteudos = async (req, res) => {
  try {
    const conteudos = await ConteudoCurso.findAll({
      where: { ativo: true },
      include: [
        {
          model: PastaCurso,
          as: 'pasta',
          attributes: ['id_pasta', 'nome'],
          include: [
            {
              model: TopicoCurso,
              as: 'topico',
              attributes: ['id_topico', 'nome']
            }
          ]
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'nome']
        }
      ],
      order: [
        ['id_curso', 'ASC'],
        ['ordem', 'ASC']
      ]
    });

    const formattedConteudos = conteudos.map(conteudo => {
      const plainConteudo = conteudo.get({ plain: true });
      return {
        id_conteudo: plainConteudo.id_conteudo,
        titulo: plainConteudo.titulo,
        descricao: plainConteudo.descricao,
        tipo: plainConteudo.tipo,
        url: plainConteudo.url,
        arquivo_path: plainConteudo.arquivo_path,
        ordem: plainConteudo.ordem,
        data_criacao: plainConteudo.data_criacao,
        id_pasta: plainConteudo.id_pasta,
        id_curso: plainConteudo.id_curso,
        curso_nome: plainConteudo.curso?.nome || 'Curso desconhecido',
        topico_nome: plainConteudo.pasta?.topico?.nome || 'Sem tópico',
        pasta_nome: plainConteudo.pasta?.nome || 'Sem pasta'
      };
    });

    res.status(200).json(formattedConteudos);
  } catch (error) {
    console.error('Erro ao buscar todos os conteúdos:', error);
    res.status(500).json({
      message: 'Erro ao buscar conteúdos',
      error: error.message
    });
  }
};

// Obter um conteúdo específico pelo ID
const getConteudoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conteudo = await ConteudoCurso.findOne({
      where: { 
        id_conteudo: id,
        ativo: true
      },
      include: [
        {
          model: PastaCurso,
          as: 'pasta',
          attributes: ['id_pasta', 'nome'],
          include: [
            {
              model: TopicoCurso,
              as: 'topico',
              attributes: ['id_topico', 'nome']
            }
          ]
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'nome']
        }
      ]
    });

    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    const plainConteudo = conteudo.get({ plain: true });
    const formattedConteudo = {
      id_conteudo: plainConteudo.id_conteudo,
      titulo: plainConteudo.titulo,
      descricao: plainConteudo.descricao,
      tipo: plainConteudo.tipo,
      url: plainConteudo.url,
      arquivo_path: plainConteudo.arquivo_path,
      ordem: plainConteudo.ordem,
      data_criacao: plainConteudo.data_criacao,
      id_pasta: plainConteudo.id_pasta,
      id_curso: plainConteudo.id_curso,
      curso_nome: plainConteudo.curso?.nome || 'Curso desconhecido',
      topico_nome: plainConteudo.pasta?.topico?.nome || 'Sem tópico',
      pasta_nome: plainConteudo.pasta?.nome || 'Sem pasta'
    };

    res.status(200).json(formattedConteudo);
  } catch (error) {
    console.error('Erro ao buscar conteúdo por ID:', error);
    res.status(500).json({
      message: 'Erro ao buscar conteúdo',
      error: error.message
    });
  }
};

// Obter todos os conteúdos de um curso específico
// Obter todos os conteúdos de um curso específico (versão simplificada)
const getConteudosByCurso = async (req, res) => {
  try {
    const cursoId = req.params.cursoId;

    // Verificar se o curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }

    // Buscar conteúdos sem usar associações
    const conteudos = await ConteudoCurso.findAll({
      where: {
        id_curso: cursoId,
        ativo: true
      },
      order: [
        ['ordem', 'ASC']
      ],
      attributes: [
        'id_conteudo', 
        'titulo', 
        'descricao', 
        'tipo', 
        'url', 
        'arquivo_path', 
        'ordem', 
        'data_criacao', 
        'id_pasta', 
        'id_curso'
      ]
    });

    // Se não houver conteúdos, retornar array vazio
    if (conteudos.length === 0) {
      return res.status(200).json([]);
    }

    // Em seguida, buscar as informações das pastas separadamente
    const pastaIds = [...new Set(conteudos.map(c => c.id_pasta))];
    const pastas = await PastaCurso.findAll({
      where: {
        id_pasta: pastaIds
      },
      attributes: ['id_pasta', 'nome', 'id_topico']
    });

    // Criar um mapa de pastas para facilitar o acesso
    const pastasMap = {};
    pastas.forEach(pasta => {
      pastasMap[pasta.id_pasta] = {
        id_pasta: pasta.id_pasta,
        nome: pasta.nome,
        id_topico: pasta.id_topico
      };
    });

    // Formatar os conteúdos com informações das pastas
    const formattedConteudos = conteudos.map(conteudo => {
      const plainConteudo = conteudo.get({ plain: true });
      const pasta = pastasMap[plainConteudo.id_pasta] || { nome: 'Sem pasta' };
      
      return {
        id_conteudo: plainConteudo.id_conteudo,
        titulo: plainConteudo.titulo,
        descricao: plainConteudo.descricao,
        tipo: plainConteudo.tipo,
        url: plainConteudo.url,
        arquivo_path: plainConteudo.arquivo_path,
        ordem: plainConteudo.ordem,
        data_criacao: plainConteudo.data_criacao,
        id_pasta: plainConteudo.id_pasta,
        id_curso: plainConteudo.id_curso,
        pasta_nome: pasta.nome || 'Sem pasta'
      };
    });

    res.status(200).json(formattedConteudos);
  } catch (error) {
    console.error('Erro ao buscar conteúdos do curso:', error);
    res.status(500).json({
      message: 'Erro ao buscar conteúdos do curso',
      error: error.message
    });
  }
};

// Obter conteúdos de uma pasta específica
const getConteudosByPasta = async (req, res) => {
  try {
    const pastaId = req.params.pastaId;

    // Verificar se a pasta existe
    const pasta = await PastaCurso.findByPk(pastaId);
    if (!pasta) {
      return res.status(404).json({ message: 'Pasta não encontrada' });
    }

    const conteudos = await ConteudoCurso.findAll({
      where: {
        id_pasta: pastaId,
        ativo: true
      },
      order: [
        ['ordem', 'ASC']
      ]
    });

    res.status(200).json(conteudos);
  } catch (error) {
    console.error('Erro ao buscar conteúdos da pasta:', error);
    res.status(500).json({
      message: 'Erro ao buscar conteúdos da pasta',
      error: error.message
    });
  }
};

// Criar um novo conteúdo
const createConteudo = async (req, res) => {
  try {
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem } = req.body;
    
    // Verificar se a pasta existe
    const pasta = await PastaCurso.findByPk(id_pasta);
    if (!pasta) {
      return res.status(404).json({ message: 'Pasta não encontrada' });
    }

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }

    // Verificar se a pasta pertence ao tópico do curso
    const topico = await TopicoCurso.findByPk(pasta.id_topico);
    if (!topico || topico.id_curso !== parseInt(id_curso)) {
      return res.status(400).json({ 
        message: 'A pasta selecionada não pertence a este curso' 
      });
    }

    // Verificar tipo válido
    if (!['file', 'link', 'video'].includes(tipo)) {
      return res.status(400).json({ 
        message: 'Tipo de conteúdo inválido. Use: file, link ou video' 
      });
    }

    // Preparar o objeto para criação
    let conteudoData = {
      titulo,
      descricao,
      tipo,
      id_pasta,
      id_curso,
      ativo: true
    };

    // Adicionar campos específicos conforme o tipo
    if (tipo === 'file') {
      if (!req.file) {
        return res.status(400).json({ message: 'Arquivo não enviado' });
      }
      conteudoData.arquivo_path = req.file.path;
    } else if (tipo === 'link' || tipo === 'video') {
      if (!url) {
        return res.status(400).json({ message: 'URL é obrigatória para tipos link e video' });
      }
      conteudoData.url = url;
    }

    // Definir ordem (se não fornecida, calcular a próxima)
    if (ordem) {
      conteudoData.ordem = ordem;
    } else {
      const ultimoConteudo = await ConteudoCurso.findOne({
        where: { id_pasta: id_pasta },
        order: [['ordem', 'DESC']]
      });
      conteudoData.ordem = ultimoConteudo ? ultimoConteudo.ordem + 1 : 1;
    }

    // Criar o conteúdo
    const novoConteudo = await ConteudoCurso.create(conteudoData);

    // Retornar o conteúdo criado
    res.status(201).json({
      message: 'Conteúdo criado com sucesso',
      conteudo: {
        ...novoConteudo.get({ plain: true }),
        pasta_nome: pasta.nome,
        topico_nome: topico.nome
      }
    });
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao criar conteúdo',
      error: error.message
    });
  }
};

// Atualizar um conteúdo existente
const updateConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem, ativo } = req.body;
    
    // Buscar o conteúdo existente
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Verificar se a pasta existe (se estiver mudando)
    if (id_pasta && id_pasta !== conteudo.id_pasta) {
      const pasta = await PastaCurso.findByPk(id_pasta);
      if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada' });
      }
      
      // Verificar se a pasta pertence ao curso
      const topico = await TopicoCurso.findByPk(pasta.id_topico);
      if (!topico || topico.id_curso !== parseInt(id_curso || conteudo.id_curso)) {
        return res.status(400).json({ 
          message: 'A pasta selecionada não pertence a este curso' 
        });
      }
    }

    // Verificar se o curso existe (se estiver mudando)
    if (id_curso && id_curso !== conteudo.id_curso) {
      const curso = await Curso.findByPk(id_curso);
      if (!curso) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }
    }

    // Preparar o objeto para atualização
    let dadosAtualizacao = {};
    
    // Atualizar campos básicos se fornecidos
    if (titulo !== undefined) dadosAtualizacao.titulo = titulo;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (id_pasta !== undefined) dadosAtualizacao.id_pasta = id_pasta;
    if (id_curso !== undefined) dadosAtualizacao.id_curso = id_curso;
    if (ordem !== undefined) dadosAtualizacao.ordem = ordem;
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;

    // Se estiver mudando o tipo, verificar os campos necessários
    if (tipo !== undefined && tipo !== conteudo.tipo) {
      if (!['file', 'link', 'video'].includes(tipo)) {
        return res.status(400).json({ 
          message: 'Tipo de conteúdo inválido. Use: file, link ou video' 
        });
      }
      
      dadosAtualizacao.tipo = tipo;
      
      // Limpar campos não usados pelo novo tipo
      if (tipo === 'file') {
        if (!req.file && !conteudo.arquivo_path) {
          return res.status(400).json({ 
            message: 'Arquivo é obrigatório para o tipo file' 
          });
        }
        dadosAtualizacao.url = null;
        if (req.file) {
          // Se já existe um arquivo, remover o antigo
          if (conteudo.arquivo_path && fs.existsSync(conteudo.arquivo_path)) {
            fs.unlinkSync(conteudo.arquivo_path);
          }
          dadosAtualizacao.arquivo_path = req.file.path;
        }
      } else {
        if (!url && !conteudo.url) {
          return res.status(400).json({ 
            message: 'URL é obrigatória para tipos link e video' 
          });
        }
        // Se tinha arquivo, remover
        if (conteudo.arquivo_path && fs.existsSync(conteudo.arquivo_path)) {
          fs.unlinkSync(conteudo.arquivo_path);
        }
        dadosAtualizacao.arquivo_path = null;
        if (url) dadosAtualizacao.url = url;
      }
    } else {
      // Mesmo tipo, atualizar campo específico
      if (tipo === 'file' || conteudo.tipo === 'file') {
        if (req.file) {
          // Se já existe um arquivo, remover o antigo
          if (conteudo.arquivo_path && fs.existsSync(conteudo.arquivo_path)) {
            fs.unlinkSync(conteudo.arquivo_path);
          }
          dadosAtualizacao.arquivo_path = req.file.path;
        }
      } else if ((tipo === 'link' || tipo === 'video' || 
                conteudo.tipo === 'link' || conteudo.tipo === 'video') && 
                url !== undefined) {
        dadosAtualizacao.url = url;
      }
    }

    // Atualizar o conteúdo
    await conteudo.update(dadosAtualizacao);

    // Buscar o conteúdo atualizado com dados relacionados
    const conteudoAtualizado = await ConteudoCurso.findByPk(id, {
      include: [
        {
          model: PastaCurso,
          as: 'pasta',
          attributes: ['id_pasta', 'nome'],
          include: [
            {
              model: TopicoCurso,
              as: 'topico',
              attributes: ['id_topico', 'nome']
            }
          ]
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'nome']
        }
      ]
    });

    // Formatar a resposta
    const plainConteudo = conteudoAtualizado.get({ plain: true });
    const formattedConteudo = {
      id_conteudo: plainConteudo.id_conteudo,
      titulo: plainConteudo.titulo,
      descricao: plainConteudo.descricao,
      tipo: plainConteudo.tipo,
      url: plainConteudo.url,
      arquivo_path: plainConteudo.arquivo_path,
      ordem: plainConteudo.ordem,
      data_criacao: plainConteudo.data_criacao,
      ativo: plainConteudo.ativo,
      id_pasta: plainConteudo.id_pasta,
      id_curso: plainConteudo.id_curso,
      curso_nome: plainConteudo.curso?.nome || 'Curso desconhecido',
      topico_nome: plainConteudo.pasta?.topico?.nome || 'Sem tópico',
      pasta_nome: plainConteudo.pasta?.nome || 'Sem pasta'
    };

    res.status(200).json({
      message: 'Conteúdo atualizado com sucesso',
      conteudo: formattedConteudo
    });
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao atualizar conteúdo',
      error: error.message
    });
  }
};

// Excluir um conteúdo (exclusão lógica)
const deleteConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o conteúdo
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Realizar exclusão lógica
    await conteudo.update({ ativo: false });

    res.status(200).json({
      message: 'Conteúdo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao excluir conteúdo',
      error: error.message
    });
  }
};

// Excluir permanentemente um conteúdo
const deleteConteudoPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o conteúdo
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Se for um arquivo, remover do sistema de arquivos
    if (conteudo.tipo === 'file' && conteudo.arquivo_path && fs.existsSync(conteudo.arquivo_path)) {
      fs.unlinkSync(conteudo.arquivo_path);
    }

    // Excluir o registro do banco de dados
    await conteudo.destroy();

    res.status(200).json({
      message: 'Conteúdo excluído permanentemente'
    });
  } catch (error) {
    console.error('Erro ao excluir permanentemente o conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao excluir permanentemente o conteúdo',
      error: error.message
    });
  }
};

// Restaurar um conteúdo excluído logicamente
const restoreConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o conteúdo
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Restaurar conteúdo
    await conteudo.update({ ativo: true });

    res.status(200).json({
      message: 'Conteúdo restaurado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao restaurar conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao restaurar conteúdo',
      error: error.message
    });
  }
};

// Corrigir conteúdos sem id_curso
const corrigirConteudosSemCurso = async (req, res) => {
  try {
    // Identificar conteúdos sem id_curso
    const conteudosSemCurso = await ConteudoCurso.findAll({
      where: {
        id_curso: {
          [Op.is]: null
        }
      },
      include: [
        {
          model: PastaCurso,
          as: 'pasta',
          include: [
            {
              model: TopicoCurso,
              as: 'topico'
            }
          ]
        }
      ]
    });

    // Contadores para o resultado
    let atualizados = 0;
    let naoAtualizados = 0;
    const erros = [];

    // Atualizar cada conteúdo
    for (const conteudo of conteudosSemCurso) {
      try {
        if (conteudo.pasta && conteudo.pasta.topico && conteudo.pasta.topico.id_curso) {
          await conteudo.update({
            id_curso: conteudo.pasta.topico.id_curso
          });
          atualizados++;
        } else {
          naoAtualizados++;
          erros.push(`Conteúdo ID ${conteudo.id_conteudo}: Não foi possível determinar o id_curso`);
        }
      } catch (updateError) {
        naoAtualizados++;
        erros.push(`Conteúdo ID ${conteudo.id_conteudo}: ${updateError.message}`);
      }
    }

    res.status(200).json({
      message: 'Correção de conteúdos executada',
      total: conteudosSemCurso.length,
      atualizados,
      naoAtualizados,
      erros: erros.length > 0 ? erros : null
    });
  } catch (error) {
    console.error('Erro ao corrigir conteúdos sem curso:', error);
    res.status(500).json({
      message: 'Erro ao corrigir conteúdos sem curso',
      error: error.message
    });
  }
};

// Reordenar conteúdos em uma pasta
const reordenarConteudos = async (req, res) => {
  try {
    const { pastaId } = req.params;
    const { ordens } = req.body;

    if (!Array.isArray(ordens)) {
      return res.status(400).json({ 
        message: 'O parâmetro "ordens" deve ser um array de objetos {id_conteudo, ordem}' 
      });
    }

    // Verificar se a pasta existe
    const pasta = await PastaCurso.findByPk(pastaId);
    if (!pasta) {
      return res.status(404).json({ message: 'Pasta não encontrada' });
    }

    // Atualizar a ordem de cada conteúdo
    for (const item of ordens) {
      if (!item.id_conteudo || !Number.isInteger(item.ordem)) {
        continue;
      }

      await ConteudoCurso.update(
        { ordem: item.ordem },
        { 
          where: { 
            id_conteudo: item.id_conteudo,
            id_pasta: pastaId
          } 
        }
      );
    }

    // Buscar os conteúdos atualizados
    const conteudosAtualizados = await ConteudoCurso.findAll({
      where: { id_pasta: pastaId },
      order: [['ordem', 'ASC']]
    });

    res.status(200).json({
      message: 'Conteúdos reordenados com sucesso',
      conteudos: conteudosAtualizados
    });
  } catch (error) {
    console.error('Erro ao reordenar conteúdos:', error);
    res.status(500).json({
      message: 'Erro ao reordenar conteúdos',
      error: error.message
    });
  }
};

// Exportar todas as funções de forma consistente
module.exports = {
  uploadMiddleware,
  getAllConteudos,
  getConteudoById,
  getConteudosByCurso,
  getConteudosByPasta,
  createConteudo,
  updateConteudo,
  deleteConteudo,
  deleteConteudoPermanently,
  restoreConteudo,
  corrigirConteudosSemCurso,
  reordenarConteudos
};