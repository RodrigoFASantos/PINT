const User = require("../../database/models/User");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const Curso = require("../../database/models/Curso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Curso_Topicos = require("../../database/models/Curso_Topicos");
const PastaCurso = require("../../database/models/PastaCurso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const uploadUtils = require('../../middleware/upload');
const { sequelize } = require("../../config/db");
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Importando o controller de notificações diretamente
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
    console.error("Erro ao procurar cursos:", error);
    res.status(500).json({ message: "Erro ao procurar cursos" });
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

    // Procurar cursos que pertencem a essas categorias
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
    console.error("Erro ao procurar cursos por categoria:", error);
    res.status(500).json({ message: "Erro ao procurar cursos por categoria" });
  }
};

// Procurar curso por ID com detalhes
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id_utilizador;

    // Procurar o curso com todas as relações
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
        },
        {
          model: Curso_Topicos,
          as: "topicos",
          where: { ativo: true },
          required: false,
          order: [['ordem', 'ASC']]
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

    // Adicionar estado de acesso para cursos terminados
    cursoComInscritos.terminado = cursoTerminado;

    // Se o curso terminou e um utilizador está a tentar aceder, verificar se está inscrito
    if (cursoTerminado && userId) {
      try {
        // Verificar se o utilizador está inscrito neste curso
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: userId,
            id_curso: id,
            estado: 'inscrito' // Considera apenas inscrições ativas
          }
        });

        // Adicionar logs para diagnóstico
        console.log(`A verificar inscrição para utilizador ${userId} no curso ${id}`);
        console.log(`Resultado da procura de inscrição:`, inscricao);

        // Indicar se o utilizador tem acesso ao curso
        cursoComInscritos.acessoPermitido = !!inscricao;
        console.log(`Acesso permitido: ${cursoComInscritos.acessoPermitido}`);
      } catch (error) {
        console.error("Erro ao verificar inscrição:", error);
        // Em caso de erro, vamos considerar que o utilizador não tem acesso
        cursoComInscritos.acessoPermitido = false;
      }
    } else if (cursoTerminado) {
      // Se não há utilizador autenticado e o curso terminou, não permitir acesso
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
          console.log("Aviso: Não foi possível determinar coluna de estado de inscrição", e.message);
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
    console.error("Erro ao procurar curso:", error);
    res.status(500).json({ message: "Erro ao procurar curso", error: error.message });
  }
};




// Função para criar um novo curso
const createCurso = async (req, res) => {
  try {
    console.log("A iniciar criação de curso");
    console.log("Dados recebidos:", req.body);
    
    const { 
      nome, descricao, tipo, vagas, data_inicio, data_fim, 
      id_formador, id_area, id_categoria, topicos, id_topico_categoria
    } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Validação adicional para id_topico_categoria
    if (!id_topico_categoria) {
      return res.status(400).json({ message: "É necessário selecionar um tópico para o curso!" });
    }

    // Verificar se já existe um curso com o mesmo nome
    const cursoExistente = await Curso.findOne({ where: { nome } });
    if (cursoExistente) {
      return res.status(400).json({
        message: "Já existe um curso com este nome. Por favor, escolha um nome diferente.",
        error: "NOME_DUPLICADO"
      });
    }

    // Criar diretórios para o curso
    const cursoSlug = uploadUtils.normalizarNome(nome);
    const cursoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug);
    uploadUtils.ensureDir(cursoDir);
    const dirPath = `uploads/cursos/${cursoSlug}`;

    // Verificar se foi enviada uma imagem
    let imagemPath = null;
    if (req.file) {
      // Configurar o caminho da imagem para a base de dados
      imagemPath = `${dirPath}/capa.png`;
      console.log(`Caminho da imagem guardado na BD: ${imagemPath}`);
    }

    // Iniciar uma transação
    const t = await sequelize.transaction();

    try {
      // CORREÇÃO: Mapear id_topico_categoria para id_topico_area que é o nome correto no modelo
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
        id_topico_area: id_topico_categoria, // Correção aqui
        imagem_path: imagemPath,
        dir_path: dirPath,
        ativo: true
      }, { transaction: t });

      // Se foram fornecidos tópicos, criar cada um deles
      if (topicos && Array.isArray(topicos) && topicos.length > 0) {
        for (let i = 0; i < topicos.length; i++) {
          await Curso_Topicos.create({
            nome: topicos[i].nome,
            id_curso: novoCurso.id_curso,
            ordem: i + 1,
            ativo: true
          }, { transaction: t });
        }
      }

      // Confirmar a transação
      await t.commit();

      console.log(`Curso criado com sucesso: ${novoCurso.id_curso} - ${novoCurso.nome}`);

      // Notificar sobre o novo curso
      try {
        await notificacaoController.notificarNovoCurso(novoCurso);
        console.log("Notificação de curso criado enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de curso criado:", notificationError);
      }

      res.status(201).json({ 
        message: "Curso criado com sucesso!", 
        curso: { 
          id_curso: novoCurso.id_curso, 
          nome: novoCurso.nome 
        } 
      });
    } catch (error) {
      // Reverter a transação em caso de erro
      await t.rollback();
      console.error("Erro específico na transação:", error);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    console.error("Stack trace completo:", error.stack);
    res.status(500).json({ message: "Erro no servidor ao criar curso.", error: error.message });
  }
};

// Função updateCurso
const updateCurso = async (req, res) => {
  try {
    console.log("Update course request received:");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    // Fix: Get the id directly from req.params
    const id = req.params.id;  // This matches the route parameter /:id

    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area, id_categoria, ativo } = req.body;

    // Procurar dados atuais do curso para comparação
    const cursoAtual = await Curso.findByPk(id, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    if (!cursoAtual) {
      console.log(`Course with ID ${id} not found`);
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    console.log(`Course found: ${cursoAtual.nome} (ID: ${id})`);

    // Guardar os dados antigos para comparação
    const dataInicioAntiga = cursoAtual.data_inicio;
    const dataFimAntiga = cursoAtual.data_fim;
    const formadorAntigo = cursoAtual.formador ? {
      id_utilizador: cursoAtual.formador.id_utilizador,
      nome: cursoAtual.formador.nome
    } : null;

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

    // Recarregar o curso atualizado com as suas relações
    const cursoAtualizado = await Curso.findByPk(id, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // Verificar se o formador foi alterado
    if (id_formador && id_formador !== cursoAtual.id_formador) {
      try {
        // Chamar a função de notificação diretamente
        await notificacaoController.notificarFormadorAlterado(
          cursoAtualizado,
          formadorAntigo,
          cursoAtualizado.formador
        );
        console.log("Notificação de alteração de formador enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de formador:", notificationError);
        // Continuar mesmo com erro na notificação
      }
    }

    // Verificar se as datas foram alteradas
    const dataInicioAlterada = data_inicio &&
      new Date(data_inicio).getTime() !== new Date(dataInicioAntiga).getTime();
    const dataFimAlterada = data_fim &&
      new Date(data_fim).getTime() !== new Date(dataFimAntiga).getTime();

    if (dataInicioAlterada || dataFimAlterada) {
      try {
        // Chamar a função de notificação diretamente
        await notificacaoController.notificarDataCursoAlterada(
          cursoAtualizado,
          dataInicioAntiga,
          dataFimAntiga
        );
        console.log("Notificação de alteração de datas enviada com sucesso");
      } catch (notificationError) {
        console.error("Erro ao enviar notificação de alteração de datas:", notificationError);
        // Continuar mesmo com erro na notificação
      }
    }

    // Responder com sucesso
    return res.status(200).json({
      message: "Curso atualizado com sucesso",
      curso: cursoAtualizado
    });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    return res.status(500).json({
      message: "Erro ao atualizar curso",
      error: error.message
    });
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

    // Verificar se o utilizador é realmente um formador
    const formador = await User.findByPk(id_formador);
    if (!formador || formador.id_cargo !== 2) {
      return res.status(400).json({ message: "O utilizador especificado não é um formador" });
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

    // Guardar formador antigo para notificação
    const formadorAntigo = curso.id_formador ?
      await User.findByPk(curso.id_formador, { attributes: ['id_utilizador', 'nome'] }) : null;

    // Atualizar o curso com o novo formador
    curso.id_formador = id_formador;
    await curso.save();

    // Recarregar o curso para a notificação
    const cursoAtualizado = await Curso.findByPk(id_curso, {
      include: [{ model: User, as: 'formador', attributes: ['id_utilizador', 'nome'] }]
    });

    // Notificar sobre a alteração do formador
    try {
      await notificacaoController.notificarFormadorAlterado(
        cursoAtualizado,
        formadorAntigo,
        formador
      );
      console.log("Notificação de alteração de formador enviada com sucesso");
    } catch (notificationError) {
      console.error("Erro ao enviar notificação de alteração de formador:", notificationError);
      // Continuar mesmo com erro na notificação
    }

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
    console.error("Erro ao procurar inscrições do curso:", error);
    res.status(500).json({ message: "Erro ao procurar inscrições" });
  }
};

// Função para eliminar curso com remoção da imagem e diretórios
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão (id_cargo === 1 para administrador)
    if (req.user.id_cargo !== 1) {
      return res.status(403).json({
        message: "Não tem permissão para eliminar cursos"
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
      // Eliminar diretamente as inscrições
      const numInscricoesRemovidas = await Inscricao_Curso.destroy({
        where: { id_curso: id }
      });

      console.log(`Removidas ${numInscricoesRemovidas} inscrições do curso ${id}`);

      // Encontrar todas as pastas do curso através dos tópicos
      const topicos = await Curso_Topicos.findAll({
        where: { id_curso: id }
      });

      const topicoIds = topicos.map(topico => topico.id_topico);

      // Procurar todas as pastas dos tópicos
      const pastas = await PastaCurso.findAll({
        where: { id_topico: { [Op.in]: topicoIds } }
      });

      const pastaIds = pastas.map(pasta => pasta.id_pasta);

      // Eliminar os conteúdos das pastas
      if (pastaIds.length > 0) {
        await ConteudoCurso.destroy({
          where: { id_pasta: { [Op.in]: pastaIds } }
        });
        console.log(`Removidos conteúdos das pastas do curso ${id}`);
      }

      // Eliminar as pastas
      if (topicoIds.length > 0) {
        await PastaCurso.destroy({
          where: { id_topico: { [Op.in]: topicoIds } }
        });
        console.log(`Removidas pastas dos tópicos do curso ${id}`);
      }

      // Eliminar os tópicos
      await Curso_Topicos.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos tópicos do curso ${id}`);

      // Eliminar quaisquer conteúdos diretamente associados ao curso
      await ConteudoCurso.destroy({
        where: { id_curso: id }
      });
      console.log(`Removidos conteúdos diretos do curso ${id}`);

      // Eliminar o curso
      await curso.destroy();
      console.log(`Curso ${id} eliminado com sucesso`);

      // Remover o diretório do curso e todos os seus conteúdos
      if (fs.existsSync(cursoDirAbs)) {
        // Função recursiva para remover diretórios e ficheiros
        const removerDiretorioRecursivo = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((ficheiro) => {
              const caminhoCompleto = path.join(dir, ficheiro);
              if (fs.lstatSync(caminhoCompleto).isDirectory()) {
                // Se for diretório, chamar recursivamente
                removerDiretorioRecursivo(caminhoCompleto);
              } else {
                // Se for ficheiro, remover
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
        message: "Curso eliminado com sucesso!",
        inscricoesRemovidas: numInscricoesRemovidas,
        diretorioRemovido: true
      });
    } catch (error) {
      console.error("Erro específico ao eliminar relações:", error);
      return res.status(500).json({
        message: "Erro ao eliminar relações do curso",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Erro geral ao eliminar curso:", error);
    return res.status(500).json({
      message: "Erro no servidor ao eliminar curso.",
      error: error.message
    });
  }
};

// Procurar cursos sugeridos para o utilizador
const getCursosSugeridos = async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;

    // Procurar inscrições do utilizador
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador }
    });

    const cursosInscritosIds = inscricoes.map(i => i.id_curso);

    let cursosSugeridos = [];

    if (inscricoes.length > 0) {
      // Procurar categorias e áreas dos cursos em que o utilizador está inscrito
      const cursosInscritos = await Curso.findAll({
        where: { id_curso: cursosInscritosIds }
      });

      const categoriasInscrito = [...new Set(cursosInscritos.map(c => c.id_categoria))];
      const areasInscrito = [...new Set(cursosInscritos.map(c => c.id_area))];

      // Procurar cursos sugeridos com exclusão
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
    console.error("Erro ao procurar cursos sugeridos:", error);
    res.status(500).json({ message: "Erro no servidor ao procurar cursos sugeridos." });
  }
};





/*TÓPICOS*/
// Obter tópicos de um curso
const getTopicosCurso = async (req, res) => {
  try {
    const id_curso = req.params.id;
    
    const topicos = await Curso_Topicos.findAll({
      where: { id_curso, ativo: true },
      order: [['ordem', 'ASC']]
    });
    
    res.json(topicos);
  } catch (error) {
    console.error("Erro ao obter tópicos do curso:", error);
    res.status(500).json({ message: "Erro ao obter tópicos do curso" });
  }
};

// Criar um novo tópico para um curso
const createCurso_Topicos = async (req, res) => {
  try {
    const id_curso = req.params.id;
    const { nome, ordem } = req.body;
    
    if (!nome) {
      return res.status(400).json({ message: "Nome do tópico é obrigatório" });
    }
    
    // Verificar se o curso existe
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }
    
    // Obter a ordem máxima atual
    const ultimaOrdem = await Curso_Topicos.max('ordem', { 
      where: { id_curso } 
    }) || 0;
    
    // Criar o tópico
    const novoTopico = await Curso_Topicos.create({
      nome,
      id_curso,
      ordem: ordem || ultimaOrdem + 1,
      ativo: true
    });
    
    res.status(201).json({
      message: "Tópico criado com sucesso",
      topico: novoTopico
    });
  } catch (error) {
    console.error("Erro ao criar tópico:", error);
    res.status(500).json({ message: "Erro ao criar tópico" });
  }
};

// Atualizar um tópico
const updateCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    const { nome, ordem, ativo } = req.body;
    
    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }
    
    // Atualizar o tópico
    await topico.update({
      nome: nome !== undefined ? nome : topico.nome,
      ordem: ordem !== undefined ? ordem : topico.ordem,
      ativo: ativo !== undefined ? ativo : topico.ativo
    });
    
    res.json({
      message: "Tópico atualizado com sucesso",
      topico
    });
  } catch (error) {
    console.error("Erro ao atualizar tópico:", error);
    res.status(500).json({ message: "Erro ao atualizar tópico" });
  }
};

// Eliminar um tópico
const deleteCurso_Topicos = async (req, res) => {
  try {
    const id_topico = req.params.id;
    
    // Verificar se o tópico existe
    const topico = await Curso_Topicos.findByPk(id_topico);
    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }
    
    // Verificar se há pastas associadas a este tópico
    const pastas = await PastaCurso.findAll({
      where: { id_topico }
    });
    
    if (pastas.length > 0) {
      // Em vez de eliminar, marcar como inativo
      await topico.update({ ativo: false });
      return res.json({ 
        message: "Tópico desativado com sucesso. Não foi possível eliminar pois possui pastas associadas.",
        desativado: true
      });
    }
    
    // Se não há pastas, eliminar o tópico
    await topico.destroy();
    
    res.json({ message: "Tópico eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar tópico:", error);
    res.status(500).json({ message: "Erro ao eliminar tópico" });
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
  associarFormadorCurso,
  getTopicosCurso,
  createCurso_Topicos,
  updateCurso_Topicos,
  deleteCurso_Topicos
};