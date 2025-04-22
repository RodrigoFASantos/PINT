-- Tabela de cargos
INSERT INTO cargos (descricao)
VALUES
  ('Administrador'),
  ('Formador'),
  ('Formando');

-- Tabela de utilizadores
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Administrador', 35, 'admin@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Formador', 40, 'a@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Formando', 25, 'b@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Formador Rareura', 25, 'fe@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/fe@gmail.com_AVATAR.png', 'uploads/users/fe@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Formador Rodrigo', 25, 'ro@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/ro@gmail.com_AVATAR.png', 'uploads/users/ro@gmail.com_CAPA.png');
  

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
INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria, imagem_path)
VALUES
  ('Curso de Vue.js', 'Curso prático sobre Vue.js para iniciantes.', 'sincrono', 20, '2025-04-01', '2025-04-30', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Desenvolvimento Web' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1),
   'uploads/cursos/curso-de-vuejs.png');

-- Inserindo os cursos separadamente para evitar erros de referência nula
INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria, imagem_path)
VALUES
  ('Comunicação Assertiva', 'Melhore a sua comunicação no ambiente de trabalho.', 'assincrono', NULL, '2025-04-01', '2025-06-01', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Comunicação Interpessoal' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1),
   'uploads/cursos/comunicao-assertiva.png');

INSERT INTO cursos (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria, imagem_path)
VALUES
  ('Gestão de Equipas Ágeis', 'Aprenda a liderar equipas com metodologias ágeis.', 'sincrono', 15, '2025-04-15', '2025-05-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Liderança e Gestão de Equipas' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1),
   'uploads/cursos/gesto-de-equipas-geis.png');

-- Tabela de inscrições em cursos
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW(), 'inscrito', NULL, NULL
FROM utilizadores u, cursos c
WHERE u.nome = 'Formando' AND c.nome = 'Curso de Vue.js';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW(), 'inscrito', NULL, NULL
FROM utilizadores u, cursos c
WHERE u.nome = 'Formando' AND c.nome = 'Comunicação Assertiva';

-- Tabela de tópicos por categoria
INSERT INTO topicos_categorias (id_categoria, titulo, descricao, criado_por, data_criacao)
VALUES
  ((SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1), 'Como começar com React?', 'Discussão sobre primeiros passos com React.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW()),
  ((SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1), 'Empatia no ambiente de trabalho', 'Reflexões e estratégias para cultivar empatia.', (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), NOW());

-- Inscrições adicionais
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '2 DAY', 'inscrito',
   'Preocupado com a segurança das aplicações que desenvolvo.',
   'Quero aprender a identificar e corrigir vulnerabilidades comuns em aplicações web.'
FROM utilizadores u, cursos c
WHERE u.email = 'ro@gmail.com' AND c.nome = 'Curso de Vue.js';

-- Criar inscrição original (para garantir que existe o ID)
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado)
VALUES (
  (SELECT id_utilizador FROM utilizadores WHERE email = 'b@gmail.com' LIMIT 1),
  (SELECT id_curso FROM cursos WHERE nome = 'Gestão de Equipas Ágeis' LIMIT 1),
  NOW() - INTERVAL '7 days',
  'inscrito'
);

-- Inserir inscrição cancelada com base na inscrição original recém-criada
INSERT INTO inscricao_curso_cancelada (
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
WHERE ic.id_utilizador = (SELECT id_utilizador FROM utilizadores WHERE email = 'b@gmail.com' LIMIT 1)
  AND ic.id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Gestão de Equipas Ágeis' LIMIT 1)
ORDER BY ic.id_inscricao DESC
LIMIT 1;

-- Inserir tópicos para o curso de Vue.js
INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Introdução', id_curso, 1, true
FROM cursos 
WHERE nome = 'Curso de Vue.js';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Fundamentos', id_curso, 2, true
FROM cursos 
WHERE nome = 'Curso de Vue.js';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Componentes', id_curso, 3, true
FROM cursos 
WHERE nome = 'Curso de Vue.js';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Avaliação', id_curso, 4, true
FROM cursos 
WHERE nome = 'Curso de Vue.js';

-- Inserir tópicos para o curso de Comunicação Assertiva
INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Fundamentos da Comunicação', id_curso, 1, true
FROM cursos 
WHERE nome = 'Comunicação Assertiva';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Técnicas de Assertividade', id_curso, 2, true
FROM cursos 
WHERE nome = 'Comunicação Assertiva';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Prática e Exercícios', id_curso, 3, true
FROM cursos 
WHERE nome = 'Comunicação Assertiva';

-- Inserir tópicos para o curso de Gestão de Equipas Ágeis
INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Introdução às Metodologias Ágeis', id_curso, 1, true
FROM cursos 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Scrum', id_curso, 2, true
FROM cursos 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Kanban', id_curso, 3, true
FROM cursos 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO topicos_curso (nome, id_curso, ordem, ativo)
SELECT 'Liderança Ágil', id_curso, 4, true
FROM cursos 
WHERE nome = 'Gestão de Equipas Ágeis';

-- Inserir pastas para o tópico 'Introdução' do curso Vue.js
INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Instalação', id_topico, 1, true
FROM topicos_curso
WHERE nome = 'Introdução' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Primeiros Passos', id_topico, 2, true
FROM topicos_curso
WHERE nome = 'Introdução' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

-- Inserir pastas para o tópico 'Fundamentos' do curso Vue.js
INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Sintaxe Básica', id_topico, 1, true
FROM topicos_curso
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Data Binding', id_topico, 2, true
FROM topicos_curso
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Ciclo de Vida', id_topico, 3, true
FROM topicos_curso
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

-- Inserir pastas para o tópico 'Componentes' do curso Vue.js
INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Componentes Básicos', id_topico, 1, true
FROM topicos_curso
WHERE nome = 'Componentes' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Comunicação entre Componentes', id_topico, 2, true
FROM topicos_curso
WHERE nome = 'Componentes' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

-- Inserir pastas para o tópico 'Avaliação' do curso Vue.js
INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Projeto Final', id_topico, 1, true
FROM topicos_curso
WHERE nome = 'Avaliação' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Questionário', id_topico, 2, true
FROM topicos_curso
WHERE nome = 'Avaliação' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Curso de Vue.js');

-- Inserir pastas para o tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Conceitos Básicos', id_topico, 1, true
FROM topicos_curso
WHERE nome = 'Fundamentos da Comunicação' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Comunicação Assertiva');

INSERT INTO pastas_curso (nome, id_topico, ordem, ativo)
SELECT 'Barreiras na Comunicação', id_topico, 2, true
FROM topicos_curso
WHERE nome = 'Fundamentos da Comunicação' AND id_curso = (SELECT id_curso FROM cursos WHERE nome = 'Comunicação Assertiva');

-- Inserir conteúdos para a pasta 'Instalação' do tópico 'Introdução' do curso Vue.js
-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Instalação do Vue.js', 'Como instalar o Vue.js no seu ambiente de desenvolvimento', 'video', 'https://www.youtube.com/watch?v=exemplo-instalacao', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Guia de Instalação', 'Documento PDF com passo a passo da instalação', 'file', NULL, 'uploads/cursos/conteudos_curso/guia-instalacao.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- Inserir conteúdos para a pasta 'Primeiros Passos' do tópico 'Introdução' do curso Vue.js
-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Olá Mundo com Vue.js', 'Criando sua primeira aplicação Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-hello-world', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Primeiros Passos' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Documentação Oficial', 'Link para a documentação oficial do Vue.js', 'link', 'https://vuejs.org/guide/introduction.html', NULL, pc.id_pasta, c.id_curso, 2, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Primeiros Passos' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- Inserir conteúdos para a pasta 'Sintaxe Básica' do tópico 'Fundamentos' do curso Vue.js
-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Sintaxe de Templates', 'Aprendendo a sintaxe básica de templates no Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-templates', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Sintaxe Básica' 
AND tc.nome = 'Fundamentos' 
AND c.nome = 'Curso de Vue.js';

-- Inserir conteúdos para a pasta 'Conceitos Básicos' do tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'O que é Comunicação Assertiva?', 'Introdução aos conceitos de comunicação assertiva', 'video', 'https://www.youtube.com/watch?v=exemplo-comunicacao-assertiva', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Conceitos Básicos' 
AND tc.nome = 'Fundamentos da Comunicação' 
AND c.nome = 'Comunicação Assertiva';

-- ATUALIZADO: Adicionado id_curso
INSERT INTO conteudos_curso (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Manual de Comunicação Assertiva', 'Documento com os principais conceitos e técnicas', 'file', NULL, 'uploads/cursos/conteudos_curso/manual-comunicacao-assertiva.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM pastas_curso pc
JOIN topicos_curso tc ON pc.id_topico = tc.id_topico
JOIN cursos c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Conceitos Básicos' 
AND tc.nome = 'Fundamentos da Comunicação' 
AND c.nome = 'Comunicação Assertiva';

-- Criar quiz para o curso de Vue.js
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
SELECT id_curso, 'Quiz de Avaliação Final - Vue.js', 'Avaliação sobre os conceitos aprendidos no curso', NOW(), 60, true
FROM cursos 
WHERE nome = 'Curso de Vue.js';

-- Criar perguntas para o quiz
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?', 'multipla_escolha', 2, 1
FROM quizzes
WHERE titulo = 'Quiz de Avaliação Final - Vue.js';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'O Vue.js é um framework progressivo para construção de interfaces de usuário.', 'verdadeiro_falso', 1, 2
FROM quizzes
WHERE titulo = 'Quiz de Avaliação Final - Vue.js';

-- Criar opções para a primeira pergunta
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'v-model', true, 1
FROM quiz_perguntas
WHERE pergunta = 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'v-bind', false, 2
FROM quiz_perguntas
WHERE pergunta = 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'v-two-way', false, 3
FROM quiz_perguntas
WHERE pergunta = 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'v-sync', false, 4
FROM quiz_perguntas
WHERE pergunta = 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?';

-- Criar opções para a segunda pergunta
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Verdadeiro', true, 1
FROM quiz_perguntas
WHERE pergunta = 'O Vue.js é um framework progressivo para construção de interfaces de usuário.';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Falso', false, 2
FROM quiz_perguntas
WHERE pergunta = 'O Vue.js é um framework progressivo para construção de interfaces de usuário.';

-- Comentários em tópicos
INSERT INTO comentarios_topicos (id_topico, id_utilizador, comentario, data_comentario)
SELECT t.id_topico, u.id_utilizador, 'Essa é uma ótima questão! Para começar com React, recomendo a documentação oficial e alguns tutoriais.', NOW()
FROM topicos_categorias t, utilizadores u
WHERE t.titulo = 'Como começar com React?' AND u.nome = 'Formador';

INSERT INTO comentarios_topicos (id_topico, id_utilizador, comentario, data_comentario)
SELECT t.id_topico, u.id_utilizador, 'Obrigado pelas dicas! Vou começar a estudar hoje mesmo.', NOW() + INTERVAL '1 hour'
FROM topicos_categorias t, utilizadores u
WHERE t.titulo = 'Como começar com React?' AND u.nome = 'Formando';

-- Tipos de conteúdo
INSERT INTO tipos_conteudo (nome, icone, descricao, ativo)
VALUES
  ('PDF', 'file-pdf', 'Documento em formato PDF', true),
  ('Vídeo', 'video', 'Conteúdo em formato de vídeo', true),
  ('Apresentação', 'presentation', 'Slides de apresentação', true),
  ('Link', 'link', 'Link para recurso externo', true),
  ('Exercício', 'exercise', 'Exercício prático', true);

-- Subscrições de notificações
INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
VALUES
  ((SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), 
   'https://exemplo.com/endpoint-formador', 
   'chave-p256dh-exemplo-formador', 
   'chave-auth-exemplo-formador', 
   NOW()),
  ((SELECT id_utilizador FROM utilizadores WHERE nome = 'Formando' LIMIT 1), 
   'https://exemplo.com/endpoint-formando', 
   'chave-p256dh-exemplo-formando', 
   'chave-auth-exemplo-formando', 
   NOW());