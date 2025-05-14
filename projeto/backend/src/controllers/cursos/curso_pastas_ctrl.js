const PastaCurso = require("../../database/models/PastaCurso");
const TopicoCurso = require("../../database/models/TopicoCurso");
const Curso = require("../../database/models/Curso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

// Criar uma nova pasta - MODIFICADO para estrutura simplificada
const createPasta = async (req, res) => {
  try {
    const { nome, id_topico, ordem } = req.body;

    if (!nome || !id_topico) {
      return res.status(400).json({ message: "Nome e ID do tópico são obrigatórios" });
    }

    // Procurar informações do tópico e curso para criar o caminho do diretório
    const topico = await TopicoCurso.findByPk(id_topico);
    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    const curso = await Curso.findByPk(topico.id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se o tópico é de avaliação
    const isAvaliacao = 
      topico.nome.toLowerCase() === 'avaliação' || 
      topico.nome.toLowerCase() === 'avaliacao' || 
      topico.nome.toLowerCase().includes('avalia');
    
    console.log(`Criando pasta para tópico: ${topico.nome}, É avaliação: ${isAvaliacao ? 'SIM' : 'NÃO'}`);

    // Criar caminho para o diretório da pasta - MODIFICADO: estrutura simplificada
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    
    // Usar estrutura simplificada
    const pastaBase = isAvaliacao ? 'avaliacao' : 'conteudos';
    
    // Caminho do diretório (pasta base)
    const pastaDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, pastaBase);
    const pastaUrlPath = `uploads/cursos/${cursoSlug}/${pastaBase}`;
    
    console.log(`Pasta será criada como referência em BD, usando diretório: ${pastaDir}`);
    
    // Criar diretório base se não existir
    uploadUtils.ensureDir(pastaDir);
    
    // Se for avaliação, criar também pasta de submissões
    if (isAvaliacao) {
      const submissoesDir = path.join(pastaDir, 'submissoes');
      console.log(`Criando pasta de submissões: ${submissoesDir}`);
      uploadUtils.ensureDir(submissoesDir);
    }

    // Criar pasta na base de dados (sem criar pasta física adicional além da base)
    const novaPasta = await PastaCurso.create({
      nome,
      id_topico,
      ordem: ordem || 1,
      dir_path: pastaUrlPath, // Usar o caminho base
      arquivo_path: pastaUrlPath, // Mesmo caminho para manter consistência
      ativo: true
    });

    res.status(201).json({ 
      message: "Pasta criada com sucesso", 
      pasta: novaPasta
    });
  } catch (error) {
    console.error("Erro ao criar pasta:", error);
    res.status(500).json({ message: "Erro ao criar pasta" });
  }
};

// Obter todas as pastas de um tópico com seus conteúdos
const getPastasByTopico = async (req, res) => {
  try {
    const { id_topico } = req.params;
    
    const pastas = await PastaCurso.findAll({
      where: { 
        id_topico,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });

    // Array para armazenar pastas com seus conteúdos
    const pastasComConteudos = [];
    
    // Para cada pasta, procurar seus conteúdos
    for (const pasta of pastas) {
      const pastaObj = pasta.toJSON();
      pastaObj.expanded = false; // inicialmente fechado
      
      // Procurar conteúdos desta pasta
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

    res.json(pastasComConteudos);
  } catch (error) {
    console.error("Erro ao procurar pastas do tópico:", error);
    res.status(500).json({ message: "Erro ao procurar pastas" });
  }
};

// Obter uma pasta específica
const getPastaById = async (req, res) => {
  try {
    const { id } = req.params;

    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }

    const pastaObj = pasta.toJSON();
    
    // Procurar conteúdos desta pasta
    const conteudos = await ConteudoCurso.findAll({
      where: { 
        id_pasta: id,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });
    
    pastaObj.conteudos = conteudos;

    res.json(pastaObj);
  } catch (error) {
    console.error("Erro ao procurar pasta:", error);
    res.status(500).json({ message: "Erro ao procurar pasta" });
  }
};

// Atualizar uma pasta - MODIFICADO para estrutura simplificada
const updatePasta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo } = req.body;

    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }
    
    // Se está alterando o nome, não precisamos alterar diretórios físicos
    // pois a pasta não existe fisicamente na estrutura simplificada
    if (nome !== undefined && nome !== pasta.nome) {
      console.log(`Alterando nome da pasta ${pasta.nome} para ${nome} (apenas na base de dados)`);
    }

    // Atualizar campos
    if (nome !== undefined) pasta.nome = nome;
    if (ordem !== undefined) pasta.ordem = ordem;
    if (ativo !== undefined) pasta.ativo = ativo;

    await pasta.save();

    res.json({ message: "Pasta atualizada com sucesso", pasta });
  } catch (error) {
    console.error("Erro ao atualizar pasta:", error);
    res.status(500).json({ message: "Erro ao atualizar pasta" });
  }
};

// Excluir uma pasta (soft delete)
const deletePasta = async (req, res) => {
  try {
    const { id } = req.params;

    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }

    // Soft delete - apenas marcar como inativo
    pasta.ativo = false;
    await pasta.save();

    // Também marcar todos os conteúdos como inativos
    await ConteudoCurso.update(
      { ativo: false },
      { where: { id_pasta: id } }
    );

    res.json({ message: "Pasta removida com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir pasta:", error);
    res.status(500).json({ message: "Erro ao excluir pasta" });
  }
};

module.exports = {
  createPasta,
  getPastasByTopico,
  getPastaById,
  updatePasta,
  deletePasta
};