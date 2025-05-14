const Trabalho_Entregue = require("../../database/models/Trabalho_Entregue");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");

// Obter todos os trabalhos entregues
const getAllTrabalhos = async (req, res) => {
  try {
    const trabalhos = await Trabalho_Entregue.findAll();
    res.json(trabalhos);
  } catch (error) {
    console.error("Erro ao procurar trabalhos:", error);
    res.status(500).json({ message: "Erro ao procurar trabalhos" });
  }
};

// Criar novo trabalho entregue
const createTrabalho = async (req, res) => {
  try {
    const { id_pasta, id_curso } = req.body;
    const id_utilizador = req.utilizador.id_utilizador;
    
    // Se não temos ficheiro, retornar erro
    if (!req.file) {
      return res.status(400).json({ message: "Ficheiro é obrigatório!" });
    }
    
    // Se não temos pasta ou curso, retornar erro
    if (!id_pasta || !id_curso) {
      return res.status(400).json({ message: "ID da pasta e do curso são obrigatórios!" });
    }
    
    // Procurar a inscrição do utilizador neste curso
    let id_inscricao;
    try {
      const inscricao = await Inscricao_Curso.findOne({
        where: {
          id_utilizador: id_utilizador,
          id_curso: id_curso
        }
      });
      
      if (inscricao) {
        id_inscricao = inscricao.id_inscricao;
      } else {
        console.warn(`Utilizador ${id_utilizador} não está inscrito no curso ${id_curso}`);
      }
    } catch (inscricaoError) {
      console.error("Erro ao procurar inscrição:", inscricaoError);
    }
    
    // Se temos as informações do middleware personalizado, usá-las
    let ficheiro_path = req.file.path;
    let nome_ficheiro = req.file.originalname;
    
    if (req.fileInfo) {
      ficheiro_path = req.fileInfo.filePath;
      nome_ficheiro = req.fileInfo.originalName;
    }

    // Criar o registo do trabalho
    const novoTrabalho = await Trabalho_Entregue.create({
      id_inscricao,
      id_utilizador,
      id_pasta,
      id_curso,
      ficheiro_path,
      nome_ficheiro,
      data_submissao: new Date(),
      tipo: req.fileInfo?.isAvaliacao ? 'Avaliação' : 'Trabalho'
    });

    res.status(201).json({ 
      message: "Trabalho entregue com sucesso!", 
      trabalho: novoTrabalho 
    });
  } catch (error) {
    console.error("Erro ao entregar trabalho:", error);
    res.status(500).json({ 
      message: "Erro no servidor ao entregar trabalho.",
      error: error.message
    });
  }
};

module.exports = { getAllTrabalhos, createTrabalho };