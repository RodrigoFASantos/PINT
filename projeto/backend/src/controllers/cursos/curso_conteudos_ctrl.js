const ConteudoCurso = require('../../database/models/ConteudoCurso');
const PastaCurso = require('../../database/models/PastaCurso');
const Curso_Topicos = require('../../database/models/Curso_Topicos');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

/**
 * Controller para gestão de conteúdos de cursos
 * Responsável por todas as operações CRUD relacionadas com materiais didáticos
 * Inclui gestão de ficheiros físicos e organização hierárquica
 */

/**
 * Elimina um conteúdo (exclusão lógica com remoção do ficheiro físico)
 * CORRIGIDO: Agora remove o ficheiro físico além da exclusão lógica na base de dados
 * Isto resolve o problema de ficheiros ficarem órfãos no sistema
 * 
 * @param {Object} req - Requisição HTTP com ID do conteúdo
 * @param {Object} res - Resposta HTTP
 */
const deleteConteudo = async (req, res) => {
  try {
    const { id } = req.params;

    // Procurar o conteúdo na base de dados
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // CORRIGIDO: Remover o ficheiro físico antes da exclusão lógica
    if (conteudo.arquivo_path) {
      const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
      
      // Verificar se o ficheiro existe e removê-lo
      if (fs.existsSync(arquivoPath)) {
        try {
          fs.unlinkSync(arquivoPath);
          console.log(`Ficheiro físico removido com sucesso: ${arquivoPath}`);
        } catch (fileError) {
          console.error(`Erro ao remover ficheiro físico: ${fileError.message}`);
          // Continuar com a exclusão lógica mesmo se não conseguir remover o ficheiro
        }
      } else {
        console.warn(`Ficheiro não encontrado para remoção: ${arquivoPath}`);
      }
    }

    // Realizar exclusão lógica na base de dados
    await conteudo.update({ ativo: false });

    res.status(200).json({
      message: 'Conteúdo eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao eliminar conteúdo',
      error: error.message
    });
  }
};

/**
 * Elimina permanentemente um conteúdo da base de dados
 * Remove completamente o registo e ficheiros associados
 * Operação irreversível - apenas para administradores
 * 
 * @param {Object} req - Requisição HTTP com ID do conteúdo
 * @param {Object} res - Resposta HTTP
 */
const deleteConteudoPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    // Procurar o conteúdo na base de dados
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Remover ficheiro físico se existir
    if (conteudo.arquivo_path) {
      const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
      if (fs.existsSync(arquivoPath)) {
        try {
          fs.unlinkSync(arquivoPath);
          console.log(`Ficheiro físico removido permanentemente: ${arquivoPath}`);
        } catch (fileError) {
          console.error(`Erro ao remover ficheiro físico: ${fileError.message}`);
        }
      }
    }

    // Eliminar o registo completamente da base de dados
    await conteudo.destroy();

    res.status(200).json({
      message: 'Conteúdo eliminado permanentemente'
    });
  } catch (error) {
    console.error('Erro ao eliminar permanentemente o conteúdo:', error);
    res.status(500).json({
      message: 'Erro ao eliminar permanentemente o conteúdo',
      error: error.message
    });
  }
};

/**
 * Restaura um conteúdo previamente eliminado logicamente
 * Reativa o conteúdo na base de dados (não recupera ficheiros físicos removidos)
 * 
 * @param {Object} req - Requisição HTTP com ID do conteúdo
 * @param {Object} res - Resposta HTTP
 */
const restoreConteudo = async (req, res) => {
  try {
    const { id } = req.params;

    // Procurar o conteúdo na base de dados
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Restaurar conteúdo marcando como ativo
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

/**
 * Ferramenta administrativa para corrigir conteúdos sem associação a curso
 * Identifica e corrige conteúdos órfãos associando-os aos cursos corretos
 * Útil para manutenção e integridade dos dados
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP com relatório da correção
 */
const corrigirConteudosSemCurso = async (req, res) => {
  try {
    // Identificar conteúdos sem id_curso definido
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
              model: Curso_Topicos,
              as: 'topico'
            }
          ]
        }
      ]
    });

    // Contadores para o resultado da operação
    let atualizados = 0;
    let naoAtualizados = 0;
    const erros = [];

    // Processar cada conteúdo órfão
    for (const conteudo of conteudosSemCurso) {
      try {
        // Verificar se conseguimos determinar o curso através da hierarquia
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

/**
 * Reordena conteúdos dentro duma pasta específica
 * Permite reorganizar a sequência de apresentação dos materiais
 * 
 * @param {Object} req - Requisição HTTP com ID da pasta e nova ordem
 * @param {Object} res - Resposta HTTP com conteúdos reordenados
 */
const reordenarConteudos = async (req, res) => {
  try {
    const { pastaId } = req.params;
    const { ordens } = req.body;

    // Validar estrutura dos dados recebidos
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

    // Aplicar nova ordem a cada conteúdo
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

    // Buscar os conteúdos atualizados com a nova ordem
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

/**
 * Lista todos os conteúdos do sistema com informações hierárquicas
 * Inclui dados do curso, tópico e pasta para contexto completo
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP com lista de conteúdos
 */
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
              model: Curso_Topicos,
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

    // Formatar dados para resposta consistente
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

/**
 * Busca um conteúdo específico pelo seu ID
 * Inclui informações contextuais da hierarquia (curso, tópico, pasta)
 * 
 * @param {Object} req - Requisição HTTP com ID do conteúdo
 * @param {Object} res - Resposta HTTP com dados do conteúdo
 */
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
              model: Curso_Topicos,
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

    // Formatar resposta com informações completas
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

/**
 * Lista todos os conteúdos dum curso específico
 * Usado para exibir materiais disponíveis num curso
 * 
 * @param {Object} req - Requisição HTTP com ID do curso
 * @param {Object} res - Resposta HTTP com conteúdos do curso
 */
const getConteudosByCurso = async (req, res) => {
  try {
    const cursoId = req.params.cursoId;

    // Verificar se o curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }

    // Buscar conteúdos ativos do curso
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

    // Retornar lista vazia se não há conteúdos
    if (conteudos.length === 0) {
      return res.status(200).json([]);
    }

    // Buscar informações das pastas associadas
    const pastaIds = [...new Set(conteudos.map(c => c.id_pasta))];
    const pastas = await PastaCurso.findAll({
      where: {
        id_pasta: pastaIds
      },
      attributes: ['id_pasta', 'nome', 'id_topico']
    });

    // Criar mapeamento das pastas para acesso rápido
    const pastasMap = {};
    pastas.forEach(pasta => {
      pastasMap[pasta.id_pasta] = {
        id_pasta: pasta.id_pasta,
        nome: pasta.nome,
        id_topico: pasta.id_topico
      };
    });

    // Formatar conteúdos com informações das pastas
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

/**
 * Lista conteúdos duma pasta específica
 * Usado para exibir materiais organizados por pasta
 * 
 * @param {Object} req - Requisição HTTP com ID da pasta
 * @param {Object} res - Resposta HTTP com conteúdos da pasta
 */
const getConteudosByPasta = async (req, res) => {
  try {
    const pastaId = req.params.pastaId;

    // Verificar se a pasta existe
    const pasta = await PastaCurso.findByPk(pastaId);
    if (!pasta) {
      return res.status(404).json({ message: 'Pasta não encontrada' });
    }

    // Buscar conteúdos ativos da pasta ordenados
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

/**
 * Verifica se já existe conteúdo com o mesmo título numa pasta
 * Previne duplicação de nomes na mesma pasta
 * 
 * @param {string} titulo - Título do conteúdo a verificar
 * @param {number} id_pasta - ID da pasta onde verificar
 * @returns {boolean} True se já existe, false caso contrário
 */
const existeConteudoNaPasta = async (titulo, id_pasta) => {
  const conteudoExistente = await ConteudoCurso.findOne({
    where: {
      titulo: titulo,
      id_pasta: id_pasta,
      ativo: true
    }
  });

  return !!conteudoExistente;
};

/**
 * Cria um novo conteúdo com gestão de ficheiros
 * Suporta diferentes tipos: file, link, video
 * Organiza ficheiros na estrutura hierárquica correta
 * 
 * @param {Object} req - Requisição HTTP com dados do conteúdo e ficheiro
 * @param {Object} res - Resposta HTTP com conteúdo criado
 */
const createConteudo = async (req, res) => {
  try {
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem } = req.body;

    // Validações básicas
    if (!id_pasta) {
      return res.status(400).json({ message: 'ID da pasta é obrigatório' });
    }

    if (!id_curso) {
      return res.status(400).json({ message: 'ID do curso é obrigatório' });
    }

    if (!titulo) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    // Verificar se pasta e curso existem
    const pasta = await PastaCurso.findByPk(id_pasta);
    if (!pasta) return res.status(404).json({ message: 'Pasta não encontrada' });

    const curso = await Curso.findByPk(id_curso);
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    // Verificar se a pasta pertence ao curso
    const topico = await Curso_Topicos.findByPk(pasta.id_topico);
    if (!topico || topico.id_curso !== parseInt(id_curso)) {
      return res.status(400).json({ message: 'A pasta selecionada não pertence a este curso' });
    }

    // Identificar se é tópico de avaliação
    const isAvaliacaoTopico =
      topico.nome.toLowerCase() === 'avaliação' ||
      topico.nome.toLowerCase() === 'avaliacao' ||
      topico.nome.toLowerCase().includes('avalia');

    // Validar tipo de conteúdo
    if (!['file', 'link', 'video'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de conteúdo inválido. Use: file, link ou video' });
    }

    // Verificar se já existe conteúdo com mesmo título na pasta
    const conteudoExistente = await existeConteudoNaPasta(titulo, id_pasta);
    if (conteudoExistente) {
      return res.status(409).json({ message: 'Já existe um conteúdo com esse título nesta pasta' });
    }

    // Determinar estrutura de diretorias baseada no tipo de tópico
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const topicoSlug = uploadUtils.normalizarNome(topico.nome);
    const pastaSlug = uploadUtils.normalizarNome(pasta.nome);

    let conteudosDir, conteudosPath;

    if (isAvaliacaoTopico) {
      // Para tópicos de avaliação - estrutura especial
      conteudosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug, 'conteudos');
      conteudosPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/conteudos`;
    } else {
      // Para tópicos normais
      conteudosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug, pastaSlug, 'Conteudos');
      conteudosPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}/Conteudos`;
    }

    // Garantir que o diretório existe
    uploadUtils.ensureDir(conteudosDir);

    // Preparar dados do conteúdo
    let conteudoData = {
      titulo,
      descricao: descricao || '',
      tipo,
      id_pasta,
      id_curso,
      ativo: true,
      dir_path: conteudosPath
    };

    const timestamp = Date.now();
    const tituloBase = uploadUtils.normalizarNome(titulo);

    // Processar baseado no tipo de conteúdo
    if (tipo === 'file' || tipo === 'video') {
      // Tipos que requerem ficheiro
      if (!req.file) return res.status(400).json({ message: 'Ficheiro não enviado' });

      const tempPath = req.file.path;
      const fileName = `${timestamp}-${tituloBase}${path.extname(req.file.originalname)}`;
      const destPath = path.join(conteudosDir, fileName);

      // Mover ficheiro da pasta temporária para destino final
      const movido = uploadUtils.moverArquivo(tempPath, destPath);
      if (!movido) {
        return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
      }

      conteudoData.arquivo_path = `${conteudosPath}/${fileName}`;
    } else if (tipo === 'link') {
      // Tipo link requer URL
      if (!url) return res.status(400).json({ message: 'URL é obrigatória para tipo link' });

      // Criar ficheiro de referência para consistência
      const fakeFileName = `${timestamp}-${tipo}-${tituloBase}.txt`;
      const fakeFilePath = path.join(conteudosDir, fakeFileName);

      try {
        fs.writeFileSync(fakeFilePath, url);
      } catch (error) {
        console.error('Erro ao criar ficheiro de referência:', error);
        return res.status(500).json({ message: 'Erro ao guardar referência de URL' });
      }

      conteudoData.url = url;
      conteudoData.arquivo_path = `${conteudosPath}/${fakeFileName}`;
    }

    // Definir ordem do conteúdo
    if (ordem) {
      conteudoData.ordem = ordem;
    } else {
      // Buscar última ordem existente e incrementar
      const ultimoConteudo = await ConteudoCurso.findOne({
        where: { id_pasta: id_pasta },
        order: [['ordem', 'DESC']]
      });
      conteudoData.ordem = ultimoConteudo ? ultimoConteudo.ordem + 1 : 1;
    }

    // Criar registo na base de dados
    const novoConteudo = await ConteudoCurso.create(conteudoData);

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
    res.status(500).json({ message: 'Erro ao criar conteúdo', error: error.message });
  }
};

/**
 * Atualiza um conteúdo existente com gestão de ficheiros
 * Permite alteração de tipo, localização e ficheiros associados
 * Gere movimentação de ficheiros entre diretorias quando necessário
 * 
 * @param {Object} req - Requisição HTTP com dados atualizados e possível ficheiro
 * @param {Object} res - Resposta HTTP com conteúdo atualizado
 */
const updateConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem, ativo } = req.body;

    // Buscar conteúdo existente
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Buscar informações da estrutura atual
    const pastaAtual = await PastaCurso.findByPk(conteudo.id_pasta);
    const topicoAtual = pastaAtual ? await Curso_Topicos.findByPk(pastaAtual.id_topico) : null;
    const cursoAtual = await Curso.findByPk(conteudo.id_curso);

    if (!pastaAtual || !topicoAtual || !cursoAtual) {
      return res.status(404).json({ message: 'Dados associados ao conteúdo não encontrados' });
    }

    // Determinar estrutura de destino se houver mudanças
    let pastaAlvo = pastaAtual;
    let topicoAlvo = topicoAtual;
    let cursoAlvo = cursoAtual;
    let precisaMoverArquivo = false;

    // Verificar mudança de pasta
    if (id_pasta && id_pasta !== conteudo.id_pasta) {
      pastaAlvo = await PastaCurso.findByPk(id_pasta);
      if (!pastaAlvo) {
        return res.status(404).json({ message: 'Pasta não encontrada' });
      }

      topicoAlvo = await Curso_Topicos.findByPk(pastaAlvo.id_topico);
      if (!topicoAlvo) {
        return res.status(404).json({ message: 'Tópico não encontrado' });
      }

      cursoAlvo = id_curso ? await Curso.findByPk(id_curso) : cursoAtual;
      if (!cursoAlvo) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      precisaMoverArquivo = true;
    }
    // Verificar mudança de curso
    else if (id_curso && id_curso !== conteudo.id_curso) {
      cursoAlvo = await Curso.findByPk(id_curso);
      if (!cursoAlvo) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      // Validar se pasta atual pertence ao novo curso
      if (topicoAtual && topicoAtual.id_curso !== parseInt(id_curso)) {
        return res.status(400).json({
          message: 'A pasta atual não pertence ao novo curso'
        });
      }
    }

    // Preparar dados para atualização
    let dadosAtualizacao = {};

    // Atualizar campos básicos se fornecidos
    if (titulo !== undefined) dadosAtualizacao.titulo = titulo;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (id_pasta !== undefined) dadosAtualizacao.id_pasta = id_pasta;
    if (id_curso !== undefined) dadosAtualizacao.id_curso = id_curso;
    if (ordem !== undefined) dadosAtualizacao.ordem = ordem;
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo;

    // Determinar estruturas de diretórios
    const isAvaliacaoAtual =
      topicoAtual.nome.toLowerCase() === 'avaliação' ||
      topicoAtual.nome.toLowerCase() === 'avaliacao' ||
      topicoAtual.nome.toLowerCase().includes('avalia');

    const isAvaliacaoAlvo =
      topicoAlvo.nome.toLowerCase() === 'avaliação' ||
      topicoAlvo.nome.toLowerCase() === 'avaliacao' ||
      topicoAlvo.nome.toLowerCase().includes('avalia');

    const cursoSlugAtual = uploadUtils.normalizarNome(cursoAtual.nome);
    const cursoSlugAlvo = uploadUtils.normalizarNome(cursoAlvo.nome);
    const pastaSlugAtual = uploadUtils.normalizarNome(pastaAtual.nome);
    const pastaSlugAlvo = uploadUtils.normalizarNome(pastaAlvo.nome);
    const topicoSlugAtual = uploadUtils.normalizarNome(topicoAtual.nome);
    const topicoSlugAlvo = uploadUtils.normalizarNome(topicoAlvo.nome);

    // Construir caminhos de diretórios
    let conteudoDirAtual, conteudoPathAtual, conteudoDirAlvo, conteudoPathAlvo;

    if (isAvaliacaoAtual) {
      conteudoDirAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual, 'avaliacao', pastaSlugAtual, 'conteudos');
      conteudoPathAtual = `uploads/cursos/${cursoSlugAtual}/avaliacao/${pastaSlugAtual}/conteudos`;
    } else {
      conteudoDirAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual, 'topicos', topicoSlugAtual, pastaSlugAtual, 'Conteudos');
      conteudoPathAtual = `uploads/cursos/${cursoSlugAtual}/topicos/${topicoSlugAtual}/${pastaSlugAtual}/Conteudos`;
    }

    if (isAvaliacaoAlvo) {
      conteudoDirAlvo = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAlvo, 'avaliacao', pastaSlugAlvo, 'conteudos');
      conteudoPathAlvo = `uploads/cursos/${cursoSlugAlvo}/avaliacao/${pastaSlugAlvo}/conteudos`;
    } else {
      conteudoDirAlvo = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAlvo, 'topicos', topicoSlugAlvo, pastaSlugAlvo, 'Conteudos');
      conteudoPathAlvo = `uploads/cursos/${cursoSlugAlvo}/topicos/${topicoSlugAlvo}/${pastaSlugAlvo}/Conteudos`;
    }

    // Garantir que diretório de destino existe
    uploadUtils.ensureDir(conteudoDirAlvo);

    // Gerir ficheiros se necessário
    if (precisaMoverArquivo || (tipo !== undefined && tipo !== conteudo.tipo)) {
      // Mudança de tipo ou localização
      if (tipo !== undefined && tipo !== conteudo.tipo) {
        // Validar novo tipo
        if (!['file', 'link', 'video'].includes(tipo)) {
          return res.status(400).json({
            message: 'Tipo de conteúdo inválido. Use: file, link ou video'
          });
        }

        dadosAtualizacao.tipo = tipo;

        const tituloBase = uploadUtils.normalizarNome(titulo || conteudo.titulo);
        const timestamp = Date.now();

        if (tipo === 'file' || tipo === 'video') {
          if (!req.file && !conteudo.arquivo_path) {
            return res.status(400).json({
              message: 'Ficheiro é obrigatório para o tipo file/video'
            });
          }
          dadosAtualizacao.url = null;

          if (req.file) {
            // Remover ficheiro antigo se existe
            if (conteudo.arquivo_path) {
              const arquivoAntigoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
              if (fs.existsSync(arquivoAntigoPath)) {
                try {
                  fs.unlinkSync(arquivoAntigoPath);
                } catch (fileError) {
                  console.error(`Erro ao remover ficheiro antigo: ${fileError.message}`);
                }
              }
            }

            // Mover novo ficheiro
            const tempPath = req.file.path;
            const fileName = `${timestamp}-${tituloBase}${path.extname(req.file.originalname)}`;
            const destPath = path.join(conteudoDirAlvo, fileName);

            const movido = uploadUtils.moverArquivo(tempPath, destPath);
            if (!movido) {
              return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
            }

            dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
          } else if (precisaMoverArquivo && conteudo.arquivo_path) {
            // Mover ficheiro existente
            const fileName = path.basename(conteudo.arquivo_path);
            const arquivoOrigem = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
            const arquivoDestino = path.join(conteudoDirAlvo, fileName);

            const movido = uploadUtils.moverArquivo(arquivoOrigem, arquivoDestino);
            if (!movido) {
              return res.status(500).json({ message: 'Erro ao mover o ficheiro existente' });
            }

            dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
          }
        } else if (tipo === 'link') {
          if (!url && !conteudo.url) {
            return res.status(400).json({
              message: 'URL é obrigatória para tipo link'
            });
          }

          // Remover ficheiro antigo se existia
          if (conteudo.arquivo_path) {
            const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
            if (fs.existsSync(arquivoPath)) {
              try {
                fs.unlinkSync(arquivoPath);
              } catch (fileError) {
                console.error(`Erro ao remover ficheiro: ${fileError.message}`);
              }
            }
          }

          // Criar novo ficheiro de referência
          const fakeFileName = `${timestamp}-${tipo}-${tituloBase}.txt`;
          const fakeFilePath = path.join(conteudoDirAlvo, fakeFileName);

          fs.writeFileSync(fakeFilePath, url || conteudo.url || '');

          dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fakeFileName}`;
          if (url) dadosAtualizacao.url = url;
        }
      } else {
        // Mesmo tipo, mas mover ficheiro
        if (conteudo.arquivo_path) {
          const fileName = path.basename(conteudo.arquivo_path);
          const arquivoOrigem = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
          const arquivoDestino = path.join(conteudoDirAlvo, fileName);

          const movido = uploadUtils.moverArquivo(arquivoOrigem, arquivoDestino);
          if (!movido) {
            return res.status(500).json({ message: 'Erro ao mover o ficheiro existente' });
          }

          dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
        }
      }
    } else if (req.file) {
      // Atualizar ficheiro no mesmo local
      if (conteudo.tipo === 'file' || conteudo.tipo === 'video') {
        // Remover ficheiro antigo
        if (conteudo.arquivo_path) {
          const arquivoAntigoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
          if (fs.existsSync(arquivoAntigoPath)) {
            try {
              fs.unlinkSync(arquivoAntigoPath);
            } catch (fileError) {
              console.error(`Erro ao remover ficheiro antigo: ${fileError.message}`);
            }
          }
        }

        // Processar novo ficheiro
        const tempPath = req.file.path;
        const tituloBase = uploadUtils.normalizarNome(titulo || conteudo.titulo);
        const fileName = `${Date.now()}-${tituloBase}${path.extname(req.file.originalname)}`;
        const destPath = path.join(conteudoDirAtual, fileName);

        const movido = uploadUtils.moverArquivo(tempPath, destPath);
        if (!movido) {
          return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
        }

        dadosAtualizacao.arquivo_path = `${conteudoPathAtual}/${fileName}`;
      }
    } else if (url !== undefined && conteudo.tipo === 'link') {
      // Atualizar URL para tipo link
      if (conteudo.arquivo_path) {
        // Atualizar ficheiro de referência existente
        const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
        if (fs.existsSync(arquivoPath)) {
          try {
            fs.writeFileSync(arquivoPath, url);
          } catch (fileError) {
            console.error(`Erro ao atualizar ficheiro de referência: ${fileError.message}`);
          }
        } else {
          // Criar novo ficheiro de referência
          const tituloBase = uploadUtils.normalizarNome(titulo || conteudo.titulo);
          const fakeFileName = `${Date.now()}-${conteudo.tipo}-${tituloBase}.txt`;
          const fakeFilePath = path.join(conteudoDirAtual, fakeFileName);

          try {
            fs.writeFileSync(fakeFilePath, url);
          } catch (fileError) {
            console.error(`Erro ao criar novo ficheiro de referência: ${fileError.message}`);
          }

          dadosAtualizacao.arquivo_path = `${conteudoPathAtual}/${fakeFileName}`;
        }
      }

      dadosAtualizacao.url = url;
    }

    // Atualizar caminho se mudou de local
    if (precisaMoverArquivo) {
      dadosAtualizacao.dir_path = conteudoPathAlvo;
    }

    // Aplicar atualizações na base de dados
    await conteudo.update(dadosAtualizacao);

    // Buscar conteúdo atualizado com informações completas
    const conteudoAtualizado = await ConteudoCurso.findByPk(id, {
      include: [
        {
          model: PastaCurso,
          as: 'pasta',
          attributes: ['id_pasta', 'nome'],
          include: [
            {
              model: Curso_Topicos,
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

    // Formatar resposta
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

module.exports = {
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