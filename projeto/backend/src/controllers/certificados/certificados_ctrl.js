// certificados_ctrl.js completo
const User = require("../../database/models/User");
const Curso = require("../../database/models/Curso");
const Avaliacao = require("../../database/models/Avaliacao");
const Inscricao_Curso = require("../../database/models/Inscricao_Curso");
const Trabalho = require("../../database/models/Trabalho_Entregue");
const { generateCertificate } = require("../../utils/certificateGenerator");

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Importação corrigida para jsPDF
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// Gerar certificado para um formando
const gerarCertificado = async (req, res) => {
  try {
    const { id_avaliacao } = req.params;

    const avaliacao = await Avaliacao.findByPk(id_avaliacao);
    if (!avaliacao) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }

    // Verificar se já tem certificado gerado
    if (avaliacao.certificado) {
      return res.json({
        message: "Certificado já existente",
        url: avaliacao.url_certificado
      });
    }

    // Procurar informações do formando e curso
    const inscricao = await Inscricao_Curso.findByPk(avaliacao.id_inscricao);
    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    const formando = await User.findByPk(inscricao.id_utilizador);
    const curso = await Curso.findByPk(inscricao.id_curso);

    if (!formando || !curso) {
      return res.status(404).json({ message: "Formando ou curso não encontrado" });
    }

    // Gerar o certificado
    const certificado = await generateCertificate(formando, curso, avaliacao);

    // Atualizar a avaliação com a informação do certificado
    await avaliacao.update({
      certificado: true,
      url_certificado: certificado.url
    });

    res.json({
      message: "Certificado gerado com sucesso",
      url: certificado.url
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    res.status(500).json({ message: "Erro ao gerar certificado" });
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
const registrarCertificado = async (req, res) => {
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

    // Registrar informação de certificado (se necessário)
    // Este é um registro simples que pode ser usado para controle

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
    const { userId, cursoId } = req.body;

    // 1. Verificar se o usuário e curso existem
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    const curso = await Curso.findByPk(cursoId);
    if (!curso) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // 2. Verificar se existe inscrição
    const inscricao = await Inscricao_Curso.findOne({
      where: { id_utilizador: userId, id_curso: cursoId }
    });

    if (!inscricao) {
      return res.status(404).json({ message: "Inscrição não encontrada" });
    }

    // 3. Calcular nota média dos trabalhos
    const trabalhos = await Trabalho.findAll({
      where: { id_utilizador: userId, id_curso: cursoId }
    });

    let notaFinal = 0;
    let trabalhosAvaliados = 0;

    trabalhos.forEach(trabalho => {
      if (trabalho.nota !== null && trabalho.nota !== undefined) {
        notaFinal += Number(trabalho.nota);
        trabalhosAvaliados++;
      }
    });

    if (trabalhosAvaliados > 0) {
      notaFinal = (notaFinal / trabalhosAvaliados).toFixed(2);
    }

    // 4. Gerar o PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Definir fonte e estilo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80);

    // Título do certificado
    doc.text('CERTIFICADO', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

    // Subtítulo
    doc.setFontSize(14);
    doc.text('de Conclusão de Curso', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

    // Linha decorativa
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.5);
    doc.line(40, 45, doc.internal.pageSize.getWidth() - 40, 45);

    // Texto principal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const startY = 70;
    doc.text(`Certificamos que`, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });

    // Nome do aluno
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${user.nome}`, doc.internal.pageSize.getWidth() / 2, startY + 10, { align: 'center' });

    // Texto de conclusão
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`concluiu com aproveitamento o curso:`, doc.internal.pageSize.getWidth() / 2, startY + 20, { align: 'center' });

    // Nome do curso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`${curso.nome}`, doc.internal.pageSize.getWidth() / 2, startY + 35, { align: 'center' });

    // Detalhes da formação
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Obter o nome da categoria e área (objeto ou string)
    let categoriaNome = 'N/A';
    let areaNome = 'N/A';
    
    if (curso.categoria) {
      categoriaNome = typeof curso.categoria === 'object' ? curso.categoria.nome : curso.categoria;
    }
    
    if (curso.area) {
      areaNome = typeof curso.area === 'object' ? curso.area.nome : curso.area;
    }
    
    doc.text(`Categoria: ${categoriaNome}`, doc.internal.pageSize.getWidth() / 2, startY + 50, { align: 'center' });
    doc.text(`Área: ${areaNome}`, doc.internal.pageSize.getWidth() / 2, startY + 60, { align: 'center' });
    
    // Adicionar duração do curso
    doc.text(`Duração: ${curso.duracao || 0} horas`, doc.internal.pageSize.getWidth() / 2, startY + 70, { align: 'center' });
    
    // Mover nota final para baixo
    doc.text(`Nota Final: ${notaFinal || 0}/20`, doc.internal.pageSize.getWidth() / 2, startY + 80, { align: 'center' });

    // 5. Salvar o certificado no servidor
    const emailFormatado = user.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const baseDir = process.cwd();
    const uploadsPath = process.env.CAMINHO_PASTA_UPLOADS || 'uploads';
    const userDir = path.join(baseDir, uploadsPath, 'users', emailFormatado);
    const certDir = path.join(userDir, 'certificados');

    // Garantir que o diretório existe
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    // Nome do arquivo baseado no nome do curso
    const cursoNomeFormatado = curso.nome.replace(/\s+/g, '_');
    const fileName = `certificado_${cursoNomeFormatado}.pdf`;
    const filePath = path.join(certDir, fileName);

    // Salvar o PDF no servidor
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);

    console.log(`Certificado salvo com sucesso em: ${filePath}`);
    console.log(`URL path: /uploads/users/${emailFormatado}/certificados/${fileName}`);

    return res.json({
      success: true,
      message: "Certificado gerado e salvo com sucesso",
      path: `/uploads/users/${emailFormatado}/certificados/${fileName}`
    });

  } catch (error) {
    console.error("Erro ao gerar e salvar certificado:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao gerar e salvar certificado",
      error: error.message
    });
  }
};





module.exports = {
  gerarCertificado,
  getCertificado,
  salvarCertificado,
  eliminarFicheiro,
  criarDiretorio,
  registrarCertificado,
  SalvarCertificado
};