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

// Atualizar nota de um trabalho entregue
const updateTrabalhoNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;
    
    console.log(`Atualizando nota do trabalho ${id} para ${nota}`);
    
    // Validação da nota
    if (nota !== '' && nota !== null && (isNaN(Number(nota)) || Number(nota) < 0 || Number(nota) > 20)) {
      return res.status(400).json({ message: "A nota deve ser um valor entre 0 e 20" });
    }
    
    // Buscar o trabalho
    const trabalho = await Trabalho_Entregue.findByPk(id);
    
    if (!trabalho) {
      return res.status(404).json({ message: "Trabalho não encontrado" });
    }
    
    // Atualizar tanto a coluna 'nota' quanto 'avaliacao'
    // para garantir compatibilidade com diferentes partes do sistema
    await trabalho.update({
      nota: nota !== '' ? nota : null,
      avaliacao: nota !== '' ? nota : null,  // Garantir que o campo avaliacao também seja atualizado
      estado: nota !== '' ? 'Avaliado' : 'Pendente'
    });
    
    console.log(`Nota atualizada com sucesso para o trabalho ${id}: ${nota}`);
    
    res.json({
      message: "Nota atualizada com sucesso",
      trabalho: {
        id: trabalho.id_trabalho || trabalho.id,
        nota,
        estado: nota ? 'Avaliado' : 'Pendente'
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar nota do trabalho:", error);
    res.status(500).json({ 
      message: "Erro ao atualizar nota do trabalho",
      error: error.message 
    });
  }
};

module.exports = { 
  getAllTrabalhos, 
  createTrabalho,
  updateTrabalhoNota
};