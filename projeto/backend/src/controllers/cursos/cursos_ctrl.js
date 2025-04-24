const Curso = require("../../database/models/Curso");
const Area = require("../../database/models/Area");
const Categoria = require("../../database/models/Categoria");
const User = require("../../database/models/User");
const Conteudo = require("../../database/models/ConteudoCurso");
const TopicoCurso = require("../../database/models/TopicoCurso");
const PastaCurso = require("../../database/models/PastaCurso");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const { removerInscricoesDoCurso } = require("./curso_inscricoes_ctrl");
const { sequelize } = require("../../../config/db");
const fs = require('fs');
const path = require('path');

// Obter todos os cursos com paginação
const getAllCursos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Curso.findAndCountAll({
      offset,
      limit,
      order: [['data_inicio', 'DESC']] // ordena por data de início (opcional)
    });

    res.json({
      cursos: rows,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).json({ message: "Erro ao buscar cursos" });
  }
};

// Criar um novo curso (recebe req.file da rota)
const createCurso = async (req, res) => {
  try {
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, id_formador, id_area, id_categoria } = req.body;
    
    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Criar diretório para o curso
    const nomeCursoDir = nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    const cursoDir = `uploads/cursos/${nomeCursoDir}`;
    
    // Verificar se o diretório existe, se não, criar
    if (!fs.existsSync(cursoDir)) {
      fs.mkdirSync(cursoDir, { recursive: true });
    }

    // Verificar se foi enviada uma imagem
    const imagem = req.file ? req.file.path : null;

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
      imagem_path: imagem, // Guardar o caminho na BD, já estará no diretório correto do curso
      dir_path: cursoDir // Guardar o caminho do diretório do curso
    });

    res.status(201).json({ message: "Curso criado com sucesso!", curso: novoCurso });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao criar curso." });
  }
};

// Buscar curso por ID com detalhes
const getCursoById = async (req, res) => {
  try {
    const id = req.params.id;
    
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
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Crie uma cópia do curso para modificar
    const cursoComInscritos = JSON.parse(JSON.stringify(curso));
    
    try {
      // Tente contar as inscrições em um bloco try/catch separado
      // para evitar que um erro aqui afete o retorno do curso
      if (curso.tipo === 'sincrono' && curso.vagas) {
        // Verificar a estrutura da tabela Inscricao_Curso primeiro
        let where = { id_curso: id };
        
        // Adicione condições de inscrição ativa apenas se soubermos que o campo existe
        // Aqui estamos testando as possíveis colunas para inscrições ativas
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
      // Se houver erro, apenas defina como 0 e continue
      cursoComInscritos.inscricoesAtivas = 0;
    }

    res.json(cursoComInscritos);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ message: "Erro ao buscar curso", error: error.message });
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

// Atualizar curso existente
const updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria } = req.body;
    
    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado!" });
    }

    // Verificar se o nome do curso foi alterado
    const nomeAlterado = nome && nome !== curso.nome;
    
    // Diretório atual do curso
    const nomeCursoAtualDir = curso.nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    const cursoAtualDir = `uploads/cursos/${nomeCursoAtualDir}`;
    
    // Se o nome foi alterado, renomear o diretório
    if (nomeAlterado) {
      const nomeCursoNovoDir = nome
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      
      const cursoNovoDir = `uploads/cursos/${nomeCursoNovoDir}`;
      
      // Verificar se o diretório existe e renomear
      if (fs.existsSync(cursoAtualDir)) {
        fs.renameSync(cursoAtualDir, cursoNovoDir);
        console.log(`Diretório renomeado de ${cursoAtualDir} para ${cursoNovoDir}`);
        
        // Atualizar o caminho do diretório no banco
        curso.dir_path = cursoNovoDir;
      } else {
        // Se não existir, criar o novo diretório
        if (!fs.existsSync(cursoNovoDir)) {
          fs.mkdirSync(cursoNovoDir, { recursive: true });
        }
        curso.dir_path = cursoNovoDir;
      }
    }
    
    // Imagem do upload (se houver)
    const imagemUpload = req.file ? req.file.path : null;
    
    // Atualizar campos
    if (nome) curso.nome = nome;
    if (descricao !== undefined) curso.descricao = descricao;
    if (tipo) curso.tipo = tipo;
    if (vagas !== undefined) curso.vagas = vagas;
    if (data_inicio) curso.data_inicio = data_inicio;
    if (data_fim) curso.data_fim = data_fim;
    if (estado) curso.estado = estado;
    if (ativo !== undefined) curso.ativo = ativo;
    if (id_formador) curso.id_formador = id_formador;
    if (id_area) curso.id_area = id_area;
    if (id_categoria) curso.id_categoria = id_categoria;
    if (imagemUpload) curso.imagem_path = imagemUpload;

    await curso.save();

    res.json({ message: "Curso atualizado com sucesso!", curso });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    res.status(500).json({ message: "Erro no servidor ao atualizar curso." });
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
    const cursoDir = curso.dir_path || 
                    `uploads/cursos/${curso.nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")}`;

    try {
      // Excluir diretamente as inscrições
      const numInscricoesRemovidas = await Inscricao_Curso.destroy({
        where: { id_curso: id }
      });
      
      console.log(`Removidas ${numInscricoesRemovidas} inscrições do curso ${id}`);

      // Excluir os conteúdos do curso
      await Conteudo.destroy({
        where: { id_curso: id }
      });
      
      console.log(`Removidos conteúdos do curso ${id}`);

      // Excluir o curso
      await curso.destroy();
      
      console.log(`Curso ${id} excluído com sucesso`);

      // Remover o diretório do curso e todos os seus conteúdos
      if (fs.existsSync(cursoDir)) {
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
        
        removerDiretorioRecursivo(cursoDir);
        console.log(`Diretório do curso removido: ${cursoDir}`);
      } else {
        console.log(`Diretório não encontrado no caminho: ${cursoDir}`);
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
    
    // Verificar se é um erro de conexão
    if (error.name === 'SequelizeConnectionError' || 
        error.name === 'SequelizeConnectionRefusedError' ||
        error.name === 'SequelizeHostNotFoundError' ||
        error.name === 'SequelizeConnectionTimedOutError') {
      return res.status(503).json({ 
        message: "Serviço temporariamente indisponível. Problemas com o banco de dados.",
        error: "Erro de conexão com o banco de dados"
      });
    }
    
    return res.status(500).json({ 
      message: "Erro no servidor ao excluir curso.", 
      error: error.message 
    });
  }
};

module.exports = { getAllCursos, createCurso, getCursoById, getInscricoesCurso, updateCurso, deleteCurso };