const TopicoCurso = require("../../database/models/TopicoCurso");
const PastaCurso = require("../../database/models/PastaCurso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const Curso = require("../../database/models/Curso");
const fs = require('fs');
const path = require('path');

// Obter todos os tópicos de um curso com suas pastas e conteúdos
// Implementação alternativa que não depende de associações do Sequelize
const getTopicosByCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    
    // Buscar tópicos
    const topicos = await TopicoCurso.findAll({
      where: { 
        id_curso,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });

    // Array para armazenar o resultado final com relacionamentos
    const topicosFormatados = [];
    
    // Para cada tópico, buscar suas pastas
    for (const topico of topicos) {
      const topicoObj = topico.toJSON();
      topicoObj.expanded = false; // inicialmente fechado
      
      // Buscar pastas para este tópico
      const pastas = await PastaCurso.findAll({
        where: { 
          id_topico: topico.id_topico,
          ativo: true 
        },
        order: [['ordem', 'ASC']]
      });
      
      // Para cada pasta, buscar conteúdos
      const pastasComConteudos = [];
      
      for (const pasta of pastas) {
        const pastaObj = pasta.toJSON();
        pastaObj.expanded = false; // inicialmente fechada
        
        // Buscar conteúdos para esta pasta
        const conteudos = await ConteudoCurso.findAll({
          where: { 
            id_pasta: pasta.id_pasta,
            ativo: true 
          },
          order: [['ordem', 'ASC']]
        });
        
        pastaObj.conteudos = conteudos;
        pastasComConteudos.push(pastaObj);
      }
      
      topicoObj.pastas = pastasComConteudos;
      topicosFormatados.push(topicoObj);
    }

    res.json(topicosFormatados);
  } catch (error) {
    console.error("Erro ao buscar tópicos do curso:", error);
    res.status(500).json({ message: "Erro ao buscar tópicos" });
  }
};

// Criar um novo tópico
const createTopico = async (req, res) => {
  try {
    const { nome, id_curso, ordem } = req.body;

    if (!nome || !id_curso) {
      return res.status(400).json({ message: "Nome e ID do curso são obrigatórios" });
    }

    // Buscar informações do curso para obter o nome do diretório
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Criar o caminho do diretório para o tópico
    const nomeCursoDir = curso.nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    const nomeTopicoDir = nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    const topicoDir = `uploads/cursos/${nomeCursoDir}/${nomeTopicoDir}`;
    
    // Criar o diretório se não existir
    if (!fs.existsSync(topicoDir)) {
      fs.mkdirSync(topicoDir, { recursive: true });
    }

    const novoTopico = await TopicoCurso.create({
      nome,
      id_curso,
      ordem: ordem || 1,
      dir_path: topicoDir // Salvar o caminho do diretório
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

// Obter um tópico específico
const getTopicoById = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o tópico
    const topico = await TopicoCurso.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    const topicoObj = topico.toJSON();
    
    // Buscar pastas para este tópico
    const pastas = await PastaCurso.findAll({
      where: { 
        id_topico: id,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });
    
    // Para cada pasta, buscar conteúdos
    const pastasComConteudos = [];
    
    for (const pasta of pastas) {
      const pastaObj = pasta.toJSON();
      
      // Buscar conteúdos para esta pasta
      const conteudos = await ConteudoCurso.findAll({
        where: { 
          id_pasta: pasta.id_pasta,
          ativo: true 
        },
        order: [['ordem', 'ASC']]
      });
      
      pastaObj.conteudos = conteudos;
      pastasComConteudos.push(pastaObj);
    }
    
    topicoObj.pastas = pastasComConteudos;

    res.json(topicoObj);
  } catch (error) {
    console.error("Erro ao buscar tópico:", error);
    res.status(500).json({ message: "Erro ao buscar tópico" });
  }
};

// Atualizar um tópico
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo } = req.body;

    const topico = await TopicoCurso.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Se estiver mudando o nome, atualizar também o diretório
    if (nome !== undefined && nome !== topico.nome) {
      // Buscar o curso para obter o caminho completo
      const curso = await Curso.findByPk(topico.id_curso);
      if (curso) {
        const nomeCursoDir = curso.nome
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
        
        const nomeTopicoAntigoDir = topico.nome
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
        
        const nomeTopicoNovoDir = nome
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
        
        const topicoAntigoDir = `uploads/cursos/${nomeCursoDir}/${nomeTopicoAntigoDir}`;
        const topicoNovoDir = `uploads/cursos/${nomeCursoDir}/${nomeTopicoNovoDir}`;
        
        // Se o diretório antigo existir, renomear para o novo nome
        if (fs.existsSync(topicoAntigoDir)) {
          fs.renameSync(topicoAntigoDir, topicoNovoDir);
        } else {
          // Se não existir, criar o novo diretório
          if (!fs.existsSync(topicoNovoDir)) {
            fs.mkdirSync(topicoNovoDir, { recursive: true });
          }
        }
        
        // Atualizar o caminho do diretório no banco de dados
        topico.dir_path = topicoNovoDir;
      }
    }

    // Atualizar campos
    if (nome !== undefined) topico.nome = nome;
    if (ordem !== undefined) topico.ordem = ordem;
    if (ativo !== undefined) topico.ativo = ativo;

    await topico.save();

    res.json({ message: "Tópico atualizado com sucesso", topico });
  } catch (error) {
    console.error("Erro ao atualizar tópico:", error);
    res.status(500).json({ message: "Erro ao atualizar tópico" });
  }
};

// Excluir um tópico (soft delete)
const deleteTopico = async (req, res) => {
  try {
    const { id } = req.params;

    const topico = await TopicoCurso.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Soft delete - apenas marcar como inativo
    topico.ativo = false;
    await topico.save();

    // Também marcar todas as pastas e conteúdos como inativos
    await PastaCurso.update(
      { ativo: false },
      { where: { id_topico: id } }
    );

    // Buscar todas as pastas deste tópico
    const pastas = await PastaCurso.findAll({
      where: { id_topico: id },
      attributes: ['id_pasta']
    });

    const pastaIds = pastas.map(pasta => pasta.id_pasta);

    // Marcar conteúdos como inativos
    if (pastaIds.length > 0) {
      await ConteudoCurso.update(
        { ativo: false },
        { where: { id_pasta: pastaIds } }
      );
    }

    res.json({ message: "Tópico removido com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
    res.status(500).json({ message: "Erro ao excluir tópico" });
  }
};

module.exports = {
  getTopicosByCurso,
  createTopico,
  getTopicoById,
  updateTopico,
  deleteTopico
};