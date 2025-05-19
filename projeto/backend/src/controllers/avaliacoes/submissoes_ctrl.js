
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

        // 2) Impedir múltiplas submissões (por utilizador + pasta)
        const existente = await Trabalho.findOne({
            where: {
                id_utilizador,
                id_curso,
                // procuramos no ficheiro_path se já havia submissão nesta pasta
                ficheiro_path: {
                    [Op.like]: `%/avaliacao/${normalizarNome((await PastaCurso.findByPk(id_pasta)).nome)}/submissoes/%`
                }
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

        // 3) Construir caminho físico
        const curso = await Curso.findByPk(id_curso);
        const pasta = await PastaCurso.findByPk(id_pasta);
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
        ensureDir(destDir);

        // 4) Mover ficheiro do temp para a pasta final
        const { filename: tempName, originalname } = req.file;
        const ext = path.extname(originalname);
        
        // MODIFICADO: Formatar o email substituindo @ por _ e . por _
        const emailFormatado = email.replace(/@/g, '_').replace(/\./g, '_');
        const finalName = `${emailFormatado}${ext}`;
        
        const destPath = path.join(destDir, finalName);
        moverArquivo(path.join(BASE_UPLOAD_DIR, 'temp', tempName), destPath);

        // 5) Caminho para armazenar no banco de dados (relativo)
        const ficheiro_path = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/submissoes/${finalName}`;

        // 6) Gravar no BD com informações completas
        const trabalho = await Trabalho.create({
            id_utilizador,
            id_curso: cursoId,
            id_pasta: parseInt(id_pasta),
            ficheiro_path: ficheiro_path,
            nome_ficheiro: originalname, // Mantém o nome original para referência
            data_entrega: new Date()
        });

        res.status(201).json(trabalho);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao submeter avaliação' });
    }
};

getTrabalhoById = async (req, res) => {
    try {
        const id_trabalho = req.params.id;

        const trabalho = await Trabalho.findByPk(id_trabalho, {
            include: [
                {
                    model: require('../../database/models/Utilizador'),
                    as: 'utilizador',
                    attributes: ['id_utilizador', 'nome', 'email']
                }
            ]
        });

        if (!trabalho) {
            return res.status(404).json({ message: 'Trabalho não encontrado' });
        }

        // Obter comentários relacionados ao trabalho
        const comentarios = await require('../../database/models/ComentarioTrabalho').findAll({
            where: { id_trabalho },
            include: [
                {
                    model: require('../../database/models/Utilizador'),
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

getTrabalhosByPastaECurso = async (req, res) => {
    try {
        const { cursoId, pastaId } = req.params;

        const trabalhos = await Trabalho.findAll({
            where: {
                id_curso: cursoId,
                id_pasta: pastaId
            },
            include: [
                {
                    model: require('../../database/models/Utilizador'),
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

getSubmissoesByPasta = async (req, res) => {
    try {
        const id_pasta = req.params.pastaId;

        // Melhorar a consulta utilizando id_pasta diretamente 
        const trabalhos = await Trabalho.findAll({
            where: { id_pasta },
            include: [
                {
                    model: require('../../database/models/Utilizador'),
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

getSubmissoes = async (req, res) => {
    try {
        const id_curso = req.query.id_curso;
        const trabalhos = await Trabalho.findAll({
            where: { id_curso }
        });
        res.json(trabalhos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao obter submissões' });
    }
};


module.exports = { getSubmissoesByPasta, submitSubmissao, getSubmissoes, getTrabalhoById, getTrabalhosByPastaECurso };
