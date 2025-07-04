const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/db');

/**
 * Diretório base para uploads, configurado via variável de ambiente
 */
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

/**
 * Cria automaticamente as pastas e imagens para todos os utilizadores
 * 
 * Este script:
 * 1. Procura todos os utilizadores na base de dados
 * 2. Cria um diretório individual para cada utilizador
 * 3. Gera imagens padrão de avatar e capa
 * 4. Atualiza as referências na base de dados
 */
async function criarPastasEImagensUsuarios() {
  try {
    console.log('Conectar à base de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar à base de dados.');
    }

    console.log('Procurar utilizadores na base de dados...');
    const [usuarios] = await sequelize.query(
      'SELECT id_utilizador, nome, email, foto_perfil, foto_capa FROM utilizadores'
    );

    console.log(`Encontrados ${usuarios.length} utilizadores para processar.`);

    // Preparar estrutura base
    const usersBaseDir = path.join(BASE_UPLOAD_DIR, 'users');
    await prepararEstrututraBase(usersBaseDir);

    // Processar cada utilizador individualmente
    for (const usuario of usuarios) {
      console.log(`\nA processar utilizador: ${usuario.nome} (ID: ${usuario.id_utilizador})`);
      await processarUtilizador(usuario, usersBaseDir);
    }

    console.log('\n🎉 Processo concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
    throw error;
  }
}

/**
 * Prepara a estrutura base de diretórios e ficheiros padrão
 * @param {string} usersBaseDir - Diretório base para utilizadores
 */
async function prepararEstrututraBase(usersBaseDir) {
  // Garantir que existe o diretório base
  if (!fs.existsSync(usersBaseDir)) {
    fs.mkdirSync(usersBaseDir, { recursive: true });
    console.log(`✅ Diretório base de utilizadores criado: ${usersBaseDir}`);
  }

  // Criar ficheiros padrão se não existirem
  await criarFicheirosDefault(usersBaseDir);
}

/**
 * Cria os ficheiros padrão de avatar e capa
 * @param {string} usersBaseDir - Diretório base dos utilizadores
 */
async function criarFicheirosDefault(usersBaseDir) {
  const avatarPadrao = path.join(usersBaseDir, 'AVATAR.png');
  const capaPadrao = path.join(usersBaseDir, 'CAPA.png');

  // Criar avatar padrão se não existir
  if (!fs.existsSync(avatarPadrao)) {
    console.log('⚠️ Imagem padrão de avatar não encontrada. A criar placeholder...');
    try {
      fs.writeFileSync(
        avatarPadrao,
        'Este é um placeholder para avatar. Substitua por uma imagem real!'
      );
      console.log(`✅ Arquivo placeholder de avatar criado em ${avatarPadrao}`);
    } catch (error) {
      console.error(`❌ Erro ao criar avatar padrão: ${error.message}`);
    }
  }

  // Criar capa padrão se não existir
  if (!fs.existsSync(capaPadrao)) {
    console.log('⚠️ Imagem padrão de capa não encontrada. A criar placeholder...');
    try {
      fs.writeFileSync(
        capaPadrao,
        'Este é um placeholder para capa. Substitua por uma imagem real.'
      );
      console.log(`✅ Arquivo placeholder de capa criado em ${capaPadrao}`);
    } catch (error) {
      console.error(`❌ Erro ao criar capa padrão: ${error.message}`);
    }
  }
}

/**
 * Processa um utilizador específico, criando a sua estrutura de ficheiros
 * @param {Object} usuario - Dados do utilizador da base de dados
 * @param {string} usersBaseDir - Diretório base dos utilizadores
 */
async function processarUtilizador(usuario, usersBaseDir) {
  // Criar slug único baseado no email do utilizador
  const userSlug = usuario.email.replace(/@/g, '_at_').replace(/\./g, '_');
  const userDir = path.join(usersBaseDir, userSlug);

  console.log(`Diretório de utilizador: ${userDir}`);

  // Criar pasta individual do utilizador
  await criarPastaUtilizador(userDir);

  // Definir nomes de ficheiros únicos
  const avatarFilename = `${usuario.email}_AVATAR.png`;
  const capaFilename = `${usuario.email}_CAPA.png`;

  const avatarPath = path.join(userDir, avatarFilename);
  const capaPath = path.join(userDir, capaFilename);

  // Criar ficheiros de imagem do utilizador
  await criarImagensUtilizador(avatarPath, capaPath, usersBaseDir);

  // Atualizar referências na base de dados
  await atualizarReferenciasBaseDados(usuario, userSlug, avatarFilename, capaFilename);
}

/**
 * Cria o diretório individual de um utilizador
 * @param {string} userDir - Caminho completo do diretório do utilizador
 */
async function criarPastaUtilizador(userDir) {
  if (!fs.existsSync(userDir)) {
    try {
      fs.mkdirSync(userDir, { recursive: true });
      console.log(`✅ Diretório de utilizador criado com sucesso.`);
    } catch (error) {
      console.error(`❌ Erro ao criar diretório de utilizador: ${error.message}`);
      throw error;
    }
  } else {
    console.log(`ℹ️ Diretório de utilizador já existe.`);
  }
}

/**
 * Cria as imagens de avatar e capa para um utilizador
 * @param {string} avatarPath - Caminho completo para o avatar
 * @param {string} capaPath - Caminho completo para a capa
 * @param {string} usersBaseDir - Diretório base com ficheiros padrão
 */
async function criarImagensUtilizador(avatarPath, capaPath, usersBaseDir) {
  const avatarPadrao = path.join(usersBaseDir, 'AVATAR.png');
  const capaPadrao = path.join(usersBaseDir, 'CAPA.png');

  // Criar imagem de perfil (avatar)
  if (!fs.existsSync(avatarPath)) {
    try {
      fs.copyFileSync(avatarPadrao, avatarPath);
      console.log(`✅ Imagem de perfil (avatar) criada: ${avatarPath}`);
    } catch (error) {
      console.error(`❌ Erro ao criar imagem de perfil: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Imagem de perfil já existe.`);
  }

  // Criar imagem de capa
  if (!fs.existsSync(capaPath)) {
    try {
      fs.copyFileSync(capaPadrao, capaPath);
      console.log(`✅ Imagem de capa criada: ${capaPath}`);
    } catch (error) {
      console.error(`❌ Erro ao criar imagem de capa: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Imagem de capa já existe.`);
  }
}

/**
 * Atualiza as referências de imagens na base de dados
 * @param {Object} usuario - Dados do utilizador
 * @param {string} userSlug - Slug único do utilizador
 * @param {string} avatarFilename - Nome do ficheiro de avatar
 * @param {string} capaFilename - Nome do ficheiro de capa
 */
async function atualizarReferenciasBaseDados(usuario, userSlug, avatarFilename, capaFilename) {
  const dbPathAvatar = `uploads/users/${userSlug}/${avatarFilename}`;
  const dbPathCapa = `uploads/users/${userSlug}/${capaFilename}`;

  // Verificar se é necessário atualizar
  if (usuario.foto_perfil !== dbPathAvatar || usuario.foto_capa !== dbPathCapa) {
    try {
      await sequelize.query(
        'UPDATE utilizadores SET foto_perfil = ?, foto_capa = ? WHERE id_utilizador = ?',
        {
          replacements: [dbPathAvatar, dbPathCapa, usuario.id_utilizador]
        }
      );
      console.log(`✅ Referências de imagens atualizadas na base de dados.`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar base de dados: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Referências de imagens já estão corretas no base de dados.`);
  }
}

module.exports = { criarPastasEImagensUsuarios };