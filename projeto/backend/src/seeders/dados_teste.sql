-- Tabela de cargos
INSERT INTO cargos (descricao)
VALUES
  ('Administrador'),
  ('Formador'),
  ('Formando');

-- Tabela de utilizadores
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Administrador', 35, 'admin@exemplo.com', '123456789', '12345678', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Formador', 40, 'a@exemplo.com', '123456789', '12345678', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Formando', 25, 'b@exemplo.com', '123456789', '12345678', 0, 'AVATAR.png', 'CAPA.png');

-- Tabela de categorias
INSERT INTO categorias (nome)
VALUES
  ('Tecnologia'),
  ('Soft Skills'),
  ('Gestão');

-- Tabela de áreas
INSERT INTO areas (nome, id_categoria)
VALUES
  ('Desenvolvimento Web', (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1)),
  ('Comunicação Interpessoal', (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1)),
  ('Liderança e Gestão de Equipas', (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1));

-- Tabela de cursos (atualizada para incluir id_categoria)
INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria)
VALUES
  ('Curso de Vue.js', 'Curso prático sobre Vue.js para iniciantes.', 'sincrono', 20, '2025-04-01', '2025-04-30', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Desenvolvimento Web' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1)),

  ('Comunicação Assertiva', 'Melhore a sua comunicação no ambiente de trabalho.', 'assincrono', NULL, '2025-04-01', '2025-06-01', 'planeado', true,
   NULL,
   (SELECT id_area FROM areas WHERE nome = 'Comunicação Interpessoal' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1)),

  ('Gestão de Equipas Ágeis', 'Aprenda a liderar equipas com metodologias ágeis.', 'sincrono', 15, '2025-04-15', '2025-05-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Liderança e Gestão de Equipas' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1));

-- Tabela de conteúdos
INSERT INTO conteudos (id_curso, tipo, descricao, url_ou_ficheiro)
VALUES
  ((SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js' LIMIT 1), 'link', 'Documentação oficial do Vue.js', 'https://vuejs.org'),
  ((SELECT id_curso FROM cursos WHERE nome = 'Comunicação Assertiva' LIMIT 1), 'video', 'Vídeo introdutório', 'https://youtube.com/exemplo-comunicacao'),
  ((SELECT id_curso FROM cursos WHERE nome = 'Gestão de Equipas Ágeis' LIMIT 1), 'ficheiro', 'Manual do Scrum Master', '/ficheiros/scrum.pdf');

-- Tabela de inscrições em cursos
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao)
VALUES
  ((SELECT id_utilizador FROM utilizadores WHERE nome = 'Formando' LIMIT 1), (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js' LIMIT 1), NOW()),
  ((SELECT id_utilizador FROM utilizadores WHERE nome = 'Formando' LIMIT 1), (SELECT id_curso FROM cursos WHERE nome = 'Comunicação Assertiva' LIMIT 1), NOW());

-- Tabela de tópicos por categoria
INSERT INTO topicos_categorias (id_categoria, titulo, descricao, criado_por, data_criacao)
VALUES
  ((SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1), 'Como começar com React?', 'Discussão sobre primeiros passos com React.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW()),
  ((SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1), 'Empatia no ambiente de trabalho', 'Reflexões e estratégias para cultivar empatia.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW());