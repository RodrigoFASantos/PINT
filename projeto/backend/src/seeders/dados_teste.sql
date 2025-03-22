-- Tabela de cargos
INSERT INTO cargos (id_cargo, descricao)
VALUES
  (1, 'Administrador'),
  (2, 'Formador'),
  (3, 'Formando')
ON CONFLICT (id_cargo) DO NOTHING;

-- Tabela de utilizadores
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login)
VALUES
  (1, 'Administrador', 35, 'admin@exemplo.com', '123456789', '123', 0),
  (2, 'Formador', 40, 'a@exemplo.com', '123456789', '123', 0),
  (3, 'Formando', 25, 'b@exemplo.com', '123456789', '123', 0)
ON CONFLICT (id_utilizador) DO NOTHING;


-- Tabela de categorias
INSERT INTO categorias (id_categoria, nome)
VALUES
  (1, 'Tecnologia'),
  (2, 'Soft Skills'),
  (3, 'Gestão')
ON CONFLICT (id_categoria) DO NOTHING;
