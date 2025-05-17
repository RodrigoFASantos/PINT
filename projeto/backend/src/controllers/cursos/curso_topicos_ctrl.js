const Curso_Topicos = require("../../database/models/Curso_Topicos");
const PastaCurso = require("../../database/models/PastaCurso");
const ConteudoCurso = require("../../database/models/ConteudoCurso");
const Curso = require("../../database/models/Curso");
const fs = require('fs');
const path = require('path');
const uploadUtils = require('../../middleware/upload');

// Obter todos os tópicos de um curso com suas pastas e conteúdos
const getTopicosByCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;
    
    // Procurar tópicos
    const topicos = await Curso_Topicos.findAll({
      where: { 
        id_curso,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });

    // Array para armazenar o resultado final com relacionamentos
    const topicosFormatados = [];
    
    // Para cada tópico, procurar suas pastas
    for (const topico of topicos) {
      const topicoObj = topico.toJSON();
      topicoObj.expanded = false; // inicialmente fechado
      
      // Procurar pastas para este tópico
      const pastas = await PastaCurso.findAll({
        where: { 
          id_topico: topico.id_topico,
          ativo: true 
        },
        order: [['ordem', 'ASC']]
      });
      
      // Para cada pasta, procurar conteúdos
      const pastasComConteudos = [];
      
      for (const pasta of pastas) {
        const pastaObj = pasta.toJSON();
        pastaObj.expanded = false; // inicialmente fechada 
        
        // Procurar conteúdos para esta pasta
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
    console.error("Erro ao procurar tópicos do curso:", error);
    res.status(500).json({ message: "Erro ao procurar tópicos" });
  }
};

// Criar um novo tópico
const createTopico = async (req, res) => {
  try {
    const { nome, id_curso, ordem } = req.body;

    if (!nome || !id_curso) {
      return res.status(400).json({ message: "Nome e ID do curso são obrigatórios" });
    }

    // Procurar informações do curso para obter o nome do diretório
    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se é um tópico de avaliação
    const isAvaliacao = 
      nome.toLowerCase() === 'avaliação' || 
      nome.toLowerCase() === 'avaliacao' || 
      nome.toLowerCase().includes('avalia');

    // Primeiro criar o tópico na base de dados
    const novoTopico = await Curso_Topicos.create({
      nome,
      id_curso,
      ordem: ordem || 1,
      ativo: true
    });

    // Criar os diretórios corretamente usando a nova estrutura
    const cursoSlug = uploadUtils.normalizarNome(curso.nome);
    
    if (isAvaliacao) {
      // Para tópicos de avaliação, usar DIRETAMENTE a pasta 'avaliacao' sem subpasta adicional
      const avaliacaoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
      const avaliacaoUrlPath = `uploads/cursos/${cursoSlug}/avaliacao`;
      
      // Criar a pasta de avaliação
      console.log(`Criando pasta de avaliação: ${avaliacaoDir}`);
      uploadUtils.ensureDir(avaliacaoDir);
      
      // Atualizar os caminhos no tópico
      novoTopico.dir_path = avaliacaoUrlPath;
      novoTopico.arquivo_path = avaliacaoUrlPath;
    } else {
      // Para tópicos normais, usar a estrutura com "topicos"
      const topicoSlug = uploadUtils.normalizarNome(nome);
      const topicosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
      const topicoDir = path.join(topicosDir, topicoSlug);
      const topicoUrlPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}`;
      
      // Criar o diretório se não existir
      console.log(`Criando pasta para tópico: ${topicoDir}`);
      uploadUtils.ensureDir(topicosDir);
      uploadUtils.ensureDir(topicoDir);
      
      // Atualizar os caminhos no tópico
      novoTopico.dir_path = topicoUrlPath;
      novoTopico.arquivo_path = topicoUrlPath;
    }
    
    // Guardar as alterações
    await novoTopico.save();

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

    // Procurar o tópico
    const topico = await Curso_Topicos.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    const topicoObj = topico.toJSON();
    
    // Procurar pastas para este tópico
    const pastas = await PastaCurso.findAll({
      where: { 
        id_topico: id,
        ativo: true 
      },
      order: [['ordem', 'ASC']]
    });
    
    // Para cada pasta, procurar conteúdos
    const pastasComConteudos = [];
    
    for (const pasta of pastas) {
      const pastaObj = pasta.toJSON();
      
      // Procurar conteúdos para esta pasta
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
    console.error("Erro ao procurar tópico:", error);
    res.status(500).json({ message: "Erro ao procurar tópico" });
  }
};

// Atualizar um tópico
const updateTopico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ordem, ativo } = req.body;

    const topico = await Curso_Topicos.findByPk(id);

    if (!topico) {
      return res.status(404).json({ message: "Tópico não encontrado" });
    }

    // Se estiver a mudar o nome, atualizar também o diretório
    if (nome !== undefined && nome !== topico.nome) {
      // Procurar o curso para obter o caminho completo
      const curso = await Curso.findByPk(topico.id_curso);
      if (curso) {
        const cursoSlug = uploadUtils.normalizarNome(curso.nome);
        
        // Verificar se é um tópico de avaliação (atual ou novo)
        const isAvaliacaoAtual = 
          topico.nome.toLowerCase() === 'avaliação' || 
          topico.nome.toLowerCase() === 'avaliacao' || 
          topico.nome.toLowerCase().includes('avalia');
        
        const isAvaliacaoNovo = 
          nome.toLowerCase() === 'avaliação' || 
          nome.toLowerCase() === 'avaliacao' || 
          nome.toLowerCase().includes('avalia');
        
        const topicoSlugAntigo = uploadUtils.normalizarNome(topico.nome);
        const topicoSlugNovo = uploadUtils.normalizarNome(nome);
        
        if (isAvaliacaoAtual) {
          // Se era avaliação e continua sendo
          if (isAvaliacaoNovo) {
            // Mantém na pasta avaliacao, sem alterar estrutura
            const avaliacaoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
            const avaliacaoUrlPath = `uploads/cursos/${cursoSlug}/avaliacao`;
            
            // Atualizar caminhos na base de dados sem alterar estrutura
            topico.dir_path = avaliacaoUrlPath;
            topico.arquivo_path = avaliacaoUrlPath;
          } 
          // Se era avaliação mas não é mais
          else {
            // Mover para a pasta topicos
            const avaliacaoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
            const topicosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
            const topicoNovoDir = path.join(topicosDir, topicoSlugNovo);
            
            // Caminhos relativos para a base de dados
            const topicoNovoPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlugNovo}`;
            
            // Garantir que o diretório de destino exista
            uploadUtils.ensureDir(topicosDir);
            uploadUtils.ensureDir(topicoNovoDir);
            
            // Atualizar caminhos na base de dados
            topico.dir_path = topicoNovoPath;
            topico.arquivo_path = topicoNovoPath;
          }
        } 
        // Se NÃO era avaliação
        else {
          // Se NÃO era avaliação mas agora é
          if (isAvaliacaoNovo) {
            // Mover para a pasta avaliacao
            const avaliacaoDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
            const topicosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
            const topicoAntigoDir = path.join(topicosDir, topicoSlugAntigo);
            
            // Caminhos relativos para a base de dados
            const avaliacaoUrlPath = `uploads/cursos/${cursoSlug}/avaliacao`;
            
            // Garantir que a pasta avaliacao exista
            uploadUtils.ensureDir(avaliacaoDir);
            
            // Atualizar caminhos na base de dados
            topico.dir_path = avaliacaoUrlPath;
            topico.arquivo_path = avaliacaoUrlPath;
          } 
          // Se continua não sendo avaliação, apenas atualiza o nome
          else {
            const topicosDir = path.join(uploadUtils.BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
            const topicoAntigoDir = path.join(topicosDir, topicoSlugAntigo);
            const topicoNovoDir = path.join(topicosDir, topicoSlugNovo);
            
            // Caminhos relativos para a base de dados
            const topicoAntigoPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlugAntigo}`;
            const topicoNovoPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlugNovo}`;
            
            // Se o diretório antigo existir, renomear para o novo nome
            if (fs.existsSync(topicoAntigoDir)) {
              fs.renameSync(topicoAntigoDir, topicoNovoDir);
            } else {
              // Se não existir, criar o novo diretório
              uploadUtils.ensureDir(topicoNovoDir);
            }
            
            // Atualizar os caminhos na base de dados
            topico.dir_path = topicoNovoPath;
            topico.arquivo_path = topicoNovoPath;
          }
        }
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

    const topico = await Curso_Topicos.findByPk(id);

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

    // Procurar todas as pastas deste tópico
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