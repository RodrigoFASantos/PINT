const Conteudo = require("../database/models/Conteudo");

// Obter todos os conteúdos
const getAllConteudos = async (req, res) => {
  try {
    const conteudos = await Conteudo.findAll();
    res.json(conteudos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar conteúdos" });
  }
};

const createConteudo = async (req, res) => {
  try {
    const { id_curso, tipo, descricao, url_ou_ficheiro } = req.body;

    if (!id_curso || !tipo || !url_ou_ficheiro) {
      return res.status(400).json({ message: "Campos obrigatórios em falta!" });
    }

    // Verificar se o tipo existe
    // const tipoExiste = await TipoConteudo.findOne({ where: { nome: tipo, ativo: true } });
    // if (!tipoExiste) {
    //   return res.status(400).json({ message: "Tipo de conteúdo inválido ou inativo" });
    // }

    const novoConteudo = await Conteudo.create({
      id_curso,
      tipo,
      descricao,
      url_ou_ficheiro,
    });

    res.status(201).json({ message: "Conteúdo criado com sucesso!", conteudo: novoConteudo });
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);
    res.status(500).json({ message: "Erro no servidor ao criar conteúdo." });
  }
};
/*
const deleteConteudo = async (req, res) => {
try{
  
  const { id } = req.params;
  
  const conteudo = await Conteudo.findByPk(id);
}

if (!conteudo) {
  return res.status(404).json({ message: "Conteudo não encontrado!" });
}

await conteudo.destroy();

res.json({ message: "Conteudo apagado com sucesso!" });
} catch (error) {
console.error("Erro ao apagar conteudo:", error);
res.status(500).json({ message: "Erro no servidor ao apagar conteudo." });
}
};
*/





module.exports = { getAllConteudos, createConteudo };
