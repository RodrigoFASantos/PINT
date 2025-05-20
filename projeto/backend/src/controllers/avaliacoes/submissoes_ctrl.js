const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { normalizarNome, ensureDir, moverArquivo, BASE_UPLOAD_DIR } = require('../../middleware/upload');
const Trabalho = require('../../database/models/Trabalho_Entregue');
const Curso = require('../../database/models/Curso');
const PastaCurso = require('../../database/models/PastaCurso');
const Inscricao = require('../../database/models/Inscricao_Curso');
const Utilizador = require('../../database/models/User');

submitSubmissao = async (req, res) => {
    try {
        const { id_pasta, id_curso } = req.body;
        const id_utilizador = req.user.id_utilizador;

        const cursoId = parseInt(id_curso);
        const userId = parseInt(id_utilizador);
        const pastaId = parseInt(id_pasta);

        // 1) Verificar inscrição
        const inscricao = await Inscricao.findOne({
            where: {
                id_curso: cursoId,
                id_utilizador: userId
            }
        });
        if (!inscricao) {
            return res.status(403).json({ message: 'Não está inscrito neste curso' });
        }

        // 2) Verificar se a pasta existe
        const pasta = await PastaCurso.findByPk(pastaId);
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // 3) Impedir múltiplas submissões (por utilizador + pasta)
        const existente = await Trabalho.findOne({
            where: {
                id_utilizador,
                id_curso: cursoId,
                id_pasta: pastaId
            }
        });
        if (existente) {
            return res.status(409).json({ message: 'Já submeteu esta avaliação' });
        }

        const utilizador = await Utilizador.findByPk(id_utilizador);
        if (!utilizador) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        const email = utilizador.email;

        // 4) Construir caminho físico
        const curso = await Curso.findByPk(id_curso);
        const cursoSlug = normalizarNome(curso.nome);
        const pastaSlug = normalizarNome(pasta.nome);

        const destDir = path.join(
            BASE_UPLOAD_DIR,
            'cursos',
            cursoSlug,
            'avaliacao',
            pastaSlug,
            'submissoes'
        );
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        console.log(`Diretório de destino: ${destDir}`);
        ensureDir(destDir);

        // 5) Mover ficheiro do temp para a pasta final
        const { filename: tempName, originalname } = req.file;
        const ext = path.extname(originalname);
        const baseName = path.basename(originalname, ext);

        // Formatar o email substituindo @ por _ e . por _
        const emailFormatado = email.replace(/@/g, '_').replace(/\./g, '_');
        const finalName = `${normalizarNome(emailFormatado)}_${normalizarNome(baseName)}${ext}`;
        const destPath = path.join(destDir, finalName);
        moverArquivo(path.join(BASE_UPLOAD_DIR, 'temp', tempName), destPath);

        // 6) Caminho para armazenar no banco de dados (relativo)
        const ficheiro_path = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/${finalName}`;

        // 7) Gravar no BD com informações completas
        const trabalho = await Trabalho.create({
            id_utilizador,
            id_curso: cursoId,
            id_pasta: pastaId,
            ficheiro_path: ficheiro_path,
            nome_ficheiro: originalname, // Mantém o nome original para referência
            data_entrega: new Date()
        });

        res.status(201).json(trabalho);
    } catch (error) {
        console.error('Erro ao submeter avaliação:', error);
        res.status(500).json({ message: 'Erro ao submeter avaliação' });
    }
};

getTrabalhoById = async (req, res) => {
    try {
        const id_trabalho = req.params.id;

        const trabalho = await Trabalho.findByPk(id_trabalho, {
            include: [
                {
                    model: require('../../database/models/User'),
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome', 'email']
                }
            ]
        });

        if (!trabalho) {
            return res.status(404).json({ message: 'Trabalho não encontrado' });
        }

        // Obter comentários relacionados ao trabalho
        const ComentarioTrabalho = require('../../database/models/ComentarioTrabalho');
        const comentarios = await ComentarioTrabalho.findAll({
            where: { id_trabalho },
            include: [
                {
                    model: require('../../database/models/User'),
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome']
                }
            ],
            order: [['data_comentario', 'DESC']]
        });

        // Formatar resposta
        const response = {
            ...trabalho.get({ plain: true }),
            comentarios: comentarios.map(c => ({
                id: c.id,
                texto: c.texto,
                data_comentario: c.data_comentario,
                nome_utilizador: c.utilizador?.nome || 'Utilizador'
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Erro ao obter trabalho:', error);
        res.status(500).json({ message: 'Erro ao obter detalhes do trabalho' });
    }
};

getSubmissoesByPasta = async (req, res) => {
    try {
        const { pastaNome } = req.params;

        // 1) Encontrar a pasta pelo nome
        const pasta = await PastaCurso.findOne({ where: { nome: pastaNome } });
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // 2) Buscar todas as submissões dessa pasta
        const trabalhos = await Trabalho.findAll({
            where: { id_pasta: pasta.id_pasta },
            include: [
                {
                    model: require('../../database/models/User'),
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome', 'email']
                }
            ],
            order: [['data_entrega', 'DESC']]
        });

        res.json(trabalhos);
    } catch (error) {
        console.error('Erro ao obter submissões por pasta:', error);
        res.status(500).json({ message: 'Erro ao obter submissões por pasta' });
    }
};

getTrabalhosByPastaECurso = async (req, res) => {
    try {
        const { cursoNome, pastaNome } = req.params;

        // 1) Encontrar o curso pelo nome
        const curso = await Curso.findOne({ where: { nome: cursoNome } });
        if (!curso) {
            return res.status(404).json({ message: 'Curso não encontrado' });
        }

        // 2) Encontrar a pasta dentro desse curso
        const pasta = await PastaCurso.findOne({
            where: {
                nome: pastaNome,
                id_curso: curso.id_curso
            }
        });
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // 3) Buscar submissões que casem ambos
        const trabalhos = await Trabalho.findAll({
            where: {
                id_curso: curso.id_curso,
                id_pasta: pasta.id_pasta
            },
            include: [
                {
                    model: require('../../database/models/User'),
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome', 'email']
                }
            ],
            order: [['data_entrega', 'DESC']]
        });

        res.json(trabalhos);
    } catch (error) {
        console.error('Erro ao obter trabalhos:', error);
        res.status(500).json({ message: 'Erro ao obter trabalhos por pasta e curso' });
    }
};

getSubmissoes = async (req, res) => {
  try {
    // Verificar se o id_curso está presente
    const { id_curso, id_utilizador, id_pasta } = req.query;

    if (!id_curso) {
      return res.status(400).json({ message: 'ID do curso é obrigatório' });
    }

    // Construir o where com filtros condicionais
    const whereClause = { 
      id_curso: parseInt(id_curso) 
    };

    // Adicionar id_pasta se fornecido
    if (id_pasta) {
      whereClause.id_pasta = parseInt(id_pasta);
    }

    // Adicionar id_utilizador se fornecido
    if (id_utilizador) {
      whereClause.id_utilizador = parseInt(id_utilizador);
    }

    console.log('Filtros de submissão:', whereClause);

    // Buscar os trabalhos com os filtros aplicados
    const trabalhos = await Trabalho.findAll({
      where: whereClause,
      include: [
        {
          model: require('../../database/models/User'),
          as: 'utilizador',
          attributes: ['id_utilizador', 'nome', 'email']
        }
      ],
      order: [['data_entrega', 'DESC']]
    });

    console.log(`Encontrados ${trabalhos.length} trabalhos com os filtros aplicados`);

    // Enviar resposta
    res.status(200).json(trabalhos);
  } catch (error) {
    console.error('Erro ao obter submissões:', error);
    res.status(500).json({ message: 'Erro ao obter submissões', error: error.message });
  }
};


getTrabalhosByPastaId = async (req, res) => {
    try {
        // Extrair o id_pasta da query string
        const id_pasta = req.query.id_pasta;

        console.log('Recebida requisição para id_pasta:', id_pasta);

        if (!id_pasta) {
            return res.status(400).json({ message: 'ID da pasta não fornecido' });
        }

        // Converter para número
        const pastaId = parseInt(id_pasta);

        // Verificar se a pasta existe
        const pasta = await PastaCurso.findByPk(pastaId);
        if (!pasta) {
            return res.status(404).json({ message: `Pasta com ID ${pastaId} não encontrada` });
        }

        console.log(`Buscando trabalhos para pasta: ${pasta.nome} (ID: ${pastaId})`);

        // Buscar trabalhos com essa pasta
        const trabalhos = await Trabalho.findAll({
            where: { id_pasta: pastaId },
            include: [
                {
                    model: Utilizador,
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome', 'email']
                }
            ],
            order: [['data_entrega', 'DESC']]
        });

        console.log(`Encontrados ${trabalhos.length} trabalhos para a pasta ID ${pastaId}`);

        res.json(trabalhos);
    } catch (error) {
        console.error('Erro ao buscar trabalhos por ID da pasta:', error);
        res.status(500).json({ message: 'Erro ao buscar trabalhos por ID da pasta' });
    }
};

module.exports = {
    getSubmissoesByPasta,
    submitSubmissao,
    getSubmissoes,
    getTrabalhoById,
    getTrabalhosByPastaECurso,
    getTrabalhosByPastaId
};