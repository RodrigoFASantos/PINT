const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/db');

const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS);

async function criarPastasEImagensUsuarios() {
  try {
    console.log('Conectar à base de dados...');
    const conexaoOk = await sequelize.testConnection();
    if (!conexaoOk) {
      throw new Error('Não foi possível conectar à base de dados.');
    }

    console.log('Procurar utilizadores na base de dados...');
    const [usuarios] = await sequelize.query(
      'SELECT id_utilizador, nome, email, foto_perfil, foto_capa FROM user'
    );

    console.log(`Encontrados ${usuarios.length} utilizadores para processar.`);

    // Garantir que a pasta base de uploads/users exista
    const usersBaseDir = path.join(BASE_UPLOAD_DIR, 'users');
    if (!fs.existsSync(usersBaseDir)) {
      fs.mkdirSync(usersBaseDir, { recursive: true });
      console.log(`✅ Diretório base de utilizadores criado: ${usersBaseDir}`);
    }

    // Verificar se existem as imagens padrão
    const avatarPadrao = path.join(usersBaseDir, 'AVATAR.png');
    const capaPadrao = path.join(usersBaseDir, 'CAPA.png');

    if (!fs.existsSync(avatarPadrao)) {
      console.log('⚠️ Imagem padrão de avatar não encontrada. A criar placeholder...');
      try {
        // Você pode substituir isto por uma cópia de uma imagem real
        fs.writeFileSync(
          avatarPadrao,
          'Este é um placeholder para avatar. Substitua por uma imagem real!'
        );
        console.log(`✅ Arquivo placeholder de avatar criado em ${avatarPadrao}`);
      } catch (error) {
        console.error(`❌ Erro ao criar avatar padrão: ${error.message}`);
      }
    }

    if (!fs.existsSync(capaPadrao)) {
      console.log('⚠️ Imagem padrão de capa não encontrada. A criar placeholder...');
      try {
        // Você pode substituir isto por uma cópia de uma imagem real
        fs.writeFileSync(
          capaPadrao,
          'Este é um placeholder para capa. Substitua por uma imagem real.'
        );
        console.log(`✅ Arquivo placeholder de capa criado em ${capaPadrao}`);
      } catch (error) {
        console.error(`❌ Erro ao criar capa padrão: ${error.message}`);
      }
    }

    // Processar cada utilizador
    for (const usuario of usuarios) {
      console.log(`\nA processar utilizador: ${usuario.nome} (ID: ${usuario.id_utilizador})`);

      // Criar slug do utilizador baseado no email
      const userSlug = usuario.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const userDir = path.join(usersBaseDir, userSlug);

      console.log(`Diretório de utilizador: ${userDir}`);

      // Criar pasta do utilizador
      if (!fs.existsSync(userDir)) {
        try {
          fs.mkdirSync(userDir, { recursive: true });
          console.log(`✅ Diretório de utilizador criado com sucesso.`);
        } catch (error) {
          console.error(`❌ Erro ao criar diretório de utilizador: ${error.message}`);
          continue;
        }
      } else {
        console.log(`ℹ️ Diretório de utilizador já existe.`);
      }

      // Definir caminhos para as imagens
      const avatarFilename = `${usuario.email}_AVATAR.png`;
      const capaFilename = `${usuario.email}_CAPA.png`;

      const avatarPath = path.join(userDir, avatarFilename);
      const capaPath = path.join(userDir, capaFilename);

      // Verificar e criar imagem de perfil
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

      // Verificar e criar imagem de capa
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

      // Atualizar referências na base de dados se necessário
      const dbPathAvatar = `uploads/users/${userSlug}/${avatarFilename}`;
      const dbPathCapa = `uploads/users/${userSlug}/${capaFilename}`;

      // Verificar se precisa atualizar as referências no banco
      if (usuario.foto_perfil !== dbPathAvatar || usuario.foto_capa !== dbPathCapa) {
        try {
          await sequelize.query(
            'UPDATE user SET foto_perfil = ?, foto_capa = ? WHERE id_utilizador = ?',
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

    console.log('\n🎉 Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
  } finally {
    try {
      await sequelize.close();
      console.log('Conexão com a base de dados fechada.');
    } catch (error) {
      console.error('Erro ao fechar conexão com a base de dados:', error);
    }
  }
}

criarPastasEImagensUsuarios();