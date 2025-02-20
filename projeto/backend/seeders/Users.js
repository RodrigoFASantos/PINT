const pool = require('../src/config/database');

const seedUsers = async () => {
  try {
    console.log("Inserindo utilizadores na base de dados...");

    // Limpar a tabela antes de inserir novos dados (opcional)
    await pool.query('DELETE FROM utilizadores');

    // Inserir utilizadores
    await pool.query(`
      INSERT INTO utilizadores (nome, email, senha) VALUES
      ('Rafael', 'rafael@email.com', 'senha123'),
      ('Rodrigo', 'rodrigo@email.com', 'senha456'),
      ('João', 'joao@email.com', 'senha789'),
      ('Alexandre', 'alexandre@email.com', 'senhaabc'),
      ('Mariana', 'mariana@email.com', 'senhadef');
    `);

    console.log("Utilizadores inseridos com sucesso!");
  } catch (err) {
    console.error("Erro ao inserir utilizadores:", err);
  } finally {
    pool.end(); // Fechar conexão após executar o seeder
  }
};

// Executar o seeder
seedUsers();
