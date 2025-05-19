const ConteudoCurso = require('../../database/models/ConteudoCurso');
const PastaCurso = require('../../database/models/PastaCurso');
const Curso_Topicos = require('../../database/models/Curso_Topicos');
const Curso = require('../../database/models/Curso');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

// Excluir um conteúdo (exclusão lógica)
const deleteConteudo = async (req, res) => {
  try {
    const { id } = req.params;

    // Procurar o conteúdo
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

    // Procurar o conteúdo
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Se for um ficheiro, remover do sistema de ficheiros
    if (conteudo.arquivo_path) {
      const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
      if (fs.existsSync(arquivoPath)) {
        try {
          fs.unlinkSync(arquivoPath);
          console.log(`Ficheiro físico removido: ${arquivoPath}`);
        } catch (fileError) {
          console.error(`Erro ao remover ficheiro físico: ${fileError.message}`);
        }
      }
    }

    // Excluir o registo da base de dados
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

    // Procurar o conteúdo
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
              model: Curso_Topicos,
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

    // Procurar os conteúdos atualizados
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
    console.error('Erro ao procurar todos os conteúdos:', error);
    res.status(500).json({
      message: 'Erro ao procurar conteúdos',
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
    console.error('Erro ao procurar conteúdo por ID:', error);
    res.status(500).json({
      message: 'Erro ao procurar conteúdo',
      error: error.message
    });
  }
};

// Obter todos os conteúdos de um curso específico
const getConteudosByCurso = async (req, res) => {
  try {
    const cursoId = req.params.cursoId;

    // Verificar se o curso existe
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }

    // Procurar conteúdos sem usar associações
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

    // Em seguida, procurar as informações das pastas separadamente
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
    console.error('Erro ao procurar conteúdos do curso:', error);
    res.status(500).json({
      message: 'Erro ao procurar conteúdos do curso',
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
    console.error('Erro ao procurar conteúdos da pasta:', error);
    res.status(500).json({
      message: 'Erro ao procurar conteúdos da pasta',
      error: error.message
    });
  }
};

// Verificar se já existe conteúdo com mesmo título na pasta
const existeConteudoNaPasta = async (titulo, id_pasta) => {
  const conteudoExistente = await ConteudoCurso.findOne({
    where: {
      titulo: titulo,
      id_pasta: id_pasta,
      ativo: true
    }
  });

  return !!conteudoExistente; // true se existir, false se não existir
};

// Criar um novo conteúdo - MODIFICADO para estrutura simplificada
const createConteudo = async (req, res) => {
  try {
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem } = req.body;

    if (!id_pasta) {
      return res.status(400).json({ message: 'ID da pasta é obrigatório' });
    }

    if (!id_curso) {
      return res.status(400).json({ message: 'ID do curso é obrigatório' });
    }

    if (!titulo) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    const pasta = await PastaCurso.findByPk(id_pasta);
    if (!pasta) return res.status(404).json({ message: 'Pasta não encontrada' });

    const curso = await Curso.findByPk(id_curso);
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });

    const topico = await Curso_Topicos.findByPk(pasta.id_topico);
    if (!topico || topico.id_curso !== parseInt(id_curso)) {
      return res.status(400).json({ message: 'A pasta selecionada não pertence a este curso' });
    }

    // Verificação de avaliação
    const isAvaliacaoTopico =
      topico.nome.toLowerCase() === 'avaliação' ||
      topico.nome.toLowerCase() === 'avaliacao' ||
      topico.nome.toLowerCase().includes('avalia');

    console.log(`Tópico "${topico.nome}" ${isAvaliacaoTopico ? 'identificado como avaliação' : 'não é de avaliação'}`);

    if (!['file', 'link', 'video'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de conteúdo inválido. Use: file, link ou video' });
    }

    // Verifica se já existe conteúdo com mesmo título na pasta
    const conteudoExistente = await existeConteudoNaPasta(titulo, id_pasta);
    if (conteudoExistente) {
      return res.status(409).json({ message: 'Já existe um conteúdo com esse título nesta pasta' });
    }

    // === MODIFICADO: Usar a estrutura de diretórios correta ===
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const topicoSlug = uploadUtils.normalizarNome(topico.nome);
    const pastaSlug = uploadUtils.normalizarNome(pasta.nome);

    let conteudosDir, conteudosPath;

    if (isAvaliacaoTopico) {
      // Para tópicos de avaliação - salvar na pasta conteudos
      conteudosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug, 'conteudos');
      conteudosPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/conteudos`;
    } else {
      conteudosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug, pastaSlug, 'Conteudos');
      conteudosPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}/Conteudos`;
    }

    console.log(`Diretório para conteúdos: ${conteudosDir}`);

    // Garantir que o diretório de conteúdos existe
    uploadUtils.ensureDir(conteudosDir);


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
    // Usar a função uploadUtils.normalizarNome para normalização consistente
    const tituloBase = uploadUtils.normalizarNome(titulo);

    if (tipo === 'file') {
      if (!req.file) return res.status(400).json({ message: 'Ficheiro não enviado' });

      const tempPath = req.file.path;
      const fileName = `${timestamp}-${tituloBase}${path.extname(req.file.originalname)}`;
      const destPath = path.join(conteudosDir, fileName);

      // Mover o ficheiro
      console.log(`A mover ficheiro de ${tempPath} para ${destPath}`);
      const movido = uploadUtils.moverArquivo(tempPath, destPath);
      if (!movido) {
        return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
      }

      conteudoData.arquivo_path = `${conteudosPath}/${fileName}`;
    } else if (tipo === 'link' || tipo === 'video') {
      if (!url) return res.status(400).json({ message: 'URL é obrigatória para tipos link e video' });

      // Para links e vídeos, criar um ficheiro de referência
      const fakeFileName = `${timestamp}-${tipo}-${tituloBase}.txt`;
      const fakeFilePath = path.join(conteudosDir, fakeFileName);

      // Escrever a URL no ficheiro
      try {
        fs.writeFileSync(fakeFilePath, url);
      } catch (error) {
        console.error('Erro ao criar ficheiro de referência:', error);
        return res.status(500).json({ message: 'Erro ao guardar referência de URL' });
      }

      conteudoData.url = url;
      conteudoData.arquivo_path = `${conteudosPath}/${fakeFileName}`;
    }

    // Definir a ordem do conteúdo
    if (ordem) {
      conteudoData.ordem = ordem;
    } else {
      const ultimoConteudo = await ConteudoCurso.findOne({
        where: { id_pasta: id_pasta },
        order: [['ordem', 'DESC']]
      });
      conteudoData.ordem = ultimoConteudo ? ultimoConteudo.ordem + 1 : 1;
    }

    // Criar o conteúdo na base de dados
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

// Atualizar um conteúdo existente - MODIFICADO para estrutura simplificada
const updateConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, url, id_pasta, id_curso, ordem, ativo } = req.body;

    console.log(`A iniciar atualização do conteúdo ID ${id}`);

    // Procurar o conteúdo existente
    const conteudo = await ConteudoCurso.findByPk(id);
    if (!conteudo) {
      return res.status(404).json({ message: 'Conteúdo não encontrado' });
    }

    // Procurar informações para o diretório
    const pastaAtual = await PastaCurso.findByPk(conteudo.id_pasta);
    const topicoAtual = pastaAtual ? await Curso_Topicos.findByPk(pastaAtual.id_topico) : null;
    const cursoAtual = await Curso.findByPk(conteudo.id_curso);

    if (!pastaAtual || !topicoAtual || !cursoAtual) {
      return res.status(404).json({ message: 'Dados associados ao conteúdo não encontrados' });
    }

    // Variáveis para controlar a mudança de localização
    let pastaAlvo = pastaAtual;
    let topicoAlvo = topicoAtual;
    let cursoAlvo = cursoAtual;
    let precisaMoverArquivo = false;

    // Verificar se está a mudar de pasta
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
    // Verificar se está a mudar de curso (e a pasta não foi alterada)
    else if (id_curso && id_curso !== conteudo.id_curso) {
      cursoAlvo = await Curso.findByPk(id_curso);
      if (!cursoAlvo) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      // Se a pasta atual pertence ao novo curso
      if (topicoAtual && topicoAtual.id_curso !== parseInt(id_curso)) {
        return res.status(400).json({
          message: 'A pasta atual não pertence ao novo curso'
        });
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

    // MODIFICADO: Determinar a estrutura de diretórios correta

    // Verificar se o tópico atual é de avaliação
    const isAvaliacaoAtual =
      topicoAtual.nome.toLowerCase() === 'avaliação' ||
      topicoAtual.nome.toLowerCase() === 'avaliacao' ||
      topicoAtual.nome.toLowerCase().includes('avalia');

    // Verificar se o tópico alvo é de avaliação
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

    // Diretórios atuais e alvo com estrutura correta
    let conteudoDirAtual, conteudoPathAtual, conteudoDirAlvo, conteudoPathAlvo;

    if (isAvaliacaoAtual) {
      // Para avaliação - armazenar na pasta conteudos
      conteudoDirAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual, 'avaliacao', pastaSlugAtual, 'conteudos');
      conteudoPathAtual = `uploads/cursos/${cursoSlugAtual}/avaliacao/${pastaSlugAtual}/conteudos`;
    } else {
      // Para tópicos normais: manter a estrutura atual
      conteudoDirAtual = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAtual, 'topicos', topicoSlugAtual, pastaSlugAtual, 'Conteudos');
      conteudoPathAtual = `uploads/cursos/${cursoSlugAtual}/topicos/${topicoSlugAtual}/${pastaSlugAtual}/Conteudos`;
    }

    if (isAvaliacaoAlvo) {
      // Para avaliação - armazenar na pasta conteudos
      conteudoDirAlvo = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAlvo, 'avaliacao', pastaSlugAlvo, 'conteudos');
      conteudoPathAlvo = `uploads/cursos/${cursoSlugAlvo}/avaliacao/${pastaSlugAlvo}/conteudos`;
    } else {
      // Para tópicos normais: manter a estrutura atual
      conteudoDirAlvo = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlugAlvo, 'topicos', topicoSlugAlvo, pastaSlugAlvo, 'Conteudos');
      conteudoPathAlvo = `uploads/cursos/${cursoSlugAlvo}/topicos/${topicoSlugAlvo}/${pastaSlugAlvo}/Conteudos`;
    }

    console.log(`Diretório atual: ${conteudoDirAtual}, Diretório alvo: ${conteudoDirAlvo}`);

    // Garantir que os diretórios existam
    uploadUtils.ensureDir(conteudoDirAlvo);

    // Se precisa mover o ficheiro ou estamos a mudar o tipo
    if (precisaMoverArquivo || (tipo !== undefined && tipo !== conteudo.tipo)) {
      console.log('A mover ficheiro ou alterar tipo de conteúdo');

      // Se estiver a mudar o tipo, verificar os campos necessários
      if (tipo !== undefined && tipo !== conteudo.tipo) {
        if (!['file', 'link', 'video'].includes(tipo)) {
          return res.status(400).json({
            message: 'Tipo de conteúdo inválido. Use: file, link ou video'
          });
        }

        dadosAtualizacao.tipo = tipo;

        // Limpar campos não usados pelo novo tipo
        const tituloBase = uploadUtils.normalizarNome(titulo || conteudo.titulo);
        const timestamp = Date.now();

        if (tipo === 'file') {
          if (!req.file && !conteudo.arquivo_path) {
            return res.status(400).json({
              message: 'Ficheiro é obrigatório para o tipo file'
            });
          }
          dadosAtualizacao.url = null;

          if (req.file) {
            // Se já existe um ficheiro, remover o antigo
            if (conteudo.arquivo_path) {
              const arquivoAntigoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
              if (fs.existsSync(arquivoAntigoPath)) {
                try {
                  fs.unlinkSync(arquivoAntigoPath);
                  console.log(`Ficheiro antigo removido: ${arquivoAntigoPath}`);
                } catch (fileError) {
                  console.error(`Erro ao remover ficheiro antigo: ${fileError.message}`);
                }
              }
            }

            // Mover o novo ficheiro para o diretório correto
            const tempPath = req.file.path;
            const fileName = `${timestamp}-${tituloBase}${path.extname(req.file.originalname)}`;
            const destPath = path.join(conteudoDirAlvo, fileName);

            console.log(`A mover ficheiro de ${tempPath} para ${destPath}`);
            const movido = uploadUtils.moverArquivo(tempPath, destPath);
            if (!movido) {
              return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
            }

            dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
          } else if (precisaMoverArquivo && conteudo.arquivo_path) {
            // Mover o ficheiro existente para nova localização
            const fileName = path.basename(conteudo.arquivo_path);
            const arquivoOrigem = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
            const arquivoDestino = path.join(conteudoDirAlvo, fileName);

            console.log(`A mover ficheiro existente de ${arquivoOrigem} para ${arquivoDestino}`);
            const movido = uploadUtils.moverArquivo(arquivoOrigem, arquivoDestino);
            if (!movido) {
              return res.status(500).json({ message: 'Erro ao mover o ficheiro existente' });
            }

            dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
          }
        } else {
          if (!url && !conteudo.url) {
            return res.status(400).json({
              message: 'URL é obrigatória para tipos link e video'
            });
          }

          // Se tinha ficheiro, remover
          if (conteudo.arquivo_path) {
            const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
            if (fs.existsSync(arquivoPath)) {
              try {
                fs.unlinkSync(arquivoPath);
                console.log(`Ficheiro removido: ${arquivoPath}`);
              } catch (fileError) {
                console.error(`Erro ao remover ficheiro: ${fileError.message}`);
              }
            }
          }

          // Criar novo ficheiro de referência
          const fakeFileName = `${timestamp}-${tipo}-${tituloBase}.txt`;
          const fakeFilePath = path.join(conteudoDirAlvo, fakeFileName);

          // Escrever a URL no ficheiro
          fs.writeFileSync(fakeFilePath, url || conteudo.url || '');

          dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fakeFileName}`;
          if (url) dadosAtualizacao.url = url;
        }
      } else {
        // Mesmo tipo, mas precisa mover o ficheiro
        if (conteudo.arquivo_path) {
          const fileName = path.basename(conteudo.arquivo_path);
          const arquivoOrigem = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
          const arquivoDestino = path.join(conteudoDirAlvo, fileName);

          console.log(`A mover ficheiro existente de ${arquivoOrigem} para ${arquivoDestino}`);
          const movido = uploadUtils.moverArquivo(arquivoOrigem, arquivoDestino);
          if (!movido) {
            return res.status(500).json({ message: 'Erro ao mover o ficheiro existente' });
          }

          dadosAtualizacao.arquivo_path = `${conteudoPathAlvo}/${fileName}`;
        }
      }
    } else if (req.file) {
      // Mesmo local, mas ficheiro atualizado
      console.log('A atualizar ficheiro no mesmo local');

      if (conteudo.tipo === 'file') {
        // Se já existe um ficheiro, remover o antigo
        if (conteudo.arquivo_path) {
          const arquivoAntigoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
          if (fs.existsSync(arquivoAntigoPath)) {
            try {
              fs.unlinkSync(arquivoAntigoPath);
              console.log(`Ficheiro antigo removido: ${arquivoAntigoPath}`);
            } catch (fileError) {
              console.error(`Erro ao remover ficheiro antigo: ${fileError.message}`);
            }
          }
        }

        // Mover o novo ficheiro
        const tempPath = req.file.path;
        const tituloBase = uploadUtils.normalizarNome(titulo || conteudo.titulo);
        const fileName = `${Date.now()}-${tituloBase}${path.extname(req.file.originalname)}`;
        const destPath = path.join(conteudoDirAtual, fileName);

        console.log(`A mover novo ficheiro de ${tempPath} para ${destPath}`);
        const movido = uploadUtils.moverArquivo(tempPath, destPath);
        if (!movido) {
          return res.status(500).json({ message: 'Erro ao mover o ficheiro do conteúdo' });
        }

        dadosAtualizacao.arquivo_path = `${conteudoPathAtual}/${fileName}`;
      }
    } else if (url !== undefined && (conteudo.tipo === 'link' || conteudo.tipo === 'video')) {
      // Atualizar URL e ficheiro de referência
      console.log('A atualizar URL para conteúdo tipo link/video');

      if (conteudo.arquivo_path) {
        // Atualizar o conteúdo do ficheiro de referência
        const arquivoPath = path.join(uploadUtils.BASE_UPLOAD_DIR, conteudo.arquivo_path.replace(/^\/?(uploads|backend\/uploads)\//, ''));
        if (fs.existsSync(arquivoPath)) {
          try {
            fs.writeFileSync(arquivoPath, url);
            console.log(`Ficheiro de referência atualizado: ${arquivoPath}`);
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
            console.log(`Novo ficheiro de referência criado: ${fakeFilePath}`);
          } catch (fileError) {
            console.error(`Erro ao criar novo ficheiro de referência: ${fileError.message}`);
          }

          dadosAtualizacao.arquivo_path = `${conteudoPathAtual}/${fakeFileName}`;
        }
      }

      dadosAtualizacao.url = url;
    }

    // Atualizar o diretório de conteúdo se mudou de local
    if (precisaMoverArquivo) {
      dadosAtualizacao.dir_path = conteudoPathAlvo;
    }

    // Atualizar o conteúdo
    console.log('A atualizar registo na base de dados:', dadosAtualizacao);
    await conteudo.update(dadosAtualizacao);

    // Procurar o conteúdo atualizado com dados relacionados
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

// Middleware de upload
const uploadMiddleware = (req, res, next) => {
  // Rapaz, este middleware foi substituído pelo middleware uploadCursoConteudo em upload_middleware.js
  next();
};


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