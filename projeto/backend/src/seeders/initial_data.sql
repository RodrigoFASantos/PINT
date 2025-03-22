-- Tabela de cargos
INSERT INTO cargos (id_cargo, descricao)
VALUES
  (1, 'Administrador'),
  (2, 'Formador'),
  (3, 'Formando');

-- Tabela de utilizadores
INSERT INTO utilizadores (id_utilizador, id_cargo, nome, email, password, primeiro_login)
VALUES
  (1, 1, 'Administrador', 'admin@exemplo.com', '123', 0),
  (2, 2, 'Formador', 'a@exemplo.com', '123', 0),
  (3, 3, 'Formando', 'b@exemplo.com', '123', 0);

-- Tabela de categorias
INSERT INTO categorias (id_categoria, nome)
VALUES
  (1, 'Tecnologia'),
  (2, 'Soft Skills'),
  (3, 'Gestão');

