const Trabalho_Entregue = require("../../database/models/Trabalho_Entregue");
const PastaCurso = require("../../database/models/PastaCurso");
const Curso = require("../../database/models/Curso");
const User = require("../../database/models/User");
const { sequelize } = require("../../config/db");

// Obter submissões para avaliação
const getSubmissoes = async (req, res) => {
  try {
    const { id_curso, id_utilizador, id_pasta } = req.query;
    
    // Adicionar logs detalhados para debug
    console.log("Parâmetros recebidos para submissões:", { id_curso, id_utilizador, id_pasta });
    
    // Validar parâmetros
    if (!id_curso) {
      return res.status(400).json({ message: "ID do curso é obrigatório" });
    }
    
    // Construir a query com tipos corretos (convertendo para números)
    const where = { 
      id_curso: parseInt(id_curso)
    };
    
    if (id_utilizador) {
      where.id_utilizador = parseInt(id_utilizador);
    }
    
    if (id_pasta) {
      where.id_pasta = parseInt(id_pasta);
    }
    
    console.log("Filtros da consulta:", where);
    
    // Incluir relações necessárias para obter dados completos
    const submissoes = await Trabalho_Entregue.findAll({
      where,
      include: [
        {
          model: PastaCurso,
          as: "pasta",
          attributes: ['id_pasta', 'nome', 'data_limite']
        },
        {
          model: User,
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email']
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'nome', 'duracao']
        }
      ],
      order: [['data_submissao', 'DESC']]
    });
    
    console.log(`Encontradas ${submissoes.length} submissões`);
    
    // Verificar o estado de cada submissão e garantir consistência
    const submissoesProcessadas = submissoes.map(submissao => {
      const item = submissao.toJSON();
      
      // Se tem nota ou avaliacao mas estado não é 'Avaliado', corrigir o estado
      if ((item.nota || item.avaliacao) && item.estado !== 'Avaliado') {
        console.log(`Corrigindo estado para submissão ${item.id_trabalho} de ${item.estado} para Avaliado`);
        item.estado = 'Avaliado';
      }
      
      return item;
    });
    
    res.json(submissoesProcessadas);
  } catch (error) {
    console.error("Erro detalhado ao obter submissões:", error);
    res.status(500).json({ 
      message: "Erro ao obter submissões", 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Atualizar nota de uma submissão
const updateSubmissaoNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;
    
    console.log(`Atualizando nota da submissão ${id} para ${nota}`);
    
    // Validação da nota
    if (nota !== '' && nota !== null && (isNaN(Number(nota)) || Number(nota) < 0 || Number(nota) > 20)) {
      return res.status(400).json({ message: "A nota deve ser um valor entre 0 e 20" });
    }
    
    // Buscar a submissão
    const submissao = await Trabalho_Entregue.findByPk(id);
    
    if (!submissao) {
      return res.status(404).json({ message: "Submissão não encontrada" });
    }
    
    // Atualizar tanto a coluna 'nota' quanto 'avaliacao'
    // para garantir compatibilidade com diferentes partes do sistema
    const notaValue = nota !== '' ? nota : null;
    
    // Log das informações atuais da submissão
    console.log(`Estado atual da submissão:`, {
      id: submissao.id_trabalho,
      nota_atual: submissao.nota,
      avaliacao_atual: submissao.avaliacao,
      estado_atual: submissao.estado
    });
    
    // Atualizar na base de dados usando uma query SQL direta 
    // para garantir que os campos corretos sejam atualizados
    const result = await sequelize.query(
      `UPDATE trabalho_entregue 
       SET nota = :nota, avaliacao = :avaliacao, estado = :estado 
       WHERE id_trabalho = :id`,
      {
        replacements: { 
          nota: notaValue, 
          avaliacao: notaValue, 
          estado: notaValue !== null ? 'Avaliado' : 'Pendente',
          id: id 
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`Resultado da atualização:`, result);
    
    // Buscar a submissão atualizada para confirmar
    const submissaoAtualizada = await Trabalho_Entregue.findByPk(id);
    console.log(`Submissão após atualização:`, {
      id: submissaoAtualizada.id_trabalho,
      nota: submissaoAtualizada.nota,
      avaliacao: submissaoAtualizada.avaliacao,
      estado: submissaoAtualizada.estado
    });
    
    res.json({
      message: "Nota atualizada com sucesso",
      submissao: {
        id: submissao.id_trabalho,
        nota: notaValue,
        avaliacao: notaValue,
        estado: notaValue !== null ? 'Avaliado' : 'Pendente'
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar nota da submissão:", error);
    res.status(500).json({ 
      message: "Erro ao atualizar nota da submissão",
      error: error.message 
    });
  }
};

module.exports = {
  getSubmissoes,
  updateSubmissaoNota
};