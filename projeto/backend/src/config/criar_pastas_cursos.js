const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/db');

/**
 * Diretório base para uploads, definido via variável de ambiente
 */
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

/**
 * Cria automaticamente a estrutura de pastas e ficheiros para todos os cursos
 * 
 * Este script:
 * 1. Procura todos os cursos na base de dados
 * 2. Cria diretórios para cada curso
 * 3. Gera tópicos padrão se não existirem
 * 4. Cria pastas e conteúdos dentro de cada tópico
 * 5. Atualiza os caminhos na base de dados
 */
async function criarPastasEImagens() {
  try {
    console.log('A ligar à base de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível ligar à base de dados.');
    }

    // Obter todos os cursos da base de dados
    console.log('A procurar cursos na base de dados...');
    const [cursos] = await sequelize.query(
      'SELECT id_curso, nome, imagem_path, dir_path FROM curso'
    );

    console.log(`Encontrados ${cursos.length} cursos para processar.`);

    // Processar cada curso individualmente
    for (const curso of cursos) {
      console.log(`\n==== A processar curso: ${curso.nome} (ID: ${curso.id_curso}) ====`);

      await processarCurso(curso);
    }

    console.log('\n🎉 Processo de criação de estrutura de cursos concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
    throw error;
  }
}

/**
 * Processa um curso específico, criando a sua estrutura de pastas
 * @param {Object} curso - Objeto do curso com id_curso, nome, imagem_path, dir_path
 */
async function processarCurso(curso) {
  // Normalizar nome do curso para uso em sistema de ficheiros
  const cursoSlug = curso.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  // Definir caminhos do curso
  let cursoDirPath = curso.dir_path || `uploads/cursos/${cursoSlug}`;
  let cursoImgPath = curso.imagem_path || `${cursoDirPath}/capa.png`;

  const fullCursoDirPath = path.join(process.cwd(), cursoDirPath);
  const fullCursoImgPath = path.join(process.cwd(), cursoImgPath);

  // Criar diretório principal do curso
  await criarDiretorioCurso(fullCursoDirPath, cursoDirPath, curso.id_curso);
  
  // Criar imagem de capa do curso
  await criarCapaCurso(fullCursoImgPath, cursoImgPath, curso);

  // Verificar e processar tópicos do curso
  await processarTopicosCurso(curso, cursoDirPath);
}

/**
 * Cria o diretório principal de um curso
 */
async function criarDiretorioCurso(fullPath, relativePath, cursoId) {
  if (!fs.existsSync(fullPath)) {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Diretório do curso criado: ${fullPath}`);

      await sequelize.query(
        'UPDATE curso SET dir_path = ? WHERE id_curso = ?',
        { replacements: [relativePath, cursoId] }
      );
    } catch (error) {
      console.error(`❌ Erro ao criar diretório do curso: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Cria ficheiro de capa para o curso
 */
async function criarCapaCurso(fullPath, relativePath, curso) {
  if (!fs.existsSync(fullPath)) {
    try {
      fs.writeFileSync(
        fullPath,
        `Este é um espaço reservado para a capa do curso: ${curso.nome}\nSubstitua este ficheiro por uma imagem real.`
      );
      console.log(`✅ Ficheiro espaço reservado de capa criado: ${fullPath}`);

      await sequelize.query(
        'UPDATE curso SET imagem_path = ? WHERE id_curso = ?',
        { replacements: [relativePath, curso.id_curso] }
      );
    } catch (error) {
      console.error(`❌ Erro ao criar imagem de capa: ${error.message}`);
    }
  }
}

/**
 * Processa todos os tópicos de um curso
 */
async function processarTopicosCurso(curso, cursoDirPath) {
  const [topicosExistentes] = await sequelize.query(
    'SELECT COUNT(*) as count FROM curso_topico WHERE id_curso = ?',
    { replacements: [curso.id_curso] }
  );

  if (topicosExistentes[0].count === 0) {
    await criarTopicosDefault(curso, cursoDirPath);
  } else {
    await processarTopicosExistentes(curso, cursoDirPath);
  }
}

/**
 * Cria tópicos padrão baseados no tipo de curso
 */
async function criarTopicosDefault(curso, cursoDirPath) {
  console.log(`⚠️ Nenhum tópico encontrado para o curso. A criar tópicos padrão...`);

  // Determinar tópicos baseados no nome/tipo do curso
  let topicosDefault = determinarTopicosDefault(curso.nome);

  // Criar cada tópico padrão
  for (const topico of topicosDefault) {
    await criarTopico(curso, topico, cursoDirPath);
  }
}

/**
 * Determina que tópicos criar baseado no nome do curso
 */
function determinarTopicosDefault(nomeCurso) {
  const nomeNormalizado = nomeCurso.toLowerCase();
  
  // Cursos de programação/tecnologia
  if (nomeNormalizado.includes('python') ||
      nomeNormalizado.includes('javascript') ||
      nomeNormalizado.includes('vue') ||
      nomeNormalizado.includes('react') ||
      nomeNormalizado.includes('web')) {
    
    return [
      { nome: 'Introdução', ordem: 1 },
      { nome: 'Fundamentos', ordem: 2 },
      { nome: 'Exercícios Práticos', ordem: 3 },
      { nome: 'Projeto Final', ordem: 4 }
    ];
  }
  
  // Cursos de comunicação/gestão
  else if (nomeNormalizado.includes('comunicação') ||
           nomeNormalizado.includes('soft skills') ||
           nomeNormalizado.includes('gestão')) {
    
    return [
      { nome: 'Conceitos Básicos', ordem: 1 },
      { nome: 'Técnicas Avançadas', ordem: 2 },
      { nome: 'Estudos de Caso', ordem: 3 },
      { nome: 'Avaliação', ordem: 4 }
    ];
  }
  
  // Tópicos genéricos para outros tipos de curso
  else {
    return [
      { nome: 'Introdução ao Tema', ordem: 1 },
      { nome: 'Desenvolvimento', ordem: 2 },
      { nome: 'Aplicações Práticas', ordem: 3 },
      { nome: 'Avaliação Final', ordem: 4 }
    ];
  }
}

/**
 * Cria um tópico específico com as suas pastas e conteúdo
 */
async function criarTopico(curso, topico, cursoDirPath) {
  const topicoSlug = topico.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const topicoDirPath = `${cursoDirPath}/${topicoSlug}`;
  const fullTopicoDirPath = path.join(process.cwd(), topicoDirPath);

  // Criar diretório do tópico
  if (!fs.existsSync(fullTopicoDirPath)) {
    fs.mkdirSync(fullTopicoDirPath, { recursive: true });
    console.log(`✅ Diretório de tópico criado: ${fullTopicoDirPath}`);
  }

  // Inserir tópico na base de dados
  const [result] = await sequelize.query(
    'INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path) VALUES (?, ?, ?, ?, ?) RETURNING id_topico',
    {
      replacements: [
        topico.nome,
        curso.id_curso,
        topico.ordem,
        true,
        topicoDirPath
      ]
    }
  );

  const idTopico = result[0].id_topico;
  console.log(`✅ Tópico inserido na base: ${topico.nome} (ID: ${idTopico})`);

  // Criar pastas padrão dentro do tópico
  await criarPastasTopico(idTopico, curso.id_curso, topicoDirPath, topico.nome);
}

/**
 * Cria as pastas padrão dentro de um tópico
 */
async function criarPastasTopico(idTopico, idCurso, topicoDirPath, nomeTopico) {
  const pastasDefault = [
    { nome: 'Material de Apoio', ordem: 1 },
    { nome: 'Exercícios', ordem: 2 }
  ];

  for (const pasta of pastasDefault) {
    const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const pastaDirPath = `${topicoDirPath}/${pastaSlug}`;
    const fullPastaDirPath = path.join(process.cwd(), pastaDirPath);

    // Criar diretório da pasta
    if (!fs.existsSync(fullPastaDirPath)) {
      fs.mkdirSync(fullPastaDirPath, { recursive: true });
      console.log(`✅ Diretório de pasta criado: ${fullPastaDirPath}`);
    }

    // Inserir pasta na base de dados
    const [pastaResult] = await sequelize.query(
      'INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path) VALUES (?, ?, ?, ?, ?) RETURNING id_pasta',
      {
        replacements: [
          pasta.nome,
          idTopico,
          pasta.ordem,
          true,
          pastaDirPath
        ]
      }
    );

    const idPasta = pastaResult[0].id_pasta;
    console.log(`✅ Pasta inserida na base: ${pasta.nome} (ID: ${idPasta})`);

    // Criar conteúdo específico para cada tipo de pasta
    await criarConteudoPasta(pasta, idPasta, idCurso, pastaDirPath, nomeTopico);
  }
}

/**
 * Cria conteúdo específico para cada tipo de pasta
 */
async function criarConteudoPasta(pasta, idPasta, idCurso, pastaDirPath, nomeTopico) {
  if (pasta.nome === 'Material de Apoio') {
    await criarMaterialApoio(idPasta, idCurso, pastaDirPath, nomeTopico);
  } else if (pasta.nome === 'Exercícios') {
    await criarExercicios(idPasta, idCurso, pastaDirPath, nomeTopico);
  }
}

/**
 * Cria material de apoio padrão
 */
async function criarMaterialApoio(idPasta, idCurso, pastaDirPath, nomeTopico) {
  // Criar ficheiro de referência
  const conteudoPath = `${pastaDirPath}/material-de-referencia.pdf`;
  const fullConteudoPath = path.join(process.cwd(), conteudoPath);

  if (!fs.existsSync(fullConteudoPath)) {
    fs.writeFileSync(
      fullConteudoPath,
      `Este é um espaço reservado para o material de referência do tópico ${nomeTopico}.\nSubstitua este ficheiro pelo conteúdo real.`
    );
  }

  // Inserir na base de dados
  await sequelize.query(
    'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    {
      replacements: [
        'Material de Referência',
        `Material de referência para o tópico ${nomeTopico}`,
        'file',
        conteudoPath,
        idPasta,
        idCurso,
        1,
        true
      ]
    }
  );

  // Adicionar link para recursos externos
  await sequelize.query(
    'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    {
      replacements: [
        'Recursos Online',
        'Ligações para recursos online relevantes',
        'link',
        'https://www.exemplo.com/recursos',
        idPasta,
        idCurso,
        2,
        true
      ]
    }
  );
}

/**
 * Cria exercícios padrão
 */
async function criarExercicios(idPasta, idCurso, pastaDirPath, nomeTopico) {
  const conteudoPath = `${pastaDirPath}/lista-exercicios.pdf`;
  const fullConteudoPath = path.join(process.cwd(), conteudoPath);

  if (!fs.existsSync(fullConteudoPath)) {
    fs.writeFileSync(
      fullConteudoPath,
      `Este é um espaço reservado para a lista de exercícios do tópico ${nomeTopico}.\nSubstitua este ficheiro pelo conteúdo real.`
    );
  }

  await sequelize.query(
    'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    {
      replacements: [
        'Lista de Exercícios',
        `Exercícios práticos para o tópico ${nomeTopico}`,
        'file',
        conteudoPath,
        idPasta,
        idCurso,
        1,
        true
      ]
    }
  );
}

/**
 * Processa tópicos que já existem na base de dados
 */
async function processarTopicosExistentes(curso, cursoDirPath) {
  const [topicos] = await sequelize.query(
    'SELECT id_topico, nome, arquivo_path FROM curso_topico WHERE id_curso = ?',
    { replacements: [curso.id_curso] }
  );

  console.log(`Encontrados ${topicos.length} tópicos existentes para o curso.`);

  for (const topico of topicos) {
    console.log(`\n-- A processar tópico existente: ${topico.nome} (ID: ${topico.id_topico})`);
    
    const topicoSlug = topico.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let topicoDirPath = topico.arquivo_path || `${cursoDirPath}/${topicoSlug}`;
    const fullTopicoDirPath = path.join(process.cwd(), topicoDirPath);

    // Garantir que o diretório existe
    if (!fs.existsSync(fullTopicoDirPath)) {
      fs.mkdirSync(fullTopicoDirPath, { recursive: true });
      
      await sequelize.query(
        'UPDATE curso_topico SET arquivo_path = ? WHERE id_topico = ?',
        { replacements: [topicoDirPath, topico.id_topico] }
      );
    }

    // Processar pastas do tópico
    await processarPastasTopico(topico.id_topico, curso.id_curso, topicoDirPath);
  }
}

/**
 * Processa as pastas de um tópico específico
 */
async function processarPastasTopico(idTopico, idCurso, topicoDirPath) {
  const [pastasExistentes] = await sequelize.query(
    'SELECT COUNT(*) as count FROM curso_topico_pasta WHERE id_topico = ?',
    { replacements: [idTopico] }
  );

  if (pastasExistentes[0].count === 0) {
    // Criar pastas padrão se não existirem
    await criarPastasTopico(idTopico, idCurso, topicoDirPath, 'Tópico Existente');
  } else {
    // Processar pastas existentes
    const [pastas] = await sequelize.query(
      'SELECT id_pasta, nome, arquivo_path FROM curso_topico_pasta WHERE id_topico = ?',
      { replacements: [idTopico] }
    );

    for (const pasta of pastas) {
      await processarPastaExistente(pasta, idCurso, topicoDirPath);
    }
  }
}

/**
 * Processa uma pasta que já existe
 */
async function processarPastaExistente(pasta, idCurso, topicoDirPath) {
  const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  let pastaDirPath = pasta.arquivo_path || `${topicoDirPath}/${pastaSlug}`;
  const fullPastaDirPath = path.join(process.cwd(), pastaDirPath);

  // Garantir que o diretório existe
  if (!fs.existsSync(fullPastaDirPath)) {
    fs.mkdirSync(fullPastaDirPath, { recursive: true });
    
    await sequelize.query(
      'UPDATE curso_topico_pasta SET arquivo_path = ? WHERE id_pasta = ?',
      { replacements: [pastaDirPath, pasta.id_pasta] }
    );
  }

  // Verificar se tem conteúdos
  const [conteudosExistentes] = await sequelize.query(
    'SELECT COUNT(*) as count FROM curso_topico_pasta_conteudo WHERE id_pasta = ?',
    { replacements: [pasta.id_pasta] }
  );

  if (conteudosExistentes[0].count === 0) {
    await criarConteudoDefault(pasta, idCurso, pastaDirPath);
  }
}

/**
 * Cria conteúdo padrão para uma pasta vazia
 */
async function criarConteudoDefault(pasta, idCurso, pastaDirPath) {
  const pastaSlug = pasta.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const conteudoPath = `${pastaDirPath}/documento-${pastaSlug}.pdf`;
  const fullConteudoPath = path.join(process.cwd(), conteudoPath);

  if (!fs.existsSync(fullConteudoPath)) {
    fs.writeFileSync(
      fullConteudoPath,
      `Este é um espaço reservado para um documento na pasta ${pasta.nome}.\nSubstitua este ficheiro pelo conteúdo real.`
    );
  }

  await sequelize.query(
    'INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    {
      replacements: [
        `Documento ${pasta.nome}`,
        `Documento para a pasta ${pasta.nome}`,
        'file',
        conteudoPath,
        pasta.id_pasta,
        idCurso,
        1,
        true
      ]
    }
  );
}

module.exports = { criarPastasEImagens };