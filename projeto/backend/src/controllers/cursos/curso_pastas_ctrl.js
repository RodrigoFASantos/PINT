const PastaCurso = require("../../database/models/PastaCurso");
const Curso_Topicos = require("../../database/models/Curso_Topicos");
const Curso = require("../../database/models/Curso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

// Criar uma nova pasta - Modificado para estrutura correta
const createPasta = async (req, res) => {
  try {
    const { nome, id_topico, ordem, data_limite } = req.body;



    if (!nome || !id_topico) {
      return res.status(400).json({ message: "Nome e ID do tópico são obrigatórios" });
    }

    // Procurar informações do tópico e curso para criar o caminho do diretório
    const topico = await Curso_Topicos.findByPk(id_topico);
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

    // Criar caminho para o diretório da pasta com nova estrutura
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    const pastaSlug = uploadUtils.normalizarNome(nome);
    
    let pastaDir, pastaUrlPath;
    
    if (isAvaliacao) {
      // MODIFICADO: Para pastas de avaliação, usar a estrutura: curso/avaliacao/nome_pasta
      pastaDir = path.join(
        uploadUtils.BASE_UPLOAD_DIR, 
        'cursos', 
        cursoSlug, 
        'avaliacao', 
        pastaSlug
      );
      
      pastaUrlPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}`;
      
      // Garantir que a estrutura de diretórios exista
      uploadUtils.ensureDir(path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao'));
    } else {
      // Para pastas normais, usar a estrutura: curso/topicos/topico_slug/pasta_slug
      const topicoSlug = uploadUtils.normalizarNome(topico.nome);
      pastaDir = path.join(
        uploadUtils.BASE_UPLOAD_DIR, 
        'cursos', 
        cursoSlug, 
        'topicos', 
        topicoSlug, 
        pastaSlug
      );
      
      pastaUrlPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}`;
      
      // Garantir que a estrutura de diretórios exista
      uploadUtils.ensureDir(path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos'));
      uploadUtils.ensureDir(path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug));
    }
    
    console.log(`Criando pasta: ${pastaDir}`);
    
    // Criar a pasta e suas subpastas
    uploadUtils.ensureDir(pastaDir);
    
    // MODIFICADO: Criar a estrutura correta de pastas
    if (isAvaliacao) {
      // Para avaliação: criar conteudos/Conteudos e submissoes/Submissoes
      uploadUtils.ensureDir(path.join(pastaDir, 'conteudos'));
      uploadUtils.ensureDir(path.join(pastaDir, 'conteudos', 'Conteudos'));
      uploadUtils.ensureDir(path.join(pastaDir, 'submissoes'));
      uploadUtils.ensureDir(path.join(pastaDir, 'submissoes', 'Submissoes'));
    } else {
      // Para tópicos regulares: criar apenas Conteudos
      uploadUtils.ensureDir(path.join(pastaDir, 'Conteudos'));
    }

    // Criar pasta na base de dados
    const novaPasta = await PastaCurso.create({
      nome,
      id_topico,
      ordem: ordem || 1,
      dir_path: pastaUrlPath,
      arquivo_path: pastaUrlPath,
      ativo: true,
      data_limite: data_limite || null
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

// Atualizar uma pasta
const updatePasta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo, data_limite } = req.body;


    const pasta = await PastaCurso.findByPk(id);

    if (!pasta) {
      return res.status(404).json({ message: "Pasta não encontrada" });
    }
    
    // Se está alterando o nome, precisamos atualizar os diretórios físicos
    if (nome !== undefined && nome !== pasta.nome) {
      // Procurar o tópico e curso para obter o caminho completo
      const topico = await Curso_Topicos.findByPk(pasta.id_topico);
      if (topico) {
        const curso = await Curso.findByPk(topico.id_curso);
        if (curso) {
          const cursoSlug = uploadUtils.normalizarNome(curso.nome);
          const pastaSlugAntigo = uploadUtils.normalizarNome(pasta.nome);
          const pastaSlugNovo = uploadUtils.normalizarNome(nome);
          
          // Verificar se o tópico é de avaliação
          const isAvaliacao = 
            topico.nome.toLowerCase() === 'avaliação' || 
            topico.nome.toLowerCase() === 'avaliacao' || 
            topico.nome.toLowerCase().includes('avalia');
          
          // Construir caminhos conforme o tipo
          let pastaAntigaDir, pastaNovaDir, pastaAntigaPath, pastaNovaPath;
          
          if (isAvaliacao) {
            // Avaliação: curso/avaliacao/pasta_slug
            pastaAntigaDir = path.join(
              uploadUtils.BASE_UPLOAD_DIR, 
              'cursos', 
              cursoSlug, 
              'avaliacao', 
              pastaSlugAntigo
            );
            
            pastaNovaDir = path.join(
              uploadUtils.BASE_UPLOAD_DIR, 
              'cursos', 
              cursoSlug, 
              'avaliacao', 
              pastaSlugNovo
            );
            
            pastaAntigaPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlugAntigo}`;
            pastaNovaPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlugNovo}`;
          } else {
            // Normal: curso/topicos/topico_slug/pasta_slug
            const topicoSlug = uploadUtils.normalizarNome(topico.nome);
            pastaAntigaDir = path.join(
              uploadUtils.BASE_UPLOAD_DIR, 
              'cursos', 
              cursoSlug, 
              'topicos', 
              topicoSlug, 
              pastaSlugAntigo
            );
            
            pastaNovaDir = path.join(
              uploadUtils.BASE_UPLOAD_DIR, 
              'cursos', 
              cursoSlug, 
              'topicos', 
              topicoSlug, 
              pastaSlugNovo
            );
            
            pastaAntigaPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlugAntigo}`;
            pastaNovaPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlugNovo}`;
          }
          
          // Se o diretório antigo existir, renomear para o novo nome
          if (fs.existsSync(pastaAntigaDir)) {
            try {
              fs.renameSync(pastaAntigaDir, pastaNovaDir);
              console.log(`Pasta renomeada de ${pastaAntigaDir} para ${pastaNovaDir}`);
            } catch (e) {
              console.error(`Erro ao renomear pasta: ${e.message}`);
              // Em caso de erro, criar o novo diretório
              uploadUtils.ensureDir(pastaNovaDir);
              uploadUtils.ensureDir(path.join(pastaNovaDir, 'conteudos'));
              uploadUtils.ensureDir(path.join(pastaNovaDir, 'submissoes'));
            }
          } else {
            // Se não existir, criar o novo diretório e suas subpastas
            console.log(`Pasta antiga não encontrada, criando nova estrutura: ${pastaNovaDir}`);
            uploadUtils.ensureDir(pastaNovaDir);
            uploadUtils.ensureDir(path.join(pastaNovaDir, 'conteudos'));
            uploadUtils.ensureDir(path.join(pastaNovaDir, 'submissoes'));
          }
          
          // Atualizar caminhos na base de dados
          pasta.dir_path = pastaNovaPath;
          pasta.arquivo_path = pastaNovaPath;
        }
      }
    }

    // Atualizar campos
    if (nome !== undefined) pasta.nome = nome;
    if (ordem !== undefined) pasta.ordem = ordem;
    if (ativo !== undefined) pasta.ativo = ativo;
    if (data_limite !== undefined) pasta.data_limite = data_limite;

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