const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const verificarToken = require('../../middleware/auth');
const { getAllTrabalhos, createTrabalho } = require("../../controllers/trabalhos/trabalhos_ctrl");
const uploadMiddleware = require("../../middleware/upload_middleware");
const uploadUtils = require("../../middleware/upload");
const Curso = require("../../database/models/Curso");
const PastaCurso = require("../../database/models/PastaCurso");
const TopicoCurso = require("../../database/models/Curso_Topicos");

// Criar middleware personalizado para lidar com uploads de trabalhos
const uploadTrabalho = async (req, res, next) => {
  try {
    // Usar o middleware de upload temporário
    uploadMiddleware.upload.single("ficheiro")(req, res, async (err) => {
      if (err) {
        return uploadMiddleware.handleUploadErrors(err, req, res, next);
      }

      // Se não houver ficheiro, continuar para permitir que o controlador trate isso
      if (!req.file) {
        return next();
      }

      const { id_pasta, id_curso } = req.body;

      // Se não temos pasta ou curso, continuar e deixar o controlador tratar
      if (!id_pasta || !id_curso) {
        return next();
      }

      // Verificar se a pasta e o curso existem
      try {
        const pasta = await PastaCurso.findByPk(id_pasta);
        if (!pasta) {
          return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        const curso = await Curso.findByPk(id_curso);
        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }

        const topico = await TopicoCurso.findByPk(pasta.id_topico);
        if (!topico) {
          return res.status(404).json({ message: 'Tópico não encontrado' });
        }

        // Verificar se é tópico de avaliação
        const isAvaliacao = 
          topico.nome.toLowerCase() === 'avaliação' || 
          topico.nome.toLowerCase() === 'avaliacao' || 
          topico.nome.toLowerCase().includes('avalia');

        // Criar caminhos para salvar o ficheiro
        const cursoSlug = uploadUtils.normalizarNome(curso.nome);
        const userId = req.utilizador.id_utilizador;

        // MODIFICADO: Usar estrutura simplificada para submissões
        const destDir = path.join(
          uploadUtils.BASE_UPLOAD_DIR,
          'cursos',
          cursoSlug,
          'avaliacao',  // Sempre usar pasta avaliacao
          'submissoes',
          `utilizador_${userId}`
        );
        
        const destPath = `uploads/cursos/${cursoSlug}/avaliacao/submissoes/utilizador_${userId}`;
        
        console.log(`Salvando submissão em: ${destDir}`);

        // Criar o diretório se não existir
        uploadUtils.ensureDir(destDir);

        // Preparar o nome do ficheiro com timestamp para evitar colisões
        const timestamp = Date.now();
        const originalName = req.file.originalname;
        const fileName = `${timestamp}_${originalName}`;
        const filePath = path.join(destDir, fileName);

        // Mover o ficheiro do diretório temporário para o destino final
        const movido = uploadUtils.moverArquivo(req.file.path, filePath);
        if (!movido) {
          return res.status(500).json({ message: 'Erro ao mover ficheiro para o destino final' });
        }

        // Adicionar informações ao req para usar no controller
        req.fileInfo = {
          originalName: originalName,
          fileName: fileName,
          filePath: path.join(destPath, fileName),
          isAvaliacao: isAvaliacao
        };

        console.log(`Ficheiro de trabalho guardado em: ${filePath}`);
        next();
      } catch (error) {
        console.error('Erro ao processar ficheiro de trabalho:', error);
        return res.status(500).json({ message: 'Erro ao processar ficheiro de trabalho', error: error.message });
      }
    });
  } catch (error) {
    console.error('Erro no middleware de upload de trabalho:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Adicionar rota específica para submissões de avaliação
router.post("/avaliacao", verificarToken, (req, res, next) => {
  // Definir explicitamente que este é um upload de avaliação
  req.isAvaliacaoUpload = true;
  req.body.tipo_submissao = 'avaliacao';
  next();
}, uploadTrabalho, createTrabalho);

// Rotas
router.get("/", verificarToken, getAllTrabalhos);
router.post("/", verificarToken, uploadTrabalho, createTrabalho);

module.exports = router;