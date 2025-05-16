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
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");

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
      const id_utilizador = req.utilizador.id_utilizador;

      // Se não temos pasta ou curso, continuar e deixar o controlador tratar
      if (!id_pasta || !id_curso) {
        return res.status(400).json({ message: 'Pasta e curso são obrigatórios' });
      }

      // Verificar se a pasta e o curso existem e se o utilizador está inscrito
      try {
        // Verificar se o utilizador está inscrito no curso
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: id_utilizador,
            id_curso: id_curso,
            estado: 'ativa' // Adaptar ao campo correto do modelo
          }
        });

        if (!inscricao) {
          return res.status(403).json({ message: 'Não está inscrito neste curso' });
        }

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

        // Criar caminhos para salvar o ficheiro seguindo a estrutura correta
        const cursoSlug = uploadUtils.normalizarNome(curso.nome);
        
        // Criar os diretórios necessários
        const avaliacaoDir = path.join(
          uploadUtils.BASE_UPLOAD_DIR,
          'cursos',
          cursoSlug,
          'avaliacao'
        );
        
        const submissoesDir = path.join(avaliacaoDir, 'submissoes');
        
        // Criar diretórios recursivamente
        uploadUtils.ensureDir(avaliacaoDir);
        uploadUtils.ensureDir(submissoesDir);
        
        // Verificar se os diretórios foram criados corretamente
        if (!fs.existsSync(submissoesDir)) {
          console.error(`Erro: Diretório ${submissoesDir} não foi criado`);
          return res.status(500).json({ message: 'Erro ao criar diretórios para submissão' });
        }
        
        const destPath = `uploads/cursos/${cursoSlug}/avaliacao/submissoes`;
        
        console.log(`Salvando submissão em: ${submissoesDir}`);

        // Preparar nome do ficheiro
        const originalName = req.file.originalname;
        const extension = path.extname(originalName);
        const timestamp = Date.now();
        
        // Obter email do utilizador das informações disponíveis no req
        const userEmail = req.utilizador.email || `user_${req.utilizador.id_utilizador}`;
        
        // Limpar caracteres problemáticos no email
        const cleanEmail = userEmail.replace(/[/\\?%*:|"<>]/g, '_');
        
        // Incluir também ID do tópico e pasta para melhor organização
        const fileName = `${cleanEmail}_topico${topico.id_topico}_pasta${pasta.id_pasta}_${timestamp}${extension}`;
        
        const filePath = path.join(submissoesDir, fileName);

        // Mover o ficheiro do diretório temporário para o destino final
        console.log(`Movendo ficheiro de ${req.file.path} para ${filePath}`);
        
        // Verificar se o ficheiro temporário existe
        if (!fs.existsSync(req.file.path)) {
          console.error(`Erro: Ficheiro temporário ${req.file.path} não encontrado`);
          return res.status(500).json({ message: 'Ficheiro temporário não encontrado' });
        }
        
        try {
          // Usar fs.copyFileSync e fs.unlinkSync em vez da função moverArquivo
          fs.copyFileSync(req.file.path, filePath);
          fs.unlinkSync(req.file.path);
          console.log(`Ficheiro copiado e temporário removido com sucesso`);
        } catch (moveError) {
          console.error(`Erro ao mover ficheiro: ${moveError.message}`);
          return res.status(500).json({ message: 'Erro ao mover ficheiro para o destino final' });
        }

        // Adicionar informações ao req para usar no controller
        req.fileInfo = {
          originalName: originalName,
          fileName: fileName,
          filePath: path.join(destPath, fileName).replace(/\\/g, '/'),
          id_topico: topico.id_topico,
          id_pasta: pasta.id_pasta
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