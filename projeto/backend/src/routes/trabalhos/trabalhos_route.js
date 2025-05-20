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
            estado: 'inscrito' // Adaptar ao campo correto do modelo
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

        // Verificar se é um tópico de avaliação
        const isAvaliacao = 
          topico.nome.toLowerCase() === 'avaliação' || 
          topico.nome.toLowerCase() === 'avaliacao' || 
          topico.nome.toLowerCase().includes('avalia');

        // Criar caminhos para salvar o ficheiro seguindo a estrutura correta
        const cursoSlug = uploadUtils.normalizarNome(curso.nome);
        const pastaSlug = uploadUtils.normalizarNome(pasta.nome);
        
        let submissoesDir;
        let destPath;
        
        if (isAvaliacao) {
          // Para tópicos de avaliação, usar a estrutura correta:
          // uploads/cursos/curso_slug/avaliacao/pasta_slug/submissoes
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
          // Para outros tópicos, usar estrutura normal dentro de topicos
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
        
        // Criar diretório de submissões se não existir
        console.log(`Verificando diretório de submissões: ${submissoesDir}`);
        uploadUtils.ensureDir(submissoesDir);
        
        // Verificar se o diretório foi criado corretamente
        if (!fs.existsSync(submissoesDir)) {
          console.error(`Erro: Diretório ${submissoesDir} não foi criado`);
          return res.status(500).json({ message: 'Erro ao criar diretórios para submissão' });
        }
        
        console.log(`Diretório de submissões criado: ${submissoesDir}`);
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

        // Verificar se o ficheiro temporário existe antes de tentar movê-lo
        if (!fs.existsSync(req.file.path)) {
          console.error(`Erro: Ficheiro temporário ${req.file.path} não encontrado`);
          return res.status(500).json({ message: 'Ficheiro temporário não encontrado' });
        }
        
        console.log(`Movendo ficheiro de ${req.file.path} para ${filePath}`);
        
        try {
          // Tentar usar o método moverArquivo
          const movido = uploadUtils.moverArquivo(req.file.path, filePath);
          
          if (!movido) {
            console.error(`Falha ao mover ficheiro para ${filePath}, tentando copiar manualmente`);
            
            // Tentativa alternativa: copiar e depois remover
            fs.copyFileSync(req.file.path, filePath);
            
            // Verificar se o ficheiro foi copiado corretamente
            if (fs.existsSync(filePath)) {
              // Tentar remover o ficheiro temporário
              try {
                fs.unlinkSync(req.file.path);
                console.log(`Ficheiro copiado e temporário removido com sucesso`);
              } catch (unlinkError) {
                console.error(`Aviso: Não foi possível remover ficheiro temporário: ${unlinkError.message}`);
                // Continuar mesmo sem remover o temporário
              }
            } else {
              console.error(`Erro: Ficheiro não foi copiado para ${filePath}`);
              return res.status(500).json({ message: 'Erro ao copiar ficheiro para o destino final' });
            }
          }
          
          console.log(`Ficheiro movido com sucesso para: ${filePath}`);
        } catch (moveError) {
          console.error(`Erro crítico ao mover ficheiro: ${moveError.message}`);
          return res.status(500).json({ message: 'Erro ao mover ficheiro para o destino final' });
        }

        // Adicionar informações ao req para usar no controller
        req.fileInfo = {
          originalName: originalName,
          fileName: fileName,
          filePath: path.join(destPath, fileName).replace(/\\/g, '/'),
          id_topico: topico.id_topico,
          id_pasta: pasta.id_pasta,
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

// NOVA ROTA: Atualizar nota de um trabalho
router.put("/:id", verificarToken, updateTrabalhoNota);

module.exports = router;