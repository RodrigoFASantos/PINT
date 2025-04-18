-- Tabela de cargos
INSERT INTO cargos (descricao)
VALUES
  ('Administrador'),
  ('Formador'),
  ('Formando');

-- Tabela de utilizadores
-- ERRO 1: faltando vírgula no final da linha anterior
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Administrador', 35, 'admin@exemplo.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Formador', 40, 'a@exemplo.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Formando', 25, 'b@exemplo.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'AVATAR.png', 'CAPA.png');

-- Separando a inserção do usuário ro em um comando separado
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Formador', 25, 'ro@exemplo.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'AVATAR.png', 'CAPA.png');

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

-- Tabela de cursos 
-- ERRO 2: Os nomes dos cursos devem existir no banco
INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria)
VALUES
  ('Curso de Vue.js', 'Curso prático sobre Vue.js para iniciantes.', 'sincrono', 20, '2025-04-01', '2025-04-30', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Desenvolvimento Web' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1));

-- Inserindo os cursos separadamente para evitar erros de referência nula
INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria)
VALUES
  ('Comunicação Assertiva', 'Melhore a sua comunicação no ambiente de trabalho.', 'assincrono', NULL, '2025-04-01', '2025-06-01', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Comunicação Interpessoal' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1));

INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria)
VALUES
  ('Gestão de Equipas Ágeis', 'Aprenda a liderar equipas com metodologias ágeis.', 'sincrono', 15, '2025-04-15', '2025-05-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Liderança e Gestão de Equipas' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1));

-- Tabela de conteúdos
-- ERRO 3: Verificando explicitamente se os cursos existem
INSERT INTO conteudos (id_curso, tipo, descricao, url_ou_ficheiro)
SELECT id_curso, 'link', 'Documentação oficial do Vue.js', 'https://vuejs.org'
FROM cursos 
WHERE nome = 'Curso de Vue.js';

INSERT INTO conteudos (id_curso, tipo, descricao, url_ou_ficheiro)
SELECT id_curso, 'video', 'Vídeo introdutório', 'https://youtube.com/exemplo-comunicacao'
FROM cursos 
WHERE nome = 'Comunicação Assertiva';

INSERT INTO conteudos (id_curso, tipo, descricao, url_ou_ficheiro)
SELECT id_curso, 'ficheiro', 'Manual do Scrum Master', '/ficheiros/scrum.pdf'
FROM cursos 
WHERE nome = 'Gestão de Equipas Ágeis';

-- Tabela de inscrições em cursos
-- ERRO 4: Verificando explicitamente se os utilizadores e cursos existem
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao)
SELECT u.id_utilizador, c.id_curso, NOW()
FROM utilizadores u, cursos c
WHERE u.nome = 'Formando' AND c.nome = 'Curso de Vue.js';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao)
SELECT u.id_utilizador, c.id_curso, NOW()
FROM utilizadores u, cursos c
WHERE u.nome = 'Formando' AND c.nome = 'Comunicação Assertiva';

-- Tabela de tópicos por categoria
INSERT INTO topicos_categorias (id_categoria, titulo, descricao, criado_por, data_criacao)
VALUES
  ((SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1), 'Como começar com React?', 'Discussão sobre primeiros passos com React.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW()),
  ((SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1), 'Empatia no ambiente de trabalho', 'Reflexões e estratégias para cultivar empatia.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW());

-- Inscrições adicionais
-- ERRO 5: Usando SELECT para garantir que as referências existam
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '2 DAY', 'inscrito',
   'Preocupado com a segurança das aplicações que desenvolvo.',
   'Quero aprender a identificar e corrigir vulnerabilidades comuns em aplicações web.'
FROM utilizadores u, cursos c
WHERE u.email = 'ro@exemplo.com' AND c.nome = 'Curso de Vue.js';



-- Criar inscrição original (para garantir que existe o ID)
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado)
VALUES (
  (SELECT id_utilizador FROM utilizadores WHERE email = 'b@exemplo.com' LIMIT 1),
  (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js' LIMIT 1),
  NOW() - INTERVAL '7 days',
  'inscrito'
);

-- Inserir inscrição cancelada com base na inscrição original recém-criada
INSERT INTO inscricoes_cursos_canceladas (
  id_inscricao_original, id_utilizador, id_curso, data_inscricao, data_cancelamento,
  estado, motivacao, expectativas, nota_final, certificado_gerado, horas_presenca, motivo_cancelamento
)
SELECT
  ic.id_inscricao,
  ic.id_utilizador,
  ic.id_curso,
  ic.data_inscricao,
  NOW(),
  'cancelado',
  'Motivo pessoal: indisponibilidade de horário.',
  'Esperava um curso mais técnico.',
  NULL,
  FALSE,
  3,
  'Cancelado devido a conflitos de agenda.'
FROM inscricoes_cursos ic
WHERE ic.id_utilizador = (SELECT id_utilizador FROM utilizadores WHERE email = 'b@exemplo.com' LIMIT 1)
  AND ic.id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js' LIMIT 1)
ORDER BY ic.id_inscricao DESC
LIMIT 1;