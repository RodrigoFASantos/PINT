-- Tabela de cargos
INSERT INTO cargos (descricao)
VALUES
  ('Administrador'),
  ('Formador'),
  ('Formando')
ON CONFLICT (descricao) DO NOTHING;

-- Tabela de utilizadores
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login)
VALUES
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador'), 'Administrador', 35, 'admin@exemplo.com', '123456789', '123', 0),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador'), 'Formador', 40, 'a@exemplo.com', '123456789', '123', 0),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando'), 'Formando', 25, 'b@exemplo.com', '123456789', '123', 0)
ON CONFLICT (email) DO NOTHING;



-- Tabela de categorias
INSERT INTO categorias (nome)
VALUES
  ('Tecnologia'),
  ('Soft Skills'),
  ('Gestão')
ON CONFLICT (nome) DO NOTHING;
