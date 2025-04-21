const Curso = require("../database/models/Curso");
const Area = require("../database/models/Area");
const Categoria = require("../database/models/Categoria");
const User = require("../database/models/User");
const Conteudo = require("../database/models/Conteudo");
const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const { removerInscricoesDoCurso } = require("./inscricoes_ctrl");
const { sequelize } = require("../../config/db");


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
    const imagem = req.file ? req.file.path : null;

    if (!nome || !tipo || !data_inicio || !data_fim || !id_area || !id_categoria) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
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
      imagem_path: imagem // Guardar o caminho na BD, tipo "uploads/cursos/nome-do-curso.png"
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

    res.json(curso);
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
    
    // Imagem do upload (se houver)
    const imagemUpload = req.file ? req.file.path : null;
    
    // Se o nome foi alterado e não há upload de nova imagem, precisamos renomear o arquivo existente
    if (nomeAlterado && !imagemUpload && curso.imagem_path) {
      try {
        // Obter caminho antigo da imagem
        const caminhoAntigo = curso.imagem_path;
        
        // Criar novo nome de arquivo baseado no novo nome do curso
        const novoNomeArquivo = nome.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") + ".png";
        const novoCaminho = `uploads/cursos/${novoNomeArquivo}`;
        
        // Verificar se o arquivo antigo existe
        if (fs.existsSync(caminhoAntigo)) {
          // Renomear o arquivo
          fs.renameSync(caminhoAntigo, novoCaminho);
          
          // Atualizar o caminho da imagem no objeto curso
          curso.imagem_path = novoCaminho;
          console.log(`Imagem renomeada de ${caminhoAntigo} para ${novoCaminho}`);
        }
      } catch (error) {
        console.error("Erro ao renomear arquivo de imagem:", error);
        // Continuar mesmo se houver erro no renomeio
      }
    }
    
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




















const fs = require('fs');
const path = require('path');

// Função para deletar curso com remoção da imagem
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

    // Guardar o caminho da imagem para excluir depois
    const imagemPath = curso.imagem_path;

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

      // Remover a imagem do curso do sistema de arquivos, se existir
      if (imagemPath) {
        const fullPath = path.resolve(imagemPath);
        
        // Verificar se o arquivo existe antes de tentar excluí-lo
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Imagem do curso removida: ${fullPath}`);
        } else {
          console.log(`Imagem não encontrada no caminho: ${fullPath}`);
        }
      }

      // Retornar resposta de sucesso
      return res.json({ 
        message: "Curso excluído com sucesso!", 
        inscricoesRemovidas: numInscricoesRemovidas,
        imagemRemovida: !!imagemPath
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