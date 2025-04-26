-- =============================================
-- 1. CARGOS
-- =============================================
INSERT INTO cargos (descricao)
VALUES
  ('Administrador'),
  ('Formador'),
  ('Formando');

-- =============================================
-- 2. UTILIZADORES
-- =============================================
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  -- Administradores
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Administrador', 35, 'admin@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', TRUE, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Formador Rareura', 25, 'fe@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/fe@gmail.com_AVATAR.png', 'uploads/users/fe@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Administrador' LIMIT 1), 'Formador Rodrigo', 25, 'ro@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ro@gmail.com_AVATAR.png', 'uploads/users/ro@gmail.com_CAPA.png'),
  
  -- Formadores
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Formador', 40, 'a@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', TRUE, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Carla Pereira', 38, 'carla@gmail.com', '923456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/carla@gmail.com_AVATAR.png', 'uploads/users/carla@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Miguel Santos', 42, 'miguel@gmail.com', '933456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/miguel@gmail.com_AVATAR.png', 'uploads/users/miguel@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formador' LIMIT 1), 'Sara Oliveira', 35, 'sara@gmail.com', '943456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/sara@gmail.com_AVATAR.png', 'uploads/users/sara@gmail.com_CAPA.png'),
  
  -- Formandos
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Formando', 25, 'b@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'AVATAR.png', 'CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'João Silva', 28, 'joao@gmail.com', '953456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/joao@gmail.com_AVATAR.png', 'uploads/users/joao@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Ana Martins', 24, 'ana@gmail.com', '963456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ana@gmail.com_AVATAR.png', 'uploads/users/ana@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Pedro Costa', 31, 'pedro@gmail.com', '973456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/pedro@gmail.com_AVATAR.png', 'uploads/users/pedro@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Sofia Nunes', 26, 'sofia@gmail.com', '983456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/sofia@gmail.com_AVATAR.png', 'uploads/users/sofia@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Ricardo Ferreira', 29, 'ricardo@gmail.com', '993456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ricardo@gmail.com_AVATAR.png', 'uploads/users/ricardo@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Mariana Lopes', 27, 'mariana@gmail.com', '913456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/mariana@gmail.com_AVATAR.png', 'uploads/users/mariana@gmail.com_CAPA.png'),
  ((SELECT id_cargo FROM cargos WHERE descricao = 'Formando' LIMIT 1), 'Luís Rodrigues', 33, 'luis@gmail.com', '913456788', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/luis@gmail.com_AVATAR.png', 'uploads/users/luis@gmail.com_CAPA.png');

-- =============================================
-- 3. CATEGORIAS
-- =============================================
INSERT INTO categorias (nome)
VALUES
  ('Tecnologia'),
  ('Soft Skills'),
  ('Gestão'),
  ('Design'),
  ('Marketing Digital'),
  ('Programação'),
  ('Finanças'),
  ('Saúde e Bem-estar');

-- =============================================
-- 4. ÁREAS
-- =============================================
INSERT INTO areas (nome, id_categoria)
VALUES
  -- Tecnologia
  ('Desenvolvimento Web', (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1)),
  
  -- Soft Skills
  ('Comunicação Interpessoal', (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1)),
  
  -- Gestão
  ('Liderança e Gestão de Equipas', (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1)),
  
  -- Design
  ('UI/UX Design', (SELECT id_categoria FROM categorias WHERE nome = 'Design' LIMIT 1)),
  ('Design Gráfico', (SELECT id_categoria FROM categorias WHERE nome = 'Design' LIMIT 1)),
  
  -- Marketing Digital
  ('Marketing de Conteúdo', (SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1)),
  ('SEO', (SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1)),
  ('Redes Sociais', (SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1)),
  
  -- Programação
  ('Python', (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1)),
  ('JavaScript', (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1)),
  ('React Native', (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1)),
  
  -- Finanças
  ('Investimentos', (SELECT id_categoria FROM categorias WHERE nome = 'Finanças' LIMIT 1)),
  ('Contabilidade', (SELECT id_categoria FROM categorias WHERE nome = 'Finanças' LIMIT 1)),
  
  -- Saúde e Bem-estar
  ('Meditação', (SELECT id_categoria FROM categorias WHERE nome = 'Saúde e Bem-estar' LIMIT 1)),
  ('Nutrição', (SELECT id_categoria FROM categorias WHERE nome = 'Saúde e Bem-estar' LIMIT 1));


-- =============================================
-- 5. CURSOS
-- =============================================
INSERT INTO curso (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria, imagem_path, dir_path)
VALUES
  ('Curso de Vue.js', 'Curso prático sobre Vue.js para iniciantes.', 'sincrono', 20, '2025-04-01', '2025-04-30', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Desenvolvimento Web' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1),
   'uploads/cursos/curso-de-vuejs/capa.png',
   'uploads/cursos/curso-de-vuejs'),

  ('Comunicação Assertiva', 'Melhore a sua comunicação no ambiente de trabalho.', 'assincrono', NULL, '2025-04-01', '2025-06-01', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Comunicação Interpessoal' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1),
   'uploads/cursos/comunicacao-assertiva/capa.png',
   'uploads/cursos/comunicacao-assertiva'),

  ('Gestão de Equipas Ágeis', 'Aprenda a liderar equipas com metodologias ágeis.', 'sincrono', 15, '2025-04-15', '2025-05-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Liderança e Gestão de Equipas' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Gestão' LIMIT 1),
   'uploads/cursos/gestao-de-equipas-ageis/capa.png',
   'uploads/cursos/gestao-de-equipas-ageis'),

  ('Desenvolvimento React Native', 'Aprenda a criar aplicativos móveis multiplataforma.', 'sincrono', 25, '2025-05-15', '2025-06-30', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Miguel Santos' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'React Native' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1),
   'uploads/cursos/desenvolvimento-react-native/capa.png',
   'uploads/cursos/desenvolvimento-react-native'),

  ('Python para Análise de Dados', 'Domine as ferramentas Python para análise de dados.', 'sincrono', 30, '2025-06-01', '2025-07-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Sara Oliveira' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Python' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1),
   'uploads/cursos/python-para-analise-de-dados/capa.png',
   'uploads/cursos/python-para-analise-de-dados'),

  ('JavaScript Avançado', 'Técnicas avançadas e padrões de design em JavaScript.', 'sincrono', 20, '2025-08-01', '2025-09-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'JavaScript' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1),
   'uploads/cursos/javascript-avancado/capa.png',
   'uploads/cursos/javascript-avancado'),

  ('Marketing nas Redes Sociais', 'Estratégias avançadas para marketing em plataformas sociais.', 'assincrono', NULL, '2025-05-10', '2025-08-10', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Carla Pereira' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Redes Sociais' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1),
   'uploads/cursos/marketing-nas-redes-sociais/capa.png',
   'uploads/cursos/marketing-nas-redes-sociais'),

  ('SEO para Iniciantes', 'Fundamentos de otimização para mecanismos de busca.', 'assincrono', NULL, '2025-06-10', '2025-08-10', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador Rodrigo' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'SEO' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1),
   'uploads/cursos/seo-para-iniciantes/capa.png',
   'uploads/cursos/seo-para-iniciantes'),

  ('UI/UX Design para Iniciantes', 'Princípios fundamentais de design de interfaces e experiência do usuário.', 'sincrono', 20, '2025-05-20', '2025-06-20', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'UI/UX Design' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Design' LIMIT 1),
   'uploads/cursos/uiux-design-para-iniciantes/capa.png',
   'uploads/cursos/uiux-design-para-iniciantes'),

  ('Introdução a Investimentos', 'Aprenda os fundamentos para começar a investir.', 'assincrono', NULL, '2025-06-15', '2025-09-15', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Miguel Santos' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Investimentos' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Finanças' LIMIT 1),
   'uploads/cursos/introducao-a-investimentos/capa.png',
   'uploads/cursos/introducao-a-investimentos'),

  ('Contabilidade para Pequenos Negócios', 'Princípios contábeis para empreendedores.', 'sincrono', 15, '2025-07-10', '2025-08-20', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Carla Pereira' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Contabilidade' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Finanças' LIMIT 1),
   'uploads/cursos/contabilidade-para-pequenos-negocios/capa.png',
   'uploads/cursos/contabilidade-para-pequenos-negocios'),

  ('Meditação para o Dia a Dia', 'Técnicas de meditação para reduzir o estresse e aumentar o bem-estar.', 'assincrono', NULL, '2025-05-01', '2025-07-31', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Sara Oliveira' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Meditação' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Saúde e Bem-estar' LIMIT 1),
   'uploads/cursos/meditacao-para-o-dia-a-dia/capa.png',
   'uploads/cursos/meditacao-para-o-dia-a-dia'),

  ('Nutrição Funcional', 'Princípios da nutrição funcional para uma vida mais saudável.', 'assincrono', NULL, '2025-07-01', '2025-10-01', 'planeado', true,
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador Rareura' LIMIT 1),
   (SELECT id_area FROM areas WHERE nome = 'Nutrição' LIMIT 1),
   (SELECT id_categoria FROM categorias WHERE nome = 'Saúde e Bem-estar' LIMIT 1),
   'uploads/cursos/nutricao-funcional/capa.png',
   'uploads/cursos/nutricao-funcional');


INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Inteligência Artificial', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Robótica Avançada', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Marketing Digital', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Desenvolvimento Web', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Cibersegurança', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Engenharia de Software', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Gestão de Projetos', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Machine Learning', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Big Data', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Realidade Virtual', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso de Engenharia Mecânica', '2025-06-01', '2025-09-01');
INSERT INTO cursos (nome, data_inicio, data_fim) VALUES ('Curso Extra 50', '2025-06-01', '2025-09-01');

-- =============================================
-- 6. TÓPICOS DOS CURSOS
-- =============================================

-- Tópicos para o curso de Vue.js
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Introdução', id_curso, 1, true, NULL
FROM curso 
WHERE nome = 'Curso de Vue.js';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Fundamentos', id_curso, 2, true, NULL
FROM curso 
WHERE nome = 'Curso de Vue.js';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Componentes', id_curso, 3, true, NULL
FROM curso 
WHERE nome = 'Curso de Vue.js';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Avaliação', id_curso, 4, true, NULL
FROM curso 
WHERE nome = 'Curso de Vue.js';

-- Tópicos para o curso de Comunicação Assertiva
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Fundamentos da Comunicação', id_curso, 1, true, NULL
FROM curso 
WHERE nome = 'Comunicação Assertiva';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Técnicas de Assertividade', id_curso, 2, true, NULL
FROM curso 
WHERE nome = 'Comunicação Assertiva';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Prática e Exercícios', id_curso, 3, true, NULL
FROM curso 
WHERE nome = 'Comunicação Assertiva';

-- Tópicos para o curso de Gestão de Equipas Ágeis
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Introdução às Metodologias Ágeis', id_curso, 1, true, NULL
FROM curso 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Scrum', id_curso, 2, true, NULL
FROM curso 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Kanban', id_curso, 3, true, NULL
FROM curso 
WHERE nome = 'Gestão de Equipas Ágeis';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Liderança Ágil', id_curso, 4, true, NULL
FROM curso 
WHERE nome = 'Gestão de Equipas Ágeis';

-- Tópicos para o curso de Python para Análise de Dados
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Introdução ao Python', id_curso, 1, true, NULL
FROM curso 
WHERE nome = 'Python para Análise de Dados';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Manipulação de Dados com Pandas', id_curso, 2, true, NULL
FROM curso 
WHERE nome = 'Python para Análise de Dados';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Visualização de Dados', id_curso, 3, true, NULL
FROM curso 
WHERE nome = 'Python para Análise de Dados';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Análise Estatística', id_curso, 4, true, NULL
FROM curso 
WHERE nome = 'Python para Análise de Dados';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Projeto Final', id_curso, 5, true, NULL
FROM curso 
WHERE nome = 'Python para Análise de Dados';

-- Tópicos para o curso React Native
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Fundamentos de React Native', id_curso, 1, true, NULL
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Componentes e Navegação', id_curso, 2, true, NULL
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Integração com APIs', id_curso, 3, true, NULL
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Armazenamento e Persistência', id_curso, 4, true, NULL
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
SELECT 'Publicação nas Lojas', id_curso, 5, true, NULL
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

-- =============================================
-- 7. PASTAS DOS TÓPICOS
-- =============================================

-- Pastas para o tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Instalação', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Introdução' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Primeiros Passos', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Introdução' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

-- Pastas para o tópico 'Fundamentos' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Sintaxe Básica', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Data Binding', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Ciclo de Vida', id_topico, 3, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

-- Pastas para o tópico 'Componentes' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Componentes Básicos', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Componentes' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Comunicação entre Componentes', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Componentes' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

-- Pastas para o tópico 'Avaliação' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Projeto Final', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Avaliação' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Questionário', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Avaliação' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Curso de Vue.js');

-- Pastas para o tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Conceitos Básicos', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos da Comunicação' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Comunicação Assertiva');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Barreiras na Comunicação', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos da Comunicação' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Comunicação Assertiva');

-- Pastas para o tópico 'Introdução ao Python'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Instalação e Configuração', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Introdução ao Python' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Sintaxe Básica', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Introdução ao Python' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Estruturas de Dados', id_topico, 3, true, NULL
FROM curso_topico
WHERE nome = 'Introdução ao Python' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

-- Pastas para o tópico 'Manipulação de Dados com Pandas'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Introdução ao Pandas', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Manipulação de Dados com Pandas' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Importação e Exportação de Dados', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Manipulação de Dados com Pandas' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Transformação de Dados', id_topico, 3, true, NULL
FROM curso_topico
WHERE nome = 'Manipulação de Dados com Pandas' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Python para Análise de Dados');

-- Pastas para o tópico 'Fundamentos de React Native'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Configuração do Ambiente', id_topico, 1, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos de React Native' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Desenvolvimento React Native');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'JSX e Componentes', id_topico, 2, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos de React Native' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Desenvolvimento React Native');

INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
SELECT 'Estilização', id_topico, 3, true, NULL
FROM curso_topico
WHERE nome = 'Fundamentos de React Native' AND id_curso = (SELECT id_curso FROM curso WHERE nome = 'Desenvolvimento React Native');

-- =============================================
-- 8. CONTEÚDOS DAS PASTAS
-- =============================================

-- Conteúdos para a pasta 'Instalação' do tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Instalação do Vue.js', 'Como instalar o Vue.js no seu ambiente de desenvolvimento', 'video', 'https://www.youtube.com/watch?v=exemplo-instalacao', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Guia de Instalação', 'Documento PDF com passo a passo da instalação', 'file', NULL, 'uploads/cursos/curso-de-vuejs/introducao/instalacao/guia-instalacao.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- Conteúdos para a pasta 'Primeiros Passos' do tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Olá Mundo com Vue.js', 'Criando sua primeira aplicação Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-hello-world', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Primeiros Passos' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Documentação Oficial', 'Link para a documentação oficial do Vue.js', 'link', 'https://vuejs.org/guide/introduction.html', NULL, pc.id_pasta, c.id_curso, 2, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Primeiros Passos' 
AND tc.nome = 'Introdução' 
AND c.nome = 'Curso de Vue.js';

-- Conteúdos para a pasta 'Sintaxe Básica' do tópico 'Fundamentos' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Sintaxe de Templates', 'Aprendendo a sintaxe básica de templates no Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-templates', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Sintaxe Básica' 
AND tc.nome = 'Fundamentos' 
AND c.nome = 'Curso de Vue.js';

-- Conteúdos para a pasta 'Conceitos Básicos' do tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'O que é Comunicação Assertiva?', 'Introdução aos conceitos de comunicação assertiva', 'video', 'https://www.youtube.com/watch?v=exemplo-comunicacao-assertiva', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Conceitos Básicos' 
AND tc.nome = 'Fundamentos da Comunicação' 
AND c.nome = 'Comunicação Assertiva';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Manual de Comunicação Assertiva', 'Documento com os principais conceitos e técnicas', 'file', NULL, 'uploads/cursos/comunicacao-assertiva/fundamentos-da-comunicacao/conceitos-basicos/manual-comunicacao-assertiva.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Conceitos Básicos' 
AND tc.nome = 'Fundamentos da Comunicação' 
AND c.nome = 'Comunicação Assertiva';

-- Conteúdos para a pasta 'Instalação e Configuração' do Python
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Instalação do Python e Anaconda', 'Guia passo a passo para instalar Python e o ambiente Anaconda', 'video', 'https://www.youtube.com/watch?v=exemplo-instalacao-python', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação e Configuração' 
AND tc.nome = 'Introdução ao Python' 
AND c.nome = 'Python para Análise de Dados';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Configuração do Ambiente Virtual', 'Como configurar ambientes virtuais para seus projetos', 'file', NULL, 'uploads/cursos/python-para-analise-de-dados/introducao-ao-python/instalacao-e-configuracao/guia-ambiente-virtual-python.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação e Configuração' 
AND tc.nome = 'Introdução ao Python' 
AND c.nome = 'Python para Análise de Dados';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Introdução ao Jupyter Notebook', 'Como usar o Jupyter Notebook para análise de dados', 'video', 'https://www.youtube.com/watch?v=exemplo-jupyter', NULL, pc.id_pasta, c.id_curso, 3, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Instalação e Configuração' 
AND tc.nome = 'Introdução ao Python' 
AND c.nome = 'Python para Análise de Dados';

-- Conteúdos para a pasta 'Sintaxe Básica' do Python
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Variáveis e Tipos de Dados', 'Fundamentos de variáveis e tipos de dados em Python', 'video', 'https://www.youtube.com/watch?v=exemplo-variaveis-python', NULL, pc.id_pasta, c.id_curso, 1, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Sintaxe Básica' 
AND tc.nome = 'Introdução ao Python' 
AND c.nome = 'Python para Análise de Dados';

INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
SELECT 'Estruturas de Controle', 'Loops e condicionais em Python', 'file', NULL, 'uploads/cursos/python-para-analise-de-dados/introducao-ao-python/sintaxe-basica/estruturas-controle-python.pdf', pc.id_pasta, c.id_curso, 2, true, NOW()
FROM curso_topico_pasta pc
JOIN curso_topico tc ON pc.id_topico = tc.id_topico
JOIN curso c ON tc.id_curso = c.id_curso
WHERE pc.nome = 'Sintaxe Básica' 
AND tc.nome = 'Introdução ao Python' 
AND c.nome = 'Python para Análise de Dados';

-- =============================================
-- 9. INSCRIÇÕES EM CURSOS
-- =============================================

-- Inscrições no curso de Vue.js
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW(), 'inscrito', NULL, NULL
FROM utilizadores u, curso c
WHERE u.nome = 'Formando' AND c.nome = 'Curso de Vue.js';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '5 DAY', 'inscrito', 
       'Quero aprimorar minhas habilidades em desenvolvimento web front-end.', 
       'Espero aprender a construir aplicações web modernas e responsivas.'
FROM utilizadores u, curso c
WHERE u.email = 'joao@gmail.com' AND c.nome = 'Curso de Vue.js';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '4 DAY', 'inscrito', 
       'Preciso de conhecimento em Vue.js para um projeto no trabalho.', 
       'Quero aplicar o conhecimento em projetos reais da minha empresa.'
FROM utilizadores u, curso c
WHERE u.email = 'ana@gmail.com' AND c.nome = 'Curso de Vue.js';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '3 DAY', 'inscrito', 
       'Estou migrando de Angular para Vue e preciso me adaptar.', 
       'Espero entender as diferenças e vantagens em relação ao Angular.'
FROM utilizadores u, curso c
WHERE u.email = 'pedro@gmail.com' AND c.nome = 'Curso de Vue.js';

-- Inscrição de ro@gmail.com no Curso de Vue.js
DO $$
DECLARE
    user_id INTEGER;
    course_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE email = 'ro@gmail.com';
    SELECT id_curso INTO course_id FROM curso WHERE nome = 'Curso de Vue.js';
    
    IF user_id IS NOT NULL AND course_id IS NOT NULL THEN
        INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
        VALUES (user_id, course_id, NOW() - INTERVAL '2 DAY', 'inscrito',
            'Preocupado com a segurança das aplicações que desenvolvo.',
            'Quero aprender a identificar e corrigir vulnerabilidades comuns em aplicações web.');
    END IF;
END $$;

-- Inscrições no curso de Comunicação Assertiva
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW(), 'inscrito', NULL, NULL
FROM utilizadores u, curso c
WHERE u.nome = 'Formando' AND c.nome = 'Comunicação Assertiva';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '6 DAY', 'inscrito', 
       'Quero melhorar minhas habilidades de comunicação no ambiente corporativo.', 
       'Espero me tornar mais eficaz nas reuniões e apresentações.'
FROM utilizadores u, curso c
WHERE u.email = 'sofia@gmail.com' AND c.nome = 'Comunicação Assertiva';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '5 DAY', 'inscrito', 
       'Acredito que melhorar minha comunicação será essencial para avançar na carreira.', 
       'Quero aprender técnicas práticas para situações reais de trabalho.'
FROM utilizadores u, curso c
WHERE u.email = 'ricardo@gmail.com' AND c.nome = 'Comunicação Assertiva';

-- Inscrições em Gestão de Equipas Ágeis
DO $$
DECLARE
    user_id INTEGER;
    course_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE email = 'b@gmail.com';
    SELECT id_curso INTO course_id FROM curso WHERE nome = 'Gestão de Equipas Ágeis';
    
    IF user_id IS NOT NULL AND course_id IS NOT NULL THEN
        INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado)
        VALUES (user_id, course_id, NOW() - INTERVAL '7 days', 'inscrito');
    END IF;
END $$;

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '7 DAY', 'inscrito', 
       'Fui promovido a líder de equipe e preciso aprender metodologias ágeis.', 
       'Gostaria de implementar Scrum e Kanban no meu time.'
FROM utilizadores u, curso c
WHERE u.email = 'mariana@gmail.com' AND c.nome = 'Gestão de Equipas Ágeis';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '6 DAY', 'inscrito', 
       'Minha empresa está adotando metodologias ágeis e preciso me adaptar.', 
       'Quero entender os princípios ágeis e como aplicá-los no dia a dia.'
FROM utilizadores u, curso c
WHERE u.email = 'luis@gmail.com' AND c.nome = 'Gestão de Equipas Ágeis';

-- Inscrições em Python para Análise de Dados
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '2 DAY', 'inscrito', 
       'Quero aprender a analisar grandes volumes de dados com Python.', 
       'Espero dominar pandas, numpy e visualização de dados.'
FROM utilizadores u, curso c
WHERE u.email = 'joao@gmail.com' AND c.nome = 'Python para Análise de Dados';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '3 DAY', 'inscrito', 
       'Trabalho com análise de dados e quero automatizar meus processos.', 
       'Quero aprender a criar scripts eficientes para tratamento de dados.'
FROM utilizadores u, curso c
WHERE u.email = 'ana@gmail.com' AND c.nome = 'Python para Análise de Dados';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '1 DAY', 'inscrito', 
       'Estou em transição de carreira para ciência de dados.', 
       'Quero me preparar para o mercado de trabalho em análise de dados.'
FROM utilizadores u, curso c
WHERE u.email = 'ricardo@gmail.com' AND c.nome = 'Python para Análise de Dados';

-- Inscrições em React Native
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '4 DAY', 'inscrito', 
       'Quero expandir meu conhecimento para desenvolvimento mobile.', 
       'Espero construir aplicativos completos ao final do curso.'
FROM utilizadores u, curso c
WHERE u.email = 'pedro@gmail.com' AND c.nome = 'Desenvolvimento React Native';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '3 DAY', 'inscrito', 
       'Tenho uma ideia de aplicativo e quero aprender a desenvolvê-lo.', 
       'Quero publicar meu aplicativo nas lojas após o curso.'
FROM utilizadores u, curso c
WHERE u.email = 'sofia@gmail.com' AND c.nome = 'Desenvolvimento React Native';

-- Inscrições em UI/UX Design
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '5 DAY', 'inscrito', 
       'Sou desenvolvedor e quero entender melhor o lado de design.', 
       'Espero criar interfaces mais intuitivas nos meus projetos.'
FROM utilizadores u, curso c
WHERE u.email = 'luis@gmail.com' AND c.nome = 'UI/UX Design para Iniciantes';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '2 DAY', 'inscrito', 
       'Quero mudar de carreira para design de interfaces.', 
       'Espero construir um portfólio inicial durante o curso.'
FROM utilizadores u, curso c
WHERE u.email = 'mariana@gmail.com' AND c.nome = 'UI/UX Design para Iniciantes';

-- Inscrições em Introdução a Investimentos
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW() - INTERVAL '1 DAY', 'inscrito', 
       'Quero começar a investir meu dinheiro de forma consciente.', 
       'Espero entender os diferentes tipos de investimentos e riscos.'
FROM utilizadores u, curso c
WHERE u.email = 'ricardo@gmail.com' AND c.nome = 'Introdução a Investimentos';

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
SELECT u.id_utilizador, c.id_curso, NOW(), 'inscrito', 
       'Preciso organizar minha vida financeira e começar a investir.', 
       'Quero criar um plano de investimentos para meu futuro.'
FROM utilizadores u, curso c
WHERE u.email = 'joao@gmail.com' AND c.nome = 'Introdução a Investimentos';

-- =============================================
-- 10. INSCRIÇÕES CANCELADAS
-- =============================================

DO $$
DECLARE
    user_id INTEGER;
    course_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE email = 'exemplo@gmail.com';
    SELECT id_curso INTO course_id FROM curso WHERE nome = 'Nome do Curso';
    
    IF user_id IS NOT NULL AND course_id IS NOT NULL THEN
        INSERT INTO inscricoes_cursos (
            id_utilizador, 
            id_curso, 
            data_inscricao, 
            estado, 
            motivacao, 
            expectativas
        )
        VALUES (
            user_id, 
            course_id, 
            NOW(), 
            'inscrito',
            'Motivação para fazer este curso...',
            'Espero aprender e aplicar os conhecimentos...'
        );
        
        UPDATE curso SET vagas = vagas - 1 
        WHERE id_curso = course_id AND tipo = 'sincrono' AND vagas > 0;
    END IF;
END $$;


-- Método para cancelar inscrição (PATCH)
DO $$
DECLARE
    inscricao_id INTEGER := 17; -- ID da inscrição a cancelar
    curso_id INTEGER;
BEGIN
    -- Verificar se a inscrição existe e obter o curso_id
    SELECT id_curso INTO curso_id FROM inscricoes_cursos 
    WHERE id_inscricao = inscricao_id AND estado = 'inscrito';
    
    IF curso_id IS NOT NULL THEN
        -- Atualizar a inscrição para cancelada
        UPDATE inscricoes_cursos 
        SET estado = 'cancelado', 
            data_cancelamento = NOW(),
            motivo_cancelamento = 'Motivo do cancelamento'
        WHERE id_inscricao = inscricao_id;
        
        -- Incrementar vagas disponíveis no curso
        UPDATE curso SET vagas = vagas + 1 
        WHERE id_curso = curso_id AND tipo = 'sincrono';
    END IF;
END $$;

-- =============================================
-- 11. QUIZZES E PERGUNTAS
-- =============================================

-- Quiz para o curso de Vue.js
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
SELECT id_curso, 'Quiz de Avaliação Final - Vue.js', 'Avaliação sobre os conceitos aprendidos no curso', NOW(), 60, true
FROM curso 
WHERE nome = 'Curso de Vue.js';

-- Perguntas para o quiz de Vue.js
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?', 'multipla_escolha', 2, 1
FROM quizzes
WHERE titulo = 'Quiz de Avaliação Final - Vue.js';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'O Vue.js é um framework progressivo para construção de interfaces de usuário.', 'verdadeiro_falso', 1, 2
FROM quizzes
WHERE titulo = 'Quiz de Avaliação Final - Vue.js';

-- Opções para a primeira pergunta do quiz de Vue.js
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

-- Opções para a segunda pergunta do quiz de Vue.js
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Verdadeiro', true, 1
FROM quiz_perguntas
WHERE pergunta = 'O Vue.js é um framework progressivo para construção de interfaces de usuário.';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Falso', false, 2
FROM quiz_perguntas
WHERE pergunta = 'O Vue.js é um framework progressivo para construção de interfaces de usuário.';

-- Quiz para o curso de Python
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
SELECT id_curso, 'Avaliação de Fundamentos Python', 'Teste seus conhecimentos de Python básico', NOW(), 45, true
FROM curso 
WHERE nome = 'Python para Análise de Dados';

-- Perguntas para o quiz de Python
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual é a função usada para obter o comprimento de uma lista em Python?', 'multipla_escolha', 2, 1
FROM quizzes
WHERE titulo = 'Avaliação de Fundamentos Python';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Em Python, as listas são imutáveis.', 'verdadeiro_falso', 1, 2
FROM quizzes
WHERE titulo = 'Avaliação de Fundamentos Python';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual o resultado da expressão: 3 * "Python"?', 'multipla_escolha', 2, 3
FROM quizzes
WHERE titulo = 'Avaliação de Fundamentos Python';

-- Opções para as perguntas do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'len()', true, 1
FROM quiz_perguntas
WHERE pergunta = 'Qual é a função usada para obter o comprimento de uma lista em Python?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'size()', false, 2
FROM quiz_perguntas
WHERE pergunta = 'Qual é a função usada para obter o comprimento de uma lista em Python?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'length()', false, 3
FROM quiz_perguntas
WHERE pergunta = 'Qual é a função usada para obter o comprimento de uma lista em Python?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'count()', false, 4
FROM quiz_perguntas
WHERE pergunta = 'Qual é a função usada para obter o comprimento de uma lista em Python?';

-- Opções para a segunda pergunta do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Verdadeiro', false, 1
FROM quiz_perguntas
WHERE pergunta = 'Em Python, as listas são imutáveis.';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Falso', true, 2
FROM quiz_perguntas
WHERE pergunta = 'Em Python, as listas são imutáveis.';

-- Opções para a terceira pergunta do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Python Python Python', true, 1
FROM quiz_perguntas
WHERE pergunta = 'Qual o resultado da expressão: 3 * "Python"?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'PythonPythonPython', false, 2
FROM quiz_perguntas
WHERE pergunta = 'Qual o resultado da expressão: 3 * "Python"?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Error', false, 3
FROM quiz_perguntas
WHERE pergunta = 'Qual o resultado da expressão: 3 * "Python"?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, '9', false, 4
FROM quiz_perguntas
WHERE pergunta = 'Qual o resultado da expressão: 3 * "Python"?';

-- Quiz para o curso de React Native
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
SELECT id_curso, 'Avaliação de React Native', 'Teste seus conhecimentos fundamentais de React Native', NOW(), 60, true
FROM curso 
WHERE nome = 'Desenvolvimento React Native';

-- Perguntas para o quiz de React Native
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual comando é usado para iniciar um novo projeto React Native com Expo?', 'multipla_escolha', 2, 1
FROM quizzes
WHERE titulo = 'Avaliação de React Native';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'React Native compila para código nativo em cada plataforma.', 'verdadeiro_falso', 1, 2
FROM quizzes
WHERE titulo = 'Avaliação de React Native';

INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
SELECT id_quiz, 'Qual é o componente equivalente a <div> do HTML no React Native?', 'multipla_escolha', 2, 3
FROM quizzes
WHERE titulo = 'Avaliação de React Native';

-- Opções para as perguntas do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'expo init MyApp', true, 1
FROM quiz_perguntas
WHERE pergunta = 'Qual comando é usado para iniciar um novo projeto React Native com Expo?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'create-react-native-app MyApp', false, 2
FROM quiz_perguntas
WHERE pergunta = 'Qual comando é usado para iniciar um novo projeto React Native com Expo?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'react-native init MyApp', false, 3
FROM quiz_perguntas
WHERE pergunta = 'Qual comando é usado para iniciar um novo projeto React Native com Expo?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'npm create react-native MyApp', false, 4
FROM quiz_perguntas
WHERE pergunta = 'Qual comando é usado para iniciar um novo projeto React Native com Expo?';

-- Opções para a segunda pergunta do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Verdadeiro', true, 1
FROM quiz_perguntas
WHERE pergunta = 'React Native compila para código nativo em cada plataforma.';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Falso', false, 2
FROM quiz_perguntas
WHERE pergunta = 'React Native compila para código nativo em cada plataforma.';

-- Opções para a terceira pergunta do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'View', true, 1
FROM quiz_perguntas
WHERE pergunta = 'Qual é o componente equivalente a <div> do HTML no React Native?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Container', false, 2
FROM quiz_perguntas
WHERE pergunta = 'Qual é o componente equivalente a <div> do HTML no React Native?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Div', false, 3
FROM quiz_perguntas
WHERE pergunta = 'Qual é o componente equivalente a <div> do HTML no React Native?';

INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
SELECT id_pergunta, 'Block', false, 4
FROM quiz_perguntas
WHERE pergunta = 'Qual é o componente equivalente a <div> do HTML no React Native?';

-- =============================================
-- 12. TÓPICOS DO FÓRUM (POR CATEGORIA)
-- =============================================

-- Tópicos por categoria
INSERT INTO topicos_categorias (id_categoria, titulo, descricao, criado_por, data_criacao)
VALUES
  ((SELECT id_categoria FROM categorias WHERE nome = 'Tecnologia' LIMIT 1), 
   'Como começar com React?', 
   'Discussão sobre primeiros passos com React.', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), 
   NOW()),
  
  ((SELECT id_categoria FROM categorias WHERE nome = 'Soft Skills' LIMIT 1), 
   'Empatia no ambiente de trabalho', 
   'Reflexões e estratégias para cultivar empatia.', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), 
   NOW()),

  ((SELECT id_categoria FROM categorias WHERE nome = 'Programação' LIMIT 1), 
   'Melhores práticas em Python', 
   'Discutindo boas práticas de codificação em Python', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Sara Oliveira' LIMIT 1), 
   NOW()),
  
  ((SELECT id_categoria FROM categorias WHERE nome = 'Marketing Digital' LIMIT 1), 
   'Estratégias de marketing para pequenos negócios', 
   'Compartilhando estratégias eficientes para empresas com orçamento limitado', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Carla Pereira' LIMIT 1), 
   NOW()),
  
  ((SELECT id_categoria FROM categorias WHERE nome = 'Design' LIMIT 1), 
   'Tendências de UI/UX para 2025', 
   'Quais serão as principais tendências em design de interfaces no próximo ano?', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Formador' LIMIT 1), 
   NOW()),
  
  ((SELECT id_categoria FROM categorias WHERE nome = 'Finanças' LIMIT 1), 
   'Investimentos para iniciantes', 
   'Por onde começar a jornada de investimentos com pouco capital', 
   (SELECT id_utilizador FROM utilizadores WHERE nome = 'Miguel Santos' LIMIT 1), 
   NOW());

-- =============================================
-- 13. COMENTÁRIOS NOS TÓPICOS
-- =============================================

-- Comentários para o tópico "Como começar com React?"
DO $$
DECLARE
    topico_id INTEGER;
    user_id INTEGER;
BEGIN
    SELECT t.id_topico, u.id_utilizador 
    INTO topico_id, user_id
    FROM topicos_categorias t, utilizadores u
    WHERE t.titulo = 'Como começar com React?' AND u.nome = 'Formador'
    LIMIT 1;
    
    IF topico_id IS NOT NULL AND user_id IS NOT NULL THEN
        INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
        VALUES (topico_id, user_id, 'Essa é uma ótima questão! Para começar com React, recomendo a documentação oficial e alguns tutoriais.', NOW());
    END IF;
END $$;

DO $$
DECLARE
    topico_id INTEGER;
    user_id INTEGER;
BEGIN
    SELECT t.id_topico, u.id_utilizador 
    INTO topico_id, user_id
    FROM topicos_categorias t, utilizadores u
    WHERE t.titulo = 'Como começar com React?' AND u.nome = 'Formando'
    LIMIT 1;
    
    IF topico_id IS NOT NULL AND user_id IS NOT NULL THEN
        INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
        VALUES (topico_id, user_id, 'Obrigado pelas dicas! Vou começar a estudar hoje mesmo.', NOW() + INTERVAL '1 hour');
    END IF;
END $$;

DO $$
DECLARE
    topico_id INTEGER;
    user_id INTEGER;
BEGIN
    SELECT t.id_topico, u.id_utilizador 
    INTO topico_id, user_id
    FROM topicos_categorias t, utilizadores u
    WHERE t.titulo = 'Como começar com React?' AND u.nome = 'Pedro Costa'
    LIMIT 1;
    
    IF topico_id IS NOT NULL AND user_id IS NOT NULL THEN
        INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
        VALUES (topico_id, user_id, 'Estou tendo dificuldades para entender os hooks no React. Alguém poderia explicar de forma mais simples?', NOW() - INTERVAL '3 DAY');
    END IF;
END $$;

-- Comentários para o tópico "Empatia no ambiente de trabalho"
DO $$
DECLARE
    topico_id INTEGER;
    user_id INTEGER;
BEGIN
    SELECT t.id_topico, u.id_utilizador 
    INTO topico_id, user_id
    FROM topicos_categorias t, utilizadores u
    WHERE t.titulo = 'Empatia no ambiente de trabalho' AND u.nome = 'Sofia Nunes'
    LIMIT 1;
    
    IF topico_id IS NOT NULL AND user_id IS NOT NULL THEN
        INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
        VALUES (topico_id, user_id, 'Como vocês praticam empatia no ambiente de trabalho remoto? Tenho achado desafiador sem a interação presencial.', NOW() - INTERVAL '5 DAY');
    END IF;
END $$;

DO $$
DECLARE
    topico_id INTEGER;
    user_id INTEGER;
BEGIN
    SELECT t.id_topico, u.id_utilizador 
    INTO topico_id, user_id
    FROM topicos_categorias t, utilizadores u
    WHERE t.titulo = 'Empatia no ambiente de trabalho' AND u.nome = 'Carla Pereira'
    LIMIT 1;
    
    IF topico_id IS NOT NULL AND user_id IS NOT NULL THEN
        INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
        VALUES (topico_id, user_id, 'Uma técnica que uso é fazer check-ins emocionais no início das reuniões. Perguntar como as pessoas estão se sentindo realmente, não só profissionalmente.', NOW() - INTERVAL '4 DAY');
    END IF;
END $$;

-- =============================================
-- 14. TIPOS DE CONTEÚDO
-- =============================================

INSERT INTO tipos_conteudo (nome, icone, descricao, ativo)
VALUES
  ('PDF', 'file-pdf', 'Documento em formato PDF', true),
  ('Vídeo', 'video', 'Conteúdo em formato de vídeo', true),
  ('Apresentação', 'presentation', 'Slides de apresentação', true),
  ('Link', 'link', 'Link para recurso externo', true),
  ('Exercício', 'exercise', 'Exercício prático', true);

-- =============================================
-- 15. SUBSCRIÇÕES DE NOTIFICAÇÕES
-- =============================================

DO $$
DECLARE
    user_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE nome = 'Formador' LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
        VALUES (user_id, 'https://exemplo.com/endpoint-formador', 'chave-p256dh-exemplo-formador', 'chave-auth-exemplo-formador', NOW());
    END IF;
END $$;

DO $$
DECLARE
    user_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE nome = 'Formando' LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
        VALUES (user_id, 'https://exemplo.com/endpoint-formando', 'chave-p256dh-exemplo-formando', 'chave-auth-exemplo-formando', NOW());
    END IF;
END $$;

DO $$
DECLARE
    user_id INTEGER;
BEGIN
    SELECT id_utilizador INTO user_id FROM utilizadores WHERE nome = 'João Silva' LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
        VALUES (user_id, 'https://exemplo.com/endpoint-joao', 'chave-p256dh-exemplo-joao', 'chave-auth-exemplo-joao', NOW());
    END IF;
END $$;