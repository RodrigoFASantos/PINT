const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Avaliacao = require("../../database/models/Avaliacao");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Trabalho = require("../../database/models/Trabalho_Entregue");
const Formando_Presenca = require("../../database/models/Formando_Presenca");
const Categoria = require("../../database/models/Categoria");
const Area = require("../../database/models/Area");
const CursoPresenca = require("../../database/models/Curso_Presenca");
const { generateCertificate } = require("../../utils/certificateGenerator");

const API_BASE = "http://localhost:4000/api";

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { jsPDF } = require('jspdf');
require('jspdf-autotable');


// Função para verificar se o formador completou as horas totais do curso
const verificarHorasFormador = async (req, res) => {
  try {
    const { cursoId } = req.params;
    console.log(`Verificando horas para o curso ID: ${cursoId}`);

    // Obter informações do curso
    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({
        success: false,
        message: "Curso não encontrado"
      });
    }
    console.log(`Curso encontrado: ${curso.nome}, Duração: ${curso.duracao}`);

    // Obter o ID do formador do curso
    const idFormador = curso.id_formador;
    if (!idFormador) {
      return res.status(400).json({
        success: false,
        message: "Curso não possui formador designado"
      });
    }
    console.log(`Formador ID: ${idFormador}`);

    // Obter todas as presenças do curso
    const presencasCurso = await CursoPresenca.findAll({
      where: { id_curso: cursoId }
    });

    // Array para armazenar IDs de presença do curso
    const idsPresencasCurso = presencasCurso.map(p => p.id_curso_presenca);

    // Calcular horas registradas pelo formador
    let horasRegistradas = 0;

    if (idsPresencasCurso.length > 0) {
      try {
        const { sequelize } = Formando_Presenca;

        // Usando consulta SQL direta com os IDs específicos
        const query = `
          SELECT COALESCE(SUM(fp.duracao), 0) as total 
          FROM formando_presenca fp 
          WHERE fp.id_curso_presenca IN (?) AND fp.id_utilizador = ?
        `;

        const [results] = await sequelize.query(query, {
          replacements: [idsPresencasCurso, idFormador],
          type: sequelize.QueryTypes.SELECT
        });

        if (results && results.total !== null && !isNaN(results.total)) {
          horasRegistradas = Number(results.total);
        }
      } catch (sqlError) {
        console.error("Erro na consulta SQL:", sqlError);
      }
    }

    // Verificar se as horas registradas atingiram as horas totais do curso
    const horasTotaisCurso = curso.duracao || 0;
    const horasConcluidas = horasRegistradas >= horasTotaisCurso;

    console.log(`Resultado: Horas registradas = ${horasRegistradas}, Horas necessárias = ${horasTotaisCurso}, Concluído = ${horasConcluidas}`);

    return res.json({
      success: true,
      horasConcluidas,
      horasRegistradas,
      horasTotaisCurso
    });

  } catch (error) {
    console.error("Erro ao verificar horas do formador:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao verificar horas do formador",
      error: error.message
    });
  }
};



// Procurar certificado existente
const getCertificado = async (req, res) => {
  try {
    const { id_avaliacao } = req.params;

    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    if (!avaliacao.certificado) {
      return res.status(404).json({ message: "Certificado não disponível" });
    }

    res.json({
      url: avaliacao.url_certificado
    });
  } catch (error) {
    console.error("Erro ao procurar certificado:", error);
    res.status(500).json({ message: "Erro ao procurar certificado" });
  }
};

const salvarCertificado = async (req, res) => {
  try {
    const { id_utilizador } = req.body;

    // Debug: Registrar informações recebidas
    console.log("Dados recebidos:", {
      id_utilizador, fileInfo: req.file ? {
        nome: req.file.originalname,
        tamanho: req.file.size,
        tipo: req.file.mimetype
      } : 'Nenhum arquivo'
    });

    if (!req.file || !id_utilizador) {
      return res.status(400).json({ message: "Dados insuficientes para salvar o certificado" });
    }

    // Obter o e-mail do utilizador para criar a pasta correta
    const utilizador = await User.findByPk(id_utilizador);
    if (!utilizador) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    // Formatar e-mail para uso em caminho de arquivo
    const emailFormatado = utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');

    // Debug: Registrar caminho do diretório
    const baseDir = process.cwd();
    const uploadsPath = process.env.CAMINHO_PASTA_UPLOADS || 'uploads';
    const userDir = path.join(baseDir, uploadsPath, 'users', emailFormatado);
    const certDir = path.join(userDir, 'certificados');

    console.log("Caminhos:", {
      baseDir,
      uploadsPath,
      userDir,
      certDir,
      existeBaseDir: fs.existsSync(baseDir),
      existeUploads: fs.existsSync(path.join(baseDir, uploadsPath))
    });

    // Criar estrutura de diretórios com tratamento de erros
    try {
      if (!fs.existsSync(path.join(baseDir, uploadsPath))) {
        fs.mkdirSync(path.join(baseDir, uploadsPath), { recursive: false });
      }

      if (!fs.existsSync(path.join(baseDir, uploadsPath, 'users'))) {
        fs.mkdirSync(path.join(baseDir, uploadsPath, 'users'), { recursive: false });
      }

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: false });
      }

      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: false });
      }
    } catch (dirError) {
      console.error("Erro ao criar diretórios:", dirError);
      return res.status(500).json({
        message: "Erro ao criar diretórios para o certificado",
        error: dirError.message
      });
    }

    // Salvar o arquivo com tratamento específico de erro
    try {
      // Salvar o arquivo
      const fileName = req.file.originalname;
      const filePath = path.join(certDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      console.log("Arquivo salvo com sucesso em:", filePath);

      res.json({
        message: "Certificado salvo com sucesso",
        path: `/uploads/users/${emailFormatado}/certificados/${fileName}`
      });
    } catch (fileError) {
      console.error("Erro ao salvar arquivo:", fileError);
      return res.status(500).json({
        message: "Erro ao salvar o arquivo do certificado",
        error: fileError.message
      });
    }
  } catch (error) {
    console.error("Erro geral ao salvar certificado:", error);
    res.status(500).json({
      message: "Erro ao salvar certificado",
      error: error.message
    });
  }
};

// Nova função para eliminar o ficheiro físico do certificado
const eliminarFicheiro = async (req, res) => {
  try {
    const { id_utilizador, nome_ficheiro } = req.body;

    // Validação de dados
    if (!id_utilizador || !nome_ficheiro) {
      return res.status(400).json({
        success: false,
        message: 'ID do utilizador e nome do ficheiro são obrigatórios'
      });
    }

    // Buscar dados do utilizador
    const utilizador = await User.findByPk(id_utilizador);
    if (!utilizador) {
      return res.status(404).json({
        success: false,
        message: "Utilizador não encontrado"
      });
    }

    // Formatar e-mail para uso em caminho de arquivo
    const emailFormatado = utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');

    // Caminho base para os certificados dos utilizadores
    const baseDir = process.cwd();
    const uploadsPath = process.env.CAMINHO_PASTA_UPLOADS || 'uploads';
    const userDir = path.join(baseDir, uploadsPath, 'users', emailFormatado);
    const certDir = path.join(userDir, 'certificados');
    const filePath = path.join(certDir, nome_ficheiro);

    console.log("Tentando eliminar o ficheiro:", filePath);

    // Verificar se o ficheiro existe
    if (fs.existsSync(filePath)) {
      // Eliminar o ficheiro
      fs.unlinkSync(filePath);
      console.log(`Certificado eliminado: ${filePath}`);

      return res.json({
        success: true,
        message: 'Ficheiro do certificado eliminado com sucesso'
      });
    } else {
      console.log(`Ficheiro não encontrado: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: 'Ficheiro do certificado não encontrado'
      });
    }
  } catch (error) {
    console.error('Erro ao eliminar ficheiro do certificado:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao eliminar ficheiro do certificado',
      error: error.message
    });
  }
};

// Nova função para criar diretório para certificados
const criarDiretorio = async (req, res) => {
  try {
    const { id_utilizador } = req.body;

    // Validação de dados
    if (!id_utilizador) {
      return res.status(400).json({
        success: false,
        message: 'ID do utilizador é obrigatório'
      });
    }

    // Buscar dados do utilizador
    const utilizador = await User.findByPk(id_utilizador);
    if (!utilizador) {
      return res.status(404).json({
        success: false,
        message: "Utilizador não encontrado"
      });
    }

    // Formatar e-mail para uso em caminho de arquivo
    const emailFormatado = utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');

    // Caminho base para os certificados dos utilizadores
    const baseDir = process.cwd();
    const uploadsPath = process.env.CAMINHO_PASTA_UPLOADS || 'uploads';
    const userDir = path.join(baseDir, uploadsPath, 'users', emailFormatado);
    const certDir = path.join(userDir, 'certificados');

    // Criar estrutura de diretórios com tratamento de erros
    try {
      if (!fs.existsSync(path.join(baseDir, uploadsPath))) {
        fs.mkdirSync(path.join(baseDir, uploadsPath), { recursive: true });
      }

      if (!fs.existsSync(path.join(baseDir, uploadsPath, 'users'))) {
        fs.mkdirSync(path.join(baseDir, uploadsPath, 'users'), { recursive: true });
      }

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      return res.json({
        success: true,
        message: 'Diretório para certificados criado com sucesso',
        path: certDir
      });
    } catch (dirError) {
      console.error("Erro ao criar diretórios:", dirError);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar diretórios para o certificado",
        error: dirError.message
      });
    }
  } catch (error) {
    console.error('Erro ao criar diretório para certificados:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar diretório para certificados',
      error: error.message
    });
  }
};

// Função para gerar certificado pelo ID do utilizador e curso
const registarCertificado = async (req, res) => {
  try {
    const { userId, cursoId } = req.body;

    // Verificar se o usuário e curso existem
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se existe inscrição
    const inscricao = await Inscricao_Curso.findOne({
      where: { id_utilizador: userId, id_curso: cursoId }
    });

    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // Registrar informação de certificado
    console.log("Registro de certificado para:", {
      userId: userId,
      cursoId: cursoId
    });

    return res.json({
      success: true,
      message: "Certificado registrado com sucesso"
    });
    
  } catch (error) {
    console.error("Erro ao registrar certificado:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao registrar certificado",
      error: error.message
    });
  }
};



const SalvarCertificado = async (req, res) => {
  try {
    const { id_utilizador, id_curso } = req.body;

    if (!req.file || !id_utilizador || !id_curso) {
      return res.status(400).json({
        success: false,
        message: "Dados insuficientes para salvar o certificado"
      });
    }

    // Buscar informações do utilizador e curso para logs e verificações
    const utilizador = await User.findByPk(id_utilizador);
    const curso = await Curso.findByPk(id_curso);

    if (!utilizador || !curso) {
      return res.status(404).json({
        success: false,
        message: "Utilizador ou curso não encontrado"
      });
    }

    // Formatar e-mail para uso em caminho de arquivo
    const emailFormatado = utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');

    // Preparar diretórios
    const baseDir = process.cwd();
    const uploadsPath = process.env.CAMINHO_PASTA_UPLOADS || 'uploads';
    const userDir = path.join(baseDir, uploadsPath, 'users', emailFormatado);
    const certDir = path.join(userDir, 'certificados');

    // Criar estrutura de diretórios se não existir
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    // Nome do arquivo baseado no nome do curso
    const cursoNomeFormatado = curso.nome.replace(/\s+/g, '_');
    const fileName = `certificado_${cursoNomeFormatado}.pdf`;
    const filePath = path.join(certDir, fileName);

    // Salvar o PDF enviado pelo frontend
    fs.writeFileSync(filePath, req.file.buffer);

    console.log(`Certificado salvo com sucesso em: ${filePath}`);

    return res.json({
      success: true,
      message: "Certificado salvo com sucesso",
      path: `/uploads/users/${emailFormatado}/certificados/${fileName}`
    });

  } catch (error) {
    console.error("Erro ao salvar certificado:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao salvar certificado",
      error: error.message
    });
  }
};



module.exports = {
  verificarHorasFormador,
  getCertificado,
  salvarCertificado,
  eliminarFicheiro,
  criarDiretorio,
  registarCertificado,
  SalvarCertificado
};