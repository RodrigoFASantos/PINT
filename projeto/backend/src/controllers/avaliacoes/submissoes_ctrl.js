const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { normalizarNome, ensureDir, moverArquivo, BASE_UPLOAD_DIR } = require('../../middleware/upload');
const Trabalho = require('../../database/models/Trabalho_Entregue');
const Curso = require('../../database/models/Curso');
const PastaCurso = require('../../database/models/PastaCurso');
const Inscricao = require('../../database/models/Inscricao_Curso');
const Utilizador = require('../../database/models/User');

/**
 * Processa a submissão de um trabalho por parte dum formando
 * 
 * Validações efectuadas:
 * - Verificar se o utilizador está inscrito no curso
 * - Validar existência da pasta de destino
 * - Impedir submissões duplicadas na mesma pasta
 * - Garantir estrutura adequada de directorias
 * 
 * O ficheiro é movido da pasta temporária para a estrutura:
 * uploads/cursos/{curso_slug}/avaliacao/{pasta_slug}/submissoes/{email_formatado}.ext
 * 
 * @param {Object} req - Pedido HTTP com dados do utilizador e ficheiro
 * @param {Object} res - Resposta HTTP a enviar
 */
submitSubmissao = async (req, res) => {
    try {
        const { id_pasta, id_curso } = req.body;
        const id_utilizador = req.user.id_utilizador;

        const cursoId = parseInt(id_curso);
        const userId = parseInt(id_utilizador);
        const pastaId = parseInt(id_pasta);

        // Verificar se o utilizador está inscrito no curso
        const inscricao = await Inscricao.findOne({
            where: {
                id_curso: cursoId,
                id_utilizador: userId
            }
        });
        if (!inscricao) {
            return res.status(403).json({ message: 'Não está inscrito neste curso' });
        }

        // Verificar se a pasta de destino existe
        const pasta = await PastaCurso.findByPk(pastaId);
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // Impedir múltiplas submissões do mesmo utilizador na mesma pasta
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

        // Obter dados do utilizador para formatar nome do ficheiro
        const utilizador = await Utilizador.findByPk(id_utilizador);
        if (!utilizador) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        const email = utilizador.email;

        // Construir estrutura de directorias baseada nos nomes do curso e pasta
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
        
        // Garantir que a directoria de destino existe
        ensureDir(destDir);

        // Processar nome do ficheiro submetido
        const { filename: tempName, originalname } = req.file;
        const ext = path.extname(originalname);
        const baseName = path.basename(originalname, ext);

        // Formatar email para uso como nome de ficheiro (substituir caracteres especiais)
        const emailFormatado = email.replace(/@/g, '_').replace(/\./g, '_');
        const finalName = `${normalizarNome(emailFormatado)}${ext}`;
        const destPath = path.join(destDir, finalName);
        
        // Mover ficheiro da pasta temporária para destino final
        moverArquivo(path.join(BASE_UPLOAD_DIR, 'temp', tempName), destPath);

        // Construir caminho relativo para armazenamento na base de dados
        const ficheiro_path = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/submissoes/${finalName}`;

        // Registar submissão na base de dados
        const trabalho = await Trabalho.create({
            id_utilizador,
            id_curso: cursoId,
            id_pasta: pastaId,
            ficheiro_path: ficheiro_path,
            nome_ficheiro: originalname,
            data_entrega: new Date()
        });

        res.status(201).json(trabalho);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao submeter avaliação' });
    }
};

/**
 * Remove uma submissão específica do utilizador autenticado
 * 
 * Validações de segurança:
 * - Verificar se a submissão pertence ao utilizador
 * - Validar se o prazo de entrega ainda não expirou
 * - Remover ficheiro do sistema de ficheiros
 * - Eliminar registo da base de dados
 * 
 * @param {Object} req - Pedido HTTP com ID da submissão nos parâmetros
 * @param {Object} res - Resposta HTTP a enviar
 */
removeSubmissao = async (req, res) => {
    try {
        const { id } = req.params;
        const id_utilizador = req.user.id_utilizador;

        // Buscar a submissão com dados da pasta associada
        const trabalho = await Trabalho.findByPk(id, {
            include: [
                {
                    model: PastaCurso,
                    as: 'pasta',
                    attributes: ['data_limite', 'nome']
                }
            ]
        });

        if (!trabalho) {
            return res.status(404).json({ message: 'Submissão não encontrada' });
        }

        // Verificar se a submissão pertence ao utilizador autenticado
        if (trabalho.id_utilizador !== id_utilizador) {
            return res.status(403).json({ message: 'Não tem permissão para remover esta submissão' });
        }

        // Verificar se o prazo de entrega ainda não expirou
        if (trabalho.pasta && trabalho.pasta.data_limite) {
            const agora = new Date();
            const dataLimite = new Date(trabalho.pasta.data_limite);
            
            if (agora > dataLimite) {
                return res.status(403).json({ 
                    message: 'Não é possível remover a submissão após o prazo de entrega' 
                });
            }
        }

        // Tentar remover o ficheiro do sistema de ficheiros
        if (trabalho.ficheiro_path) {
            const ficheiroCaminho = path.join(process.cwd(), trabalho.ficheiro_path);
            
            try {
                if (fs.existsSync(ficheiroCaminho)) {
                    fs.unlinkSync(ficheiroCaminho);
                }
            } catch (fileError) {
                // Se não conseguir remover o ficheiro, registar mas continuar
                console.warn(`Erro ao remover ficheiro ${ficheiroCaminho}:`, fileError.message);
            }
        }

        // Remover registo da base de dados
        await trabalho.destroy();

        res.status(200).json({ 
            message: 'Submissão removida com sucesso',
            id: trabalho.id
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover submissão' });
    }
};

/**
 * Obtém um trabalho específico pelo seu ID único
 * Inclui informações do utilizador que submeteu e comentários associados
 * 
 * @param {Object} req - Pedido HTTP com ID do trabalho nos parâmetros
 * @param {Object} res - Resposta HTTP com detalhes do trabalho
 */
getTrabalhoById = async (req, res) => {
    try {
        const id_trabalho = req.params.id;

        // Buscar trabalho com dados do utilizador associado
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

        // Obter comentários relacionados com o trabalho
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

        // Formatar resposta com trabalho e comentários
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
        res.status(500).json({ message: 'Erro ao obter detalhes do trabalho' });
    }
};

/**
 * Obtém todas as submissões de uma pasta específica pelo nome da pasta
 * 
 * @param {Object} req - Pedido HTTP com nome da pasta nos parâmetros
 * @param {Object} res - Resposta HTTP com lista de submissões
 */
getSubmissoesByPasta = async (req, res) => {
    try {
        const { pastaNome } = req.params;

        // Encontrar pasta pelo nome
        const pasta = await PastaCurso.findOne({ where: { nome: pastaNome } });
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // Buscar todas as submissões dessa pasta
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
        res.status(500).json({ message: 'Erro ao obter submissões por pasta' });
    }
};

/**
 * Obtém trabalhos filtrados por nome do curso e nome da pasta
 * Útil quando se conhece apenas os nomes e não os IDs
 * 
 * @param {Object} req - Pedido HTTP com nomes do curso e pasta nos parâmetros
 * @param {Object} res - Resposta HTTP com trabalhos filtrados
 */
getTrabalhosByPastaECurso = async (req, res) => {
    try {
        const { cursoNome, pastaNome } = req.params;

        // Encontrar curso pelo nome
        const curso = await Curso.findOne({ where: { nome: cursoNome } });
        if (!curso) {
            return res.status(404).json({ message: 'Curso não encontrado' });
        }

        // Encontrar pasta dentro desse curso específico
        const pasta = await PastaCurso.findOne({
            where: {
                nome: pastaNome,
                id_curso: curso.id_curso
            }
        });
        if (!pasta) {
            return res.status(404).json({ message: 'Pasta não encontrada' });
        }

        // Buscar submissões que correspondam a ambos os critérios
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
        res.status(500).json({ message: 'Erro ao obter trabalhos por pasta e curso' });
    }
};

/**
 * Obtém submissões com filtros flexíveis via query parameters
 * 
 * Filtros suportados:
 * - id_curso (obrigatório): ID do curso
 * - id_pasta (opcional): ID da pasta específica
 * - id_utilizador (opcional): ID do utilizador específico
 * 
 * @param {Object} req - Pedido HTTP com filtros na query string
 * @param {Object} res - Resposta HTTP com submissões filtradas
 */
getSubmissoes = async (req, res) => {
  try {
    const { id_curso, id_utilizador, id_pasta } = req.query;

    // Validar que o ID do curso é obrigatório
    if (!id_curso) {
      return res.status(400).json({ message: 'ID do curso é obrigatório' });
    }

    // Construir critérios de filtragem dinâmicos
    const whereClause = { 
      id_curso: parseInt(id_curso) 
    };

    // Adicionar filtro por pasta se especificado
    if (id_pasta) {
      whereClause.id_pasta = parseInt(id_pasta);
    }

    // Adicionar filtro por utilizador se especificado
    if (id_utilizador) {
      whereClause.id_utilizador = parseInt(id_utilizador);
    }

    // Buscar trabalhos com filtros aplicados
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

    res.status(200).json(trabalhos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter submissões', error: error.message });
  }
};

/**
 * Obtém trabalhos de uma pasta específica pelo ID da pasta
 * Usado principalmente pelo frontend para carregar submissões dinamicamente
 * 
 * @param {Object} req - Pedido HTTP com id_pasta na query string
 * @param {Object} res - Resposta HTTP com trabalhos da pasta
 */
getTrabalhosByPastaId = async (req, res) => {
    try {
        const id_pasta = req.query.id_pasta;

        // Validar que o ID da pasta foi fornecido
        if (!id_pasta) {
            return res.status(400).json({ message: 'ID da pasta não fornecido' });
        }

        const pastaId = parseInt(id_pasta);

        // Verificar se a pasta existe
        const pasta = await PastaCurso.findByPk(pastaId);
        if (!pasta) {
            return res.status(404).json({ message: `Pasta com ID ${pastaId} não encontrada` });
        }

        // Buscar trabalhos associados à pasta
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

        res.json(trabalhos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar trabalhos por ID da pasta' });
    }
};

module.exports = {
    getSubmissoesByPasta,
    submitSubmissao,
    removeSubmissao,
    getSubmissoes,
    getTrabalhoById,
    getTrabalhosByPastaECurso,
    getTrabalhosByPastaId
};