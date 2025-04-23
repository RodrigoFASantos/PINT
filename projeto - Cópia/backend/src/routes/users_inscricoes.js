const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const Inscricao_Curso = require("../database/models/Inscricao_Curso");
const Curso = require("../database/models/Curso");
const Area = require("../database/models/Area");
const Categoria = require("../database/models/Categoria");
const User = require("../database/models/User");

// Buscar todas as inscrições do usuário logado
router.get("/inscricoes", verificarToken, async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;
    
    const inscricoes = await Inscricao_Curso.findAll({
      where: { id_utilizador },
      include: [
        {
          model: Curso,
          as: "curso",
          include: [
            {
              model: Area,
              as: "area",
              include: {
                model: Categoria,
                as: "categoria"
              }
            },
            {
              model: User,
              as: "formador",
              attributes: ['id_utilizador', 'nome', 'email']
            }
          ]
        }
      ]
    });
    
    res.json(inscricoes);
  } catch (error) {
    console.error("Erro ao buscar inscrições do usuário:", error);
    res.status(500).json({ message: "Erro ao buscar inscrições" });
  }
});

// ALTERAÇÃO IMPORTANTE: Rota corrigida para verificar inscrição
// Verificar se o usuário está inscrito em um curso específico
router.get("/verificar/:id_curso", verificarToken, async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;
    const { id_curso } = req.params;
    
    const inscricao = await Inscricao_Curso.findOne({
      where: { 
        id_utilizador, 
        id_curso,
        estado: "inscrito" // apenas inscrições ativas
      }
    });
    
    res.json({ inscrito: !!inscricao });
  } catch (error) {
    console.error("Erro ao verificar inscrição:", error);
    res.status(500).json({ message: "Erro ao verificar inscrição" });
  }
});

// Mantendo a rota original também para compatibilidade
router.get("/inscrito/:id_curso", verificarToken, async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;
    const { id_curso } = req.params;
    
    const inscricao = await Inscricao_Curso.findOne({
      where: { 
        id_utilizador, 
        id_curso,
        estado: "inscrito" // apenas inscrições ativas
      }
    });
    
    res.json({ inscrito: !!inscricao });
  } catch (error) {
    console.error("Erro ao verificar inscrição:", error);
    res.status(500).json({ message: "Erro ao verificar inscrição" });
  }
});

// Cancela a inscrição do usuário em um curso
router.put("/cancelar-inscricao/:id_curso", verificarToken, async (req, res) => {
  try {
    const id_utilizador = req.user.id_utilizador;
    const { id_curso } = req.params;
    
    const inscricao = await Inscricao_Curso.findOne({
      where: { 
        id_utilizador, 
        id_curso,
        estado: "inscrito"
      }
    });
    
    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }
    
    // Verificar se o curso já está em andamento
    const curso = await Curso.findByPk(id_curso);
    if (curso && new Date() > new Date(curso.data_inicio)) {
      return res.status(400).json({ 
        message: "Não é possível cancelar a inscrição, pois o curso já está em andamento" 
      });
    }
    
    // Atualizar estado da inscrição
    inscricao.estado = "cancelado";
    await inscricao.save();
    
    res.json({ message: "Inscrição cancelada com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    res.status(500).json({ message: "Erro ao cancelar inscrição" });
  }
});

module.exports = router;