const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const verificarToken = require('../../middleware/auth');
const { getAllTrabalhos, createTrabalho, updateTrabalhoNota } = require("../../controllers/trabalhos/trabalhos_ctrl");
const uploadMiddleware = require("../../middleware/upload_middleware");
const uploadUtils = require("../../middleware/upload");
const Curso = require("../../database/models/Curso");
const PastaCurso = require("../../database/models/PastaCurso");
const TopicoCurso = require("../../database/models/Curso_Topicos");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");

/**
 * Rotas para gestão de trabalhos e submissões
 * Permite upload, consulta e avaliação de trabalhos dos formandos
 */

/**
 * Middleware personalizado para upload de trabalhos
 * Gere o upload de ficheiros de trabalhos para a estrutura correta de diretórios
 * Verifica permissões e organiza ficheiros por curso/tópico/pasta
 */
const uploadTrabalho = async (req, res, next) => {
  try {
    // Processar upload do ficheiro
    uploadMiddleware.upload.single("ficheiro")(req, res, async (err) => {
      if (err) {
        return uploadMiddleware.handleUploadErrors(err, req, res, next);
      }

      // Se não houver ficheiro, continuar (controlador irá tratar)
      if (!req.file) {
        return next();
      }

      const { id_pasta, id_curso } = req.body;
      const id_utilizador = req.utilizador.id_utilizador;

      // Validar parâmetros obrigatórios
      if (!id_pasta || !id_curso) {
        return res.status(400).json({ message: 'Pasta e curso são obrigatórios' });
      }

      try {
        // Verificar se o utilizador está inscrito no curso
        const inscricao = await Inscricao_Curso.findOne({
          where: {
            id_utilizador: id_utilizador,
            id_curso: id_curso,
            estado: 'inscrito'
          }
        });

        if (!inscricao) {
          return res.status(403).json({ message: 'Não está inscrito neste curso' });
        }

        // Validar existência de pasta, curso e tópico
        const [pasta, curso] = await Promise.all([
          PastaCurso.findByPk(id_pasta),
          Curso.findByPk(id_curso)
        ]);

        if (!pasta) {
          return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }

        const topico = await TopicoCurso.findByPk(pasta.id_topico);
        if (!topico) {
          return res.status(404).json({ message: 'Tópico não encontrado' });
        }

        // Verificar se é um tópico de avaliação
        const isAvaliacao = 
          topico.nome.toLowerCase() === 'avaliação' || 
          topico.nome.toLowerCase() === 'avaliacao' || 
          topico.nome.toLowerCase().includes('avalia');

        // Preparar estrutura de diretórios
        const cursoSlug = uploadUtils.normalizarNome(curso.nome);
        const pastaSlug = uploadUtils.normalizarNome(pasta.nome);
        
        let submissoesDir;
        let destPath;
        
        if (isAvaliacao) {
          // Estrutura para avaliações: uploads/cursos/curso_slug/avaliacao/pasta_slug/submissoes
          submissoesDir = path.join(
            uploadUtils.BASE_UPLOAD_DIR,
            'cursos',
            cursoSlug,
            'avaliacao',
            pastaSlug,
            'submissoes'
          );
          destPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/submissoes`;
        } else {
          // Estrutura para outros tópicos: uploads/cursos/curso_slug/topicos/topico_slug/pasta_slug/submissoes
          const topicoSlug = uploadUtils.normalizarNome(topico.nome);
          submissoesDir = path.join(
            uploadUtils.BASE_UPLOAD_DIR,
            'cursos',
            cursoSlug,
            'topicos',
            topicoSlug,
            pastaSlug,
            'submissoes'
          );
          destPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}/submissoes`;
        }
        
        // Criar diretório se não existir
        uploadUtils.ensureDir(submissoesDir);
        
        if (!fs.existsSync(submissoesDir)) {
          console.error(`Erro: Diretório ${submissoesDir} não foi criado`);
          return res.status(500).json({ message: 'Erro ao criar diretórios para submissão' });
        }

        // Preparar nome único do ficheiro
        const originalName = req.file.originalname;
        const extension = path.extname(originalName);
        const timestamp = Date.now();
        const userEmail = req.utilizador.email || `user_${req.utilizador.id_utilizador}`;
        const cleanEmail = userEmail.replace(/[/\\?%*:|"<>]/g, '_');
        const fileName = `${cleanEmail}_topico${topico.id_topico}_pasta${pasta.id_pasta}_${timestamp}${extension}`;
        const filePath = path.join(submissoesDir, fileName);

        // Verificar se ficheiro temporário existe
        if (!fs.existsSync(req.file.path)) {
          console.error(`Erro: Ficheiro temporário ${req.file.path} não encontrado`);
          return res.status(500).json({ message: 'Ficheiro temporário não encontrado' });
        }
        
        try {
          // Mover ficheiro para destino final
          const movido = uploadUtils.moverArquivo(req.file.path, filePath);
          
          if (!movido) {
            // Tentativa alternativa: copiar e remover
            fs.copyFileSync(req.file.path, filePath);
            
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(req.file.path);
              } catch (unlinkError) {
                console.error(`Aviso: Não foi possível remover ficheiro temporário: ${unlinkError.message}`);
              }
            } else {
              console.error(`Erro: Ficheiro não foi copiado para ${filePath}`);
              return res.status(500).json({ message: 'Erro ao copiar ficheiro para o destino final' });
            }
          }
          
          console.log(`✅ Trabalho submetido: ${fileName}`);
        } catch (moveError) {
          console.error(`Erro crítico ao mover ficheiro: ${moveError.message}`);
          return res.status(500).json({ message: 'Erro ao mover ficheiro para o destino final' });
        }

        // Preparar informações para o controlador
        req.fileInfo = {
          originalName: originalName,
          fileName: fileName,
          filePath: path.join(destPath, fileName).replace(/\\/g, '/'),
          id_topico: topico.id_topico,
          id_pasta: pasta.id_pasta,
          isAvaliacao: isAvaliacao
        };

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

// === ROTAS DE TRABALHOS ===

// Obter lista de todos os trabalhos
router.get("/", verificarToken, getAllTrabalhos);

// Submeter novo trabalho
router.post("/", verificarToken, uploadTrabalho, createTrabalho);

// Rota específica para submissões de avaliação
router.post("/avaliacao", verificarToken, (req, res, next) => {
  req.isAvaliacaoUpload = true;
  req.body.tipo_submissao = 'avaliacao';
  next();
}, uploadTrabalho, createTrabalho);

// Atualizar nota de um trabalho (formadores/admins)
router.put("/:id", verificarToken, updateTrabalhoNota);

module.exports = router;