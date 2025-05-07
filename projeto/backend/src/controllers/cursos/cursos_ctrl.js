const Curso = require("../../database/models/Curso");
const Area = require("../../database/models/Area");
const Categoria = require("../../database/models/Categoria");
const User = require("../../database/models/User");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const TopicoCurso = require("../../database/models/TopicoCurso");
const PastaCurso = require("../../database/models/PastaCurso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const uploadUtils = require('../../middleware/upload');
const { sequelize } = require("../../config/db");
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const notificacaoController = require('../notificacoes/notificacoes_ctrl');

// Obter todos os cursos com paginação
const getAllCursos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Parâmetros de filtro opcionais
    const { categoria, area, formador, search, tipo, estado, ativo, vagas } = req.query;

    // Construir condições de filtro
    const where = {};

    if (categoria) {
      where.id_categoria = categoria;
    }

    if (area) {
      where.id_area = area;
    }

    if (formador) {
      where.id_formador = formador;
    }

    if (search) {
      where.nome = { [Op.iLike]: `%${search}%` };
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (ativo !== undefined) {
      // "false" vem como string da query, por isso comparo diretamente
      where.ativo = ativo === 'false' ? false : true;
    }

    if (vagas) {
      where.vagas = { [Op.gte]: parseInt(vagas, 10) };
    }

    const { count, rows } = await Curso.findAndCountAll({
      where,
      offset,
      limit,
      order: [['data_inicio', 'DESC']],
      include: [
        {
          model: User,
          as: "formador",
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Area,
          as: "area"
        },
        {
          model: Categoria,
          as: "categoria"
        }
      ]
    });

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).json({ message: "Erro ao buscar cursos" });
  }
};

// Função para obter cursos filtrados por categorias (para associação com formador)
const getCursosByCategoria = async (req, res) => {
  try {
    const { categorias } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!categorias) {
      return res.status(400).json({ message: "É necessário fornecer pelo menos uma categoria" });
    }

    // Converter a string de categorias em um array de IDs
    const categoriaIds = categorias.split(',').map(id => parseInt(id.trim()));

    // Buscar cursos que pertencem a essas categorias
    const { count, rows } = await Curso.findAndCountAll({
      where: {
        id_categoria: { [Op.in]: categoriaIds }
      },
      include: [
        {
          model: Categoria,
          as: "categoria"
        },
        {
          model: Area,
          as: "area"
        }
      ],
      offset,
      limit,
      order: [['nome', 'ASC']]
    });

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Erro ao buscar cursos por categoria:", error);
    res.status(500).json({ message: "Erro ao buscar cursos por categoria" });
  }
};

// Função para criar um novo curso
const createCurso = async (req, res) => {
  try {
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area, id_categoria } = req.body;

    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Criar nome do diretório para o curso
    const cursoSlug = uploadUtils.normalizarNome(nome);
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);

    // Garantir que o diretório exista
    uploadUtils.ensureDir(cursoDir);

    // Caminho para o banco de dados
    const dirPath = `uploads/cursos/${cursoSlug}`;

    // Verificar se foi enviada uma imagem
    let imagemPath = null;
    if (req.file) {
      // Configurar o caminho da imagem para o banco de dados
      imagemPath = `${dirPath}/capa.png`;
      console.log(`Caminho da imagem salvo no BD: ${imagemPath}`);
    }

    const novoCurso = await Curso.create({
      nome,
      descricao,
      tipo,
      vagas: tipo === "sincrono" ? vagas : null,
      data_inicio,
      data_fim,
      id_formador,
      id_area,
      id_categoria,
      imagem_path: imagemPath,
      dir_path: dirPath,
      ativo: true
    });

    // Notificar sobre o novo curso
    try {
      const axios = require('axios');
      const apiUrl = process.env.API_URL || 'http://localhost:4000';
      
      await axios.post(`${apiUrl}/api/notificacoes/curso-criado`, {
        id_curso: novoCurso.id_curso,
        nome_curso: novoCurso.nome,
        id_categoria: novoCurso.id_categoria,
        id_area: novoCurso.id_area
      });
      
      console.log("Notificação de curso criado enviada com sucesso");
    } catch (notificationError) {
      console.error("Erro ao enviar notificação de curso criado:", notificationError);
      // Continuar mesmo com erro na notificação
    }

    res.status(201).json({ message: "Curso criado com sucesso!", curso: novoCurso.nome });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao criar curso." });
  }
};

// Função updateCurso
const updateCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area, id_categoria, ativo } = req.body;

    // Buscar dados atuais do curso para comparação
    const cursoAtual = await Curso.findByPk(id_curso, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    if (!cursoAtual) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Atualizar o curso
    await cursoAtual.update({
      nome: nome || cursoAtual.nome,
      descricao: descricao || cursoAtual.descricao,
      tipo: tipo || cursoAtual.tipo,
      vagas: vagas || cursoAtual.vagas,
      data_inicio: data_inicio || cursoAtual.data_inicio,
      data_fim: data_fim || cursoAtual.data_fim,
      id_formador: id_formador || cursoAtual.id_formador,
      id_area: id_area || cursoAtual.id_area,
      id_categoria: id_categoria || cursoAtual.id_categoria,
      ativo: ativo !== undefined ? ativo : cursoAtual.ativo
    });

    // Verificar se o formador foi alterado
    if (id_formador && id_formador !== cursoAtual.id_formador) {
      try {
        // Buscar dados do novo formador
        const novoFormador = await User.findByPk(id_formador, {
          attributes: ['id_utilizador', 'nome']
        });

        const axios = require('axios');
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        
        await axios.post(`${apiUrl}/api/notificacoes/formador-alterado`, {
          id_curso: parseInt(id_curso),
          nome_curso: nome || cursoAtual.nome,
          id_formador_antigo: cursoAtual.id_formador,
          nome_formador_antigo: cursoAtual.formador?.nome || 'Formador anterior',
          id_formador_novo: id_formador,
          nome_formador_novo: novoFormador?.nome || 'Novo formador'
        });
        
        console.log("Notificação de alteração de formador enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de formador:", notificationError);
        // Continuar mesmo com erro na notificação
      }
    }

    // Verificar se as datas foram alteradas
    const dataInicioAlterada = data_inicio && new Date(data_inicio).getTime() !== new Date(cursoAtual.data_inicio).getTime();
    const dataFimAlterada = data_fim && new Date(data_fim).getTime() !== new Date(cursoAtual.data_fim).getTime();

    if (dataInicioAlterada || dataFimAlterada) {
      try {
        const axios = require('axios');
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        
        await axios.post(`${apiUrl}/api/notificacoes/data-curso-alterada`, {
          id_curso: parseInt(id_curso),
          nome_curso: nome || cursoAtual.nome,
          data_inicio_antiga: cursoAtual.data_inicio,
          data_fim_antiga: cursoAtual.data_fim,
          data_inicio_nova: data_inicio || cursoAtual.data_inicio,
          data_fim_nova: data_fim || cursoAtual.data_fim
        });
        
        console.log("Notificação de alteração de datas enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de datas:", notificationError);
        // Continuar mesmo com erro na notificação
      }
    }

    // Responder com sucesso
    return res.status(200).json({
      message: "Curso atualizado com sucesso",
      curso: await Curso.findByPk(id_curso)
    });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    return res.status(500).json({
      message: "Erro ao atualizar curso",
      error: error.message
    });
  }
};

// Buscar curso por ID com detalhes
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador; // ID do usuário atual, se estiver autenticado

    // Buscar o curso com suas relações
    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: User,
          as: "formador",
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Area,
          as: "area"
        },
        {
          model: Categoria,
          as: "categoria"
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Crie uma cópia do curso para modificar
    const cursoComInscritos = curso.toJSON();

    // Verificar se o curso já terminou
    const dataAtual = new Date();
    const dataFimCurso = new Date(curso.data_fim);
    const cursoTerminado = dataFimCurso < dataAtual;

    // Adicionar status de acesso para cursos terminados
    cursoComInscritos.terminado = cursoTerminado;

    // Se o curso terminou e um usuário está tentando acessar, verificar se está inscrito
    if (cursoTerminado && userId) {
      try {
        // Verificar se o usuário está inscrito neste curso
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: userId,
            id_curso: id,
            estado: 'inscrito' // Considera apenas inscrições ativas
          }
        });

        // Adicionar logs para diagnóstico
        console.log(`Verificando inscrição para usuário ${userId} no curso ${id}`);
        console.log(`Resultado da busca de inscrição:`, inscricao);

        // Indicar se o usuário tem acesso ao curso
        cursoComInscritos.acessoPermitido = !!inscricao;
        console.log(`Acesso permitido: ${cursoComInscritos.acessoPermitido}`);
      } catch (error) {
        console.error("Erro ao verificar inscrição:", error);
        // Em caso de erro, vamos considerar que o usuário não tem acesso
        cursoComInscritos.acessoPermitido = false;
      }
    } else if (cursoTerminado) {
      // Se não há usuário autenticado e o curso terminou, não permitir acesso
      cursoComInscritos.acessoPermitido = false;
    } else {
      // Se o curso não terminou, permitir acesso
      cursoComInscritos.acessoPermitido = true;
    }

    // Adicionar contagem de inscrições ativas (código existente)
    try {
      if (curso.tipo === 'sincrono' && curso.vagas) {
        let where = { id_curso: id };

        try {
          const inscricao = await Inscricao_Curso.findOne({ where: { id_curso: id } });
          if (inscricao) {
            if ('ativo' in inscricao.dataValues) {
              where.ativo = true;
            } else if ('status' in inscricao.dataValues) {
              where.status = 'ativo';
            }
          }
        } catch (e) {
          console.log("Aviso: Não foi possível determinar coluna de status de inscrição", e.message);
        }

        const inscricoesAtivas = await Inscricao_Curso.count({ where });
        cursoComInscritos.inscricoesAtivas = inscricoesAtivas;
      }
    } catch (inscricoesError) {
      console.error("Erro ao contar inscrições (não fatal):", inscricoesError);
      cursoComInscritos.inscricoesAtivas = 0;
    }

    res.json(cursoComInscritos);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ message: "Erro ao buscar curso", error: error.message });
  }
};

// Nova função: Associar formador a um curso
const associarFormadorCurso = async (req, res) => {
  try {
    const { id_curso, id_formador } = req.body;

    if (!id_curso || !id_formador) {
      return res.status(400).json({ message: "É necessário fornecer o ID do curso e do formador" });
    }

    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se o usuário é realmente um formador
    const formador = await User.findByPk(id_formador);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(400).json({ message: "O usuário especificado não é um formador" });
    }

    // Verificar se o formador tem acesso à categoria/área do curso
    const categoriaDoFormador = await sequelize.query(
      `SELECT COUNT(*) as count FROM formador_categoria 
       WHERE id_formador = :id_formador AND id_categoria = :id_categoria`,
      {
        replacements: { id_formador, id_categoria: curso.id_categoria },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (categoriaDoFormador[0].count === '0') {
      return res.status(400).json({
        message: "O formador não está associado à categoria deste curso",
        categoriaId: curso.id_categoria
      });
    }

    // Atualizar o curso com o novo formador
    curso.id_formador = id_formador;
    await curso.save();

    res.json({
      message: "Formador associado ao curso com sucesso",
      curso: {
        id_curso: curso.id_curso,
        nome: curso.nome,
        id_formador: curso.id_formador
      }
    });
  } catch (error) {
    console.error("Erro ao associar formador ao curso:", error);
    res.status(500).json({ message: "Erro ao associar formador ao curso", error: error.message });
  }
};

// Listar inscrições de um curso
const getInscricoesCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;

    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_curso },
      include: [
        {
          model: User,
          as: "utilizador",
          attributes: ['id_utilizador', 'nome', 'email', 'telefone']
        }
      ]
    });

    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao buscar inscrições do curso:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
};

// Função para deletar curso com remoção da imagem e diretórios
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão (id_cargo === 1 para administrador)
    if (req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Você não tem permissão para excluir cursos"
      });
    }

    // Verificar se o curso existe antes de iniciar operações
    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Guardar o caminho do diretório do curso
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const cursoDir = curso.dir_path || `uploads/cursos/${cursoSlug}`;
    const cursoDirAbs = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);

    try {
      // Excluir diretamente as inscrições
      const numInscricoesRemovidas = await Inscricao_Curso.destroy({
        where: { id_curso: id }
      });

      console.log(`Removidas ${numInscricoesRemovidas} inscrições do curso ${id}`);

      // Encontrar todas as pastas do curso através dos tópicos
      const topicos = await TopicoCurso.findAll({
        where: { id_curso: id }
      });

      const topicoIds = topicos.map(topico => topico.id_topico);

      // Buscar todas as pastas dos tópicos
      const pastas = await PastaCurso.findAll({
        where: { id_topico: { [Op.in]: topicoIds } }
      });

      const pastaIds = pastas.map(pasta => pasta.id_pasta);

      // Excluir os conteúdos das pastas
      if (pastaIds.length > 0) {
        await ConteudoCurso.destroy({
          where: { id_pasta: { [Op.in]: pastaIds } }
        });
        console.log(`Removidos conteúdos das pastas do curso ${id}`);
      }

      // Excluir as pastas
      if (topicoIds.length > 0) {
        await PastaCurso.destroy({
          where: { id_topico: { [Op.in]: topicoIds } }
        });
        console.log(`Removidas pastas dos tópicos do curso ${id}`);
      }

      // Excluir os tópicos
      await TopicoCurso.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos tópicos do curso ${id}`);

      // Excluir quaisquer conteúdos diretamente associados ao curso
      await ConteudoCurso.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos conteúdos diretos do curso ${id}`);

      // Excluir o curso
      await curso.destroy();
      console.log(`Curso ${id} excluído com sucesso`);

      // Remover o diretório do curso e todos os seus conteúdos
      if (fs.existsSync(cursoDirAbs)) {
        // Função recursiva para remover diretórios e arquivos
        const removerDiretorioRecursivo = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((arquivo) => {
              const caminhoCompleto = path.join(dir, arquivo);
              if (fs.lstatSync(caminhoCompleto).isDirectory()) {
                // Se for diretório, chamar recursivamente
                removerDiretorioRecursivo(caminhoCompleto);
              } else {
                // Se for arquivo, remover
                fs.unlinkSync(caminhoCompleto);
              }
            });
            // Remover o diretório vazio
            fs.rmdirSync(dir);
          }
        };

        removerDiretorioRecursivo(cursoDirAbs);
        console.log(`Diretório do curso removido: ${cursoDirAbs}`);
      } else {
        console.log(`Diretório não encontrado no caminho: ${cursoDirAbs}`);
      }

      // Retornar resposta de sucesso
      return res.json({
        message: "Curso excluído com sucesso!",
        inscricoesRemovidas: numInscricoesRemovidas,
        diretorioRemovido: true
      });
    } catch (error) {
      console.error("Erro específico ao excluir relações:", error);
      return res.status(500).json({
        message: "Erro ao excluir relações do curso",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Erro geral ao excluir curso:", error);
    return res.status(500).json({
      message: "Erro no servidor ao excluir curso.",
      error: error.message
    });
  }
};

// Buscar cursos sugeridos para o utilizador
const getCursosSugeridos = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;

    // Buscar inscrições do utilizador
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador }
    });

    const cursosInscritosIds = inscricoes.map(i => i.id_curso);

    let cursosSugeridos = [];

    if (inscricoes.length > 0) {
      // Buscar categorias e áreas dos cursos em que o user está inscrito
      const cursosInscritos = await Curso.findAll({
        where: { id_curso: cursosInscritosIds }
      });

      const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria))];
      const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area))];

      // Buscar cursos sugeridos com exclusão
      cursosSugeridos = await Curso.findAll({
        where: {
          id_categoria: categoriasInscrito,
          id_area: { [Op.notIn]: areasInscrito },
          id_curso: { [Op.notIn]: cursosInscritosIds },
          vagas: { [Op.gt]: 0 },
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()')
      });
    }

    // Se não houver cursos sugeridos (ou utilizador sem inscrições), mostrar cursos aleatórios
    if (cursosSugeridos.length === 0) {
      cursosSugeridos = await Curso.findAll({
        where: {
          id_curso: { [Op.notIn]: cursosInscritosIds },
          vagas: { [Op.gt]: 0 },
          ativo: true
        },
        limit: 10,
        order: sequelize.literal('RANDOM()')
      });
    }

    return res.json(cursosSugeridos);
  } catch (error) {
    console.error("Erro ao buscar cursos sugeridos:", error);
    res.status(500).json({ message: "Erro no servidor ao buscar cursos sugeridos." });
  }
};


module.exports = {
  getAllCursos,
  getCursosByCategoria,
  createCurso,
  getCursoById,
  getInscricoesCurso,
  updateCurso,
  deleteCurso,
  getCursosSugeridos,
  associarFormadorCurso
};