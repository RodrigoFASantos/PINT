-- =============================================
-- 1. CARGOS
-- =============================================
INSERT INTO cargos (id_cargo, descricao)
VALUES
  (1, 'Administrador'),
  (2, 'Formador'),
  (3, 'Formando');

-- =============================================
-- 2. UTILIZADORES
-- =============================================
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  -- Administradores
  (1, 'Administrador', 35, 'admin@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', TRUE, 'AVATAR.png', 'CAPA.png'),
  (1, 'Formador Rareura', 25, 'fe@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/fe_at_gmail_com/fe@gmail.com_AVATAR.png', 'uploads/users/fe_at_gmail_com/fe@gmail.com_CAPA.png'),
  (1, 'Formador Rodrigo', 25, 'ro@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ro_at_gmail_com/ro@gmail.com_AVATAR.png', 'uploads/users/ro_at_gmail_com/ro@gmail.com_CAPA.png'),
  
  -- Formadores
  (2, 'Formador', 40, 'a@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', TRUE, 'uploads/users/a_at_gmail_com/a@gmail.com_AVATAR.png', 'uploads/users/a_at_gmail_com/a@gmail.com_CAPA.png'),
  (2, 'Carla Pereira', 38, 'carla@gmail.com', '923456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/carla_at_gmail_com/carla@gmail.com_AVATAR.png', 'uploads/users/carla_at_gmail_com/carla@gmail.com_CAPA.png'),
  (2, 'Miguel Santos', 42, 'miguel@gmail.com', '933456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/miguel_at_gmail_com/miguel@gmail.com_AVATAR.png', 'uploads/users/miguel_at_gmail_com/miguel@gmail.com_CAPA.png'),
  (2, 'Sara Oliveira', 35, 'sara@gmail.com', '943456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/sara_at_gmail_com/sara@gmail.com_AVATAR.png', 'uploads/users/sara_at_gmail_com/sara@gmail.com_CAPA.png'),
  
  -- Formandos
  (3, 'Formando', 25, 'b@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/b_at_gmail_com/b@gmail.com_AVATAR.png', 'uploads/users/b_at_gmail_com/b@gmail.com_CAPA.png'),
  (3, 'João Silva', 28, 'joao@gmail.com', '953456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/joao_at_gmail_com/joao@gmail.com_AVATAR.png', 'uploads/users/joao_at_gmail_com/joao@gmail.com_CAPA.png'),
  (3, 'Ana Martins', 24, 'ana@gmail.com', '963456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ana_at_gmail_com/ana@gmail.com_AVATAR.png', 'uploads/users/ana_at_gmail_com/ana@gmail.com_CAPA.png'),
  (3, 'Pedro Costa', 31, 'pedro@gmail.com', '973456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/pedro_at_gmail_com/pedro@gmail.com_AVATAR.png', 'uploads/users/pedro_at_gmail_com/pedro@gmail.com_CAPA.png'),
  (3, 'Sofia Nunes', 26, 'sofia@gmail.com', '983456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/sofia_at_gmail_com/sofia@gmail.com_AVATAR.png', 'uploads/users/sofia_at_gmail_com/sofia@gmail.com_CAPA.png'),
  (3, 'Ricardo Ferreira', 29, 'ricardo@gmail.com', '993456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/ricardo_at_gmail_com/ricardo@gmail.com_AVATAR.png', 'uploads/users/ricardo_at_gmail_com/ricardo@gmail.com_CAPA.png'),
  (3, 'Mariana Lopes', 27, 'mariana@gmail.com', '913456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/mariana_at_gmail_com/mariana@gmail.com_AVATAR.png', 'uploads/users/mariana_at_gmail_com/mariana@gmail.com_CAPA.png'),
  (3, 'Luís Rodrigues', 33, 'luis@gmail.com', '913456788', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', FALSE, 'uploads/users/luis_at_gmail_com/luis@gmail.com_AVATAR.png', 'uploads/users/luis_at_gmail_com/luis@gmail.com_CAPA.png');

-- =============================================
-- 3. USER PENDENTES
-- =============================================
-- Esta tabela foi adicionada para cumprir com o model User_Pendente.js
INSERT INTO "User_Pendente" (id_cargo, nome, idade, email, telefone, password, token, expires_at, created_at, updated_at)
VALUES
  (2, 'Formador Pendente', 30, 'pendente@gmail.com', '987654321', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 'token123', NOW() + INTERVAL '24 hours', NOW(), NOW()),
  (3, 'Formando Pendente', 25, 'pendente2@gmail.com', '987654322', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 'token456', NOW() + INTERVAL '24 hours', NOW(), NOW());

-- =============================================
-- 4. FORMADOR ASSOCIACOES PENDENTES
-- =============================================
INSERT INTO formador_associacoes_pendentes (id_pendente, categorias, areas, cursos, created_at)
VALUES
  (1, '[1, 2, 6]', '[1, 10]', '[]', NOW());

-- =============================================
-- 5. PUSH SUBSCRIPTIONS
-- =============================================
INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
VALUES
  (4, 'https://exemplo.com/endpoint-formador', 'chave-p256dh-exemplo-formador', 'chave-auth-exemplo-formador', NOW()),
  (8, 'https://exemplo.com/endpoint-formando', 'chave-p256dh-exemplo-formando', 'chave-auth-exemplo-formando', NOW()),
  (9, 'https://exemplo.com/endpoint-joao', 'chave-p256dh-exemplo-joao', 'chave-auth-exemplo-joao', NOW());

-- =============================================
-- 6. CATEGORIAS
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
-- 7. ÁREAS
-- =============================================
INSERT INTO areas (nome, id_categoria)
VALUES
  -- Tecnologia
  ('Desenvolvimento Web', 1),
  
  -- Soft Skills
  ('Comunicação Interpessoal', 2),
  
  -- Gestão
  ('Liderança e Gestão de Equipas', 3),
  
  -- Design
  ('UI/UX Design', 4),
  ('Design Gráfico', 4),
  
  -- Marketing Digital
  ('Marketing de Conteúdo', 5),
  ('SEO', 5),
  ('Redes Sociais', 5),
  
  -- Programação
  ('Python', 6),
  ('JavaScript', 6),
  ('React Native', 6),
  
  -- Finanças
  ('Investimentos', 7),
  ('Contabilidade', 7),
  
  -- Saúde e Bem-estar
  ('Meditação', 8),
  ('Nutrição', 8);

-- =============================================
-- 8. ASSOCIAÇÕES FORMADORES COM CATEGORIAS
-- =============================================
INSERT INTO formador_categoria (id_formador, id_categoria, data_associacao)
VALUES
  -- Formador com Tecnologia, Programação e Design
  (4, 1, NOW()),
  (4, 6, NOW()),
  (4, 4, NOW()),
   
  -- Carla Pereira com Marketing Digital e Soft Skills
  (5, 5, NOW()),
  (5, 2, NOW()),
   
  -- Miguel Santos com Programação, Finanças e Gestão
  (6, 6, NOW()),
  (6, 7, NOW()),
  (6, 3, NOW()),
   
  -- Sara Oliveira com Programação, Saúde e Bem-estar e Tecnologia
  (7, 6, NOW()),
  (7, 8, NOW()),
  (7, 1, NOW());

-- =============================================
-- 9. ASSOCIAÇÕES FORMADORES COM ÁREAS
-- =============================================
INSERT INTO formador_area (id_formador, id_area, data_associacao)
VALUES
  -- Formador com Desenvolvimento Web, JavaScript e UI/UX Design
  (4, 1, NOW()),
  (4, 10, NOW()),
  (4, 4, NOW()),
   
  -- Carla Pereira com Marketing de Conteúdo, Redes Sociais, SEO e Comunicação Interpessoal
  (5, 6, NOW()),
  (5, 8, NOW()),
  (5, 7, NOW()),
  (5, 2, NOW()),
   
  -- Miguel Santos com JavaScript, React Native, Investimentos e Liderança e Gestão de Equipas
  (6, 10, NOW()),
  (6, 11, NOW()),
  (6, 12, NOW()),
  (6, 3, NOW()),
   
  -- Sara Oliveira com Python, React Native, Meditação e Nutrição
  (7, 9, NOW()),
  (7, 11, NOW()),
  (7, 14, NOW()),
  (7, 15, NOW());

-- =============================================
-- 10. CURSOS
-- =============================================
INSERT INTO curso (nome, descricao, tipo, vagas, data_inicio, data_fim, estado, ativo, id_formador, id_area, id_categoria, imagem_path, dir_path)
VALUES
  ('Curso de Vue.js', 'Curso prático sobre Vue.js para iniciantes.', 'sincrono', 20, '2025-04-01', '2025-04-30', 'planeado', true, 4, 1, 1, 'uploads/cursos/curso-de-vuejs/capa.png', 'uploads/cursos/curso-de-vuejs'),
  ('Comunicação Assertiva', 'Melhore a sua comunicação no ambiente de trabalho.', 'assincrono', NULL, '2025-04-01', '2025-06-01', 'planeado', true, 4, 2, 2, 'uploads/cursos/comunicacao-assertiva/capa.png', 'uploads/cursos/comunicacao-assertiva'),
  ('Gestão de Equipas Ágeis', 'Aprenda a liderar equipas com metodologias ágeis.', 'sincrono', 15, '2025-04-15', '2025-05-15', 'planeado', true, 4, 3, 3, 'uploads/cursos/gestao-de-equipas-ageis/capa.png', 'uploads/cursos/gestao-de-equipas-ageis'),
  ('Desenvolvimento React Native', 'Aprenda a criar aplicativos móveis multiplataforma.', 'sincrono', 25, '2025-05-15', '2025-06-30', 'planeado', true, 6, 11, 6, 'uploads/cursos/desenvolvimento-react-native/capa.png', 'uploads/cursos/desenvolvimento-react-native'),
  ('Python para Análise de Dados', 'Domine as ferramentas Python para análise de dados.', 'sincrono', 30, '2025-06-01', '2025-07-15', 'planeado', true, 7, 9, 6, 'uploads/cursos/python-para-analise-de-dados/capa.png', 'uploads/cursos/python-para-analise-de-dados'),
  ('JavaScript Avançado', 'Técnicas avançadas e padrões de design em JavaScript.', 'sincrono', 20, '2025-08-01', '2025-09-15', 'planeado', true, 4, 10, 6, 'uploads/cursos/javascript-avancado/capa.png', 'uploads/cursos/javascript-avancado'),
  ('Marketing nas Redes Sociais', 'Estratégias avançadas para marketing em plataformas sociais.', 'assincrono', NULL, '2025-05-10', '2025-08-10', 'planeado', true, 5, 8, 5, 'uploads/cursos/marketing-nas-redes-sociais/capa.png', 'uploads/cursos/marketing-nas-redes-sociais'),
  ('SEO para Iniciantes', 'Fundamentos de otimização para mecanismos de busca.', 'assincrono', NULL, '2025-06-10', '2025-08-10', 'planeado', true, 3, 7, 5, 'uploads/cursos/seo-para-iniciantes/capa.png', 'uploads/cursos/seo-para-iniciantes'),
  ('UI/UX Design para Iniciantes', 'Princípios fundamentais de design de interfaces e experiência do usuário.', 'sincrono', 20, '2025-05-20', '2025-06-20', 'planeado', true, 4, 4, 4, 'uploads/cursos/uiux-design-para-iniciantes/capa.png', 'uploads/cursos/uiux-design-para-iniciantes'),
  ('Introdução a Investimentos', 'Aprenda os fundamentos para começar a investir.', 'assincrono', NULL, '2025-06-15', '2025-09-15', 'planeado', true, 6, 12, 7, 'uploads/cursos/introducao-a-investimentos/capa.png', 'uploads/cursos/introducao-a-investimentos'),
  ('Contabilidade para Pequenos Negócios', 'Princípios contábeis para empreendedores.', 'sincrono', 15, '2025-07-10', '2025-08-20', 'planeado', true, 5, 13, 7, 'uploads/cursos/contabilidade-para-pequenos-negocios/capa.png', 'uploads/cursos/contabilidade-para-pequenos-negocios'),
  ('Meditação para o Dia a Dia', 'Técnicas de meditação para reduzir o estresse e aumentar o bem-estar.', 'assincrono', NULL, '2025-05-01', '2025-07-31', 'planeado', true, 7, 14, 8, 'uploads/cursos/meditacao-para-o-dia-a-dia/capa.png', 'uploads/cursos/meditacao-para-o-dia-a-dia'),
  ('Curso de Inteligência Artificial', 'Introdução às principais técnicas e aplicações da Inteligência Artificial.', 'sincrono', 30, '2025-06-01', '2025-09-01', 'planeado', true, 6, 9, 6, 'uploads/cursos/curso-de-inteligencia-artificial/capa.png', 'uploads/cursos/curso-de-inteligencia-artificial'),
  ('Curso de Robótica Avançada', 'Aprenda a construir e programar sistemas robóticos complexos.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 7, 9, 6, 'uploads/cursos/curso-de-robotica-avancada/capa.png', 'uploads/cursos/curso-de-robotica-avancada'),
  ('Curso de Marketing Digital', 'Domine as estratégias de marketing para o mundo digital.', 'sincrono', 25, '2025-06-01', '2025-09-01', 'planeado', true, 5, 6, 5, 'uploads/cursos/curso-de-marketing-digital/capa.png', 'uploads/cursos/curso-de-marketing-digital'),
  ('Curso de Desenvolvimento Web', 'Construa websites modernos e responsivos.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 6, 1, 1, 'uploads/cursos/curso-de-desenvolvimento-web/capa.png', 'uploads/cursos/curso-de-desenvolvimento-web'),
  ('Curso de Cibersegurança', 'Proteja sistemas e redes contra ameaças digitais.', 'sincrono', 20, '2025-06-01', '2025-09-01', 'planeado', true, 7, 7, 5, 'uploads/cursos/curso-de-ciberseguranca/capa.png', 'uploads/cursos/curso-de-ciberseguranca'),
  ('Curso de Engenharia de Software', 'Aprenda a desenvolver e gerir grandes projetos de software.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 5, 10, 6, 'uploads/cursos/curso-de-engenharia-de-software/capa.png', 'uploads/cursos/curso-de-engenharia-de-software'),
  ('Curso de Gestão de Projetos', 'Planeamento, execução e entrega de projetos eficazes.', 'sincrono', 18, '2025-06-01', '2025-09-01', 'planeado', true, 6, 3, 3, 'uploads/cursos/curso-de-gestao-de-projetos/capa.png', 'uploads/cursos/curso-de-gestao-de-projetos'),
  ('Curso de Machine Learning', 'Descubra como ensinar máquinas a aprenderem com dados.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 7, 9, 6, 'uploads/cursos/curso-de-machine-learning/capa.png', 'uploads/cursos/curso-de-machine-learning'),
  ('Curso de Big Data', 'Análise de grandes volumes de dados para tomada de decisões.', 'sincrono', 22, '2025-06-01', '2025-09-01', 'planeado', true, 5, 9, 6, 'uploads/cursos/curso-de-big-data/capa.png', 'uploads/cursos/curso-de-big-data'),
  ('Curso de Realidade Virtual', 'Criação de experiências imersivas em realidade virtual.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 6, 4, 4, 'uploads/cursos/curso-de-realidade-virtual/capa.png', 'uploads/cursos/curso-de-realidade-virtual'),
  ('Curso de Engenharia Mecânica', 'Fundamentos e aplicações práticas da engenharia mecânica.', 'sincrono', 35, '2025-06-01', '2025-09-01', 'planeado', true, 7, 1, 1, 'uploads/cursos/curso-de-engenharia-mecanica/capa.png', 'uploads/cursos/curso-de-engenharia-mecanica'),
  ('Curso Extra 50', 'Curso adicional para reforçar conhecimentos técnicos variados.', 'assincrono', NULL, '2025-06-01', '2025-09-01', 'planeado', true, 5, 2, 2, 'uploads/cursos/curso-extra-50/capa.png', 'uploads/cursos/curso-extra-50'),
  ('Nutrição Funcional', 'Princípios da nutrição funcional para uma vida mais saudável.', 'assincrono', NULL, '2025-07-01', '2025-10-01', 'planeado', true, 2, 15, 8, 'uploads/cursos/nutricao-funcional/capa.png', 'uploads/cursos/nutricao-funcional');

-- =============================================
-- 11. ASSOCIAÇÃO DE CURSOS
-- =============================================
INSERT INTO associar_cursos (id_curso_origem, id_curso_destino, descricao, created_at, updated_at)
VALUES
  (4, 6, 'JavaScript é um pré-requisito para React Native', NOW(), NOW()),
  (5, 13, 'Este curso é uma boa preparação para Inteligência Artificial', NOW(), NOW()),
  (15, 17, 'Marketing Digital tem sinergia com Engenharia de Software', NOW(), NOW());

-- =============================================
-- 12. OCORRÊNCIAS DE CURSOS
-- =============================================
INSERT INTO ocorrencias_cursos (id_curso_original, id_curso_nova_ocorrencia, data_criacao, numero_edicao)
VALUES
  (1, 16, NOW(), 2),
  (5, 13, NOW(), 2);

-- =============================================
-- 13. TÓPICOS DOS CURSOS
-- =============================================

-- Tópicos para o curso de Vue.js
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
VALUES
  ('Introdução', 1, 1, true, NULL),
  ('Fundamentos', 1, 2, true, NULL),
  ('Componentes', 1, 3, true, NULL),
  ('Avaliação', 1, 4, true, NULL);

-- Tópicos para o curso de Comunicação Assertiva
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
VALUES
  ('Fundamentos da Comunicação', 2, 1, true, NULL),
  ('Técnicas de Assertividade', 2, 2, true, NULL),
  ('Prática e Exercícios', 2, 3, true, NULL);

-- Tópicos para o curso de Gestão de Equipas Ágeis
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
VALUES
  ('Introdução às Metodologias Ágeis', 3, 1, true, NULL),
  ('Scrum', 3, 2, true, NULL),
  ('Kanban', 3, 3, true, NULL),
  ('Liderança Ágil', 3, 4, true, NULL);

-- Tópicos para o curso de Python para Análise de Dados
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
VALUES
  ('Introdução ao Python', 5, 1, true, NULL),
  ('Manipulação de Dados com Pandas', 5, 2, true, NULL),
  ('Visualização de Dados', 5, 3, true, NULL),
  ('Análise Estatística', 5, 4, true, NULL),
  ('Projeto Final', 5, 5, true, NULL);

-- Tópicos para o curso React Native
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path)
VALUES
  ('Fundamentos de React Native', 4, 1, true, NULL),
  ('Componentes e Navegação', 4, 2, true, NULL),
  ('Integração com APIs', 4, 3, true, NULL),
  ('Armazenamento e Persistência', 4, 4, true, NULL),
  ('Publicação nas Lojas', 4, 5, true, NULL);

-- =============================================
-- 14. PASTAS DOS TÓPICOS
-- =============================================

-- Pastas para o tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Instalação', 1, 1, true, NULL),
  ('Primeiros Passos', 1, 2, true, NULL);

-- Pastas para o tópico 'Fundamentos' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Sintaxe Básica', 2, 1, true, NULL),
  ('Data Binding', 2, 2, true, NULL),
  ('Ciclo de Vida', 2, 3, true, NULL);

-- Pastas para o tópico 'Componentes' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Componentes Básicos', 3, 1, true, NULL),
  ('Comunicação entre Componentes', 3, 2, true, NULL);

-- Pastas para o tópico 'Avaliação' do curso Vue.js
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Projeto Final', 4, 1, true, NULL),
  ('Questionário', 4, 2, true, NULL);

-- Pastas para o tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Conceitos Básicos', 5, 1, true, NULL),
  ('Barreiras na Comunicação', 5, 2, true, NULL);

-- Pastas para o tópico 'Introdução ao Python'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Instalação e Configuração', 14, 1, true, NULL),
  ('Sintaxe Básica', 14, 2, true, NULL),
  ('Estruturas de Dados', 14, 3, true, NULL);

-- Pastas para o tópico 'Manipulação de Dados com Pandas'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Introdução ao Pandas', 15, 1, true, NULL),
  ('Importação e Exportação de Dados', 15, 2, true, NULL),
  ('Transformação de Dados', 15, 3, true, NULL);

-- Pastas para o tópico 'Fundamentos de React Native'
INSERT INTO curso_topico_pasta (nome, id_topico, ordem, ativo, arquivo_path)
VALUES
  ('Configuração do Ambiente', 20, 1, true, NULL),
  ('JSX e Componentes', 20, 2, true, NULL),
  ('Estilização', 20, 3, true, NULL);

-- =============================================
-- 15. CONTEÚDOS DAS PASTAS
-- =============================================

-- Conteúdos para a pasta 'Instalação' do tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('Instalação do Vue.js', 'Como instalar o Vue.js no seu ambiente de desenvolvimento', 'video', 'https://www.youtube.com/watch?v=exemplo-instalacao', NULL, 1, 1, 1, true, NOW()),
  ('Guia de Instalação', 'Documento PDF com passo a passo da instalação', 'file', NULL, 'uploads/cursos/curso-de-vuejs/introducao/instalacao/guia-instalacao.pdf', 1, 1, 2, true, NOW());

-- Conteúdos para a pasta 'Primeiros Passos' do tópico 'Introdução' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('Olá Mundo com Vue.js', 'Criando sua primeira aplicação Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-hello-world', NULL, 2, 1, 1, true, NOW()),
  ('Documentação Oficial', 'Link para a documentação oficial do Vue.js', 'link', 'https://vuejs.org/guide/introduction.html', NULL, 2, 1, 2, true, NOW());

-- Conteúdos para a pasta 'Sintaxe Básica' do tópico 'Fundamentos' do curso Vue.js
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('Sintaxe de Templates', 'Aprendendo a sintaxe básica de templates no Vue.js', 'video', 'https://www.youtube.com/watch?v=exemplo-templates', NULL, 3, 1, 1, true, NOW());

-- Conteúdos para a pasta 'Conceitos Básicos' do tópico 'Fundamentos da Comunicação' do curso Comunicação Assertiva
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('O que é Comunicação Assertiva?', 'Introdução aos conceitos de comunicação assertiva', 'video', 'https://www.youtube.com/watch?v=exemplo-comunicacao-assertiva', NULL, 11, 2, 1, true, NOW()),
  ('Manual de Comunicação Assertiva', 'Documento com os principais conceitos e técnicas', 'file', NULL, 'uploads/cursos/comunicacao-assertiva/fundamentos-da-comunicacao/conceitos-basicos/manual-comunicacao-assertiva.pdf', 11, 2, 2, true, NOW());

-- Conteúdos para a pasta 'Instalação e Configuração' do Python
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('Instalação do Python e Anaconda', 'Guia passo a passo para instalar Python e o ambiente Anaconda', 'video', 'https://www.youtube.com/watch?v=exemplo-instalacao-python', NULL, 16, 5, 1, true, NOW()),
  ('Configuração do Ambiente Virtual', 'Como configurar ambientes virtuais para seus projetos', 'file', NULL, 'uploads/cursos/python-para-analise-de-dados/introducao-ao-python/instalacao-e-configuracao/guia-ambiente-virtual-python.pdf', 16, 5, 2, true, NOW()),
  ('Introdução ao Jupyter Notebook', 'Como usar o Jupyter Notebook para análise de dados', 'video', 'https://www.youtube.com/watch?v=exemplo-jupyter', NULL, 16, 5, 3, true, NOW());

-- Conteúdos para a pasta 'Sintaxe Básica' do Python
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, ordem, ativo, data_criacao)
VALUES
  ('Variáveis e Tipos de Dados', 'Fundamentos de variáveis e tipos de dados em Python', 'video', 'https://www.youtube.com/watch?v=exemplo-variaveis-python', NULL, 17, 5, 1, true, NOW()),
  ('Estruturas de Controle', 'Loops e condicionais em Python', 'file', NULL, 'uploads/cursos/python-para-analise-de-dados/introducao-ao-python/sintaxe-basica/estruturas-controle-python.pdf', 17, 5, 2, true, NOW());

-- =============================================
-- 16. TIPOS DE CONTEÚDO
-- =============================================
INSERT INTO tipos_conteudo (nome, icone, descricao, ativo)
VALUES
  ('PDF', 'file-pdf', 'Documento em formato PDF', true),
  ('Vídeo', 'video', 'Conteúdo em formato de vídeo', true),
  ('Apresentação', 'presentation', 'Slides de apresentação', true),
  ('Link', 'link', 'Link para recurso externo', true),
  ('Exercício', 'exercise', 'Exercício prático', true);

-- =============================================
-- 17. INSCRIÇÕES EM CURSOS
-- =============================================

-- Inscrições no curso de Vue.js
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (8, 1, NOW(), 'inscrito', NULL, NULL),
  (9, 1, NOW() - INTERVAL '5 DAY', 'inscrito', 'Quero aprimorar minhas habilidades em desenvolvimento web front-end.', 'Espero aprender a construir aplicações web modernas e responsivas.'),
  (10, 1, NOW() - INTERVAL '4 DAY', 'inscrito', 'Preciso de conhecimento em Vue.js para um projeto no trabalho.', 'Quero aplicar o conhecimento em projetos reais da minha empresa.'),
  (11, 1, NOW() - INTERVAL '3 DAY', 'inscrito', 'Estou migrando de Angular para Vue e preciso me adaptar.', 'Espero entender as diferenças e vantagens em relação ao Angular.'),
  (3, 1, NOW() - INTERVAL '2 DAY', 'inscrito', 'Preocupado com a segurança das aplicações que desenvolvo.', 'Quero aprender a identificar e corrigir vulnerabilidades comuns em aplicações web.');

-- Inscrições no curso de Comunicação Assertiva
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (8, 2, NOW(), 'inscrito', NULL, NULL),
  (12, 2, NOW() - INTERVAL '6 DAY', 'inscrito', 'Quero melhorar minhas habilidades de comunicação no ambiente corporativo.', 'Espero me tornar mais eficaz nas reuniões e apresentações.'),
  (13, 2, NOW() - INTERVAL '5 DAY', 'inscrito', 'Acredito que melhorar minha comunicação será essencial para avançar na carreira.', 'Quero aprender técnicas práticas para situações reais de trabalho.');

-- Inscrições em Gestão de Equipas Ágeis
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado)
VALUES
  (8, 3, NOW() - INTERVAL '7 days', 'inscrito');

INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (14, 3, NOW() - INTERVAL '7 DAY', 'inscrito', 'Fui promovido a líder de equipe e preciso aprender metodologias ágeis.', 'Gostaria de implementar Scrum e Kanban no meu time.'),
  (15, 3, NOW() - INTERVAL '6 DAY', 'inscrito', 'Minha empresa está adotando metodologias ágeis e preciso me adaptar.', 'Quero entender os princípios ágeis e como aplicá-los no dia a dia.');

-- Inscrições em Python para Análise de Dados
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (9, 5, NOW() - INTERVAL '2 DAY', 'inscrito', 'Quero aprender a analisar grandes volumes de dados com Python.', 'Espero dominar pandas, numpy e visualização de dados.'),
  (10, 5, NOW() - INTERVAL '3 DAY', 'inscrito', 'Trabalho com análise de dados e quero automatizar meus processos.', 'Quero aprender a criar scripts eficientes para tratamento de dados.'),
  (13, 5, NOW() - INTERVAL '1 DAY', 'inscrito', 'Estou em transição de carreira para ciência de dados.', 'Quero me preparar para o mercado de trabalho em análise de dados.');

-- Inscrições em React Native
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (11, 4, NOW() - INTERVAL '4 DAY', 'inscrito', 'Quero expandir meu conhecimento para desenvolvimento mobile.', 'Espero construir aplicativos completos ao final do curso.'),
  (12, 4, NOW() - INTERVAL '3 DAY', 'inscrito', 'Tenho uma ideia de aplicativo e quero aprender a desenvolvê-lo.', 'Quero publicar meu aplicativo nas lojas após o curso.');

-- Inscrições em UI/UX Design
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (15, 9, NOW() - INTERVAL '5 DAY', 'inscrito', 'Sou desenvolvedor e quero entender melhor o lado de design.', 'Espero criar interfaces mais intuitivas nos meus projetos.'),
  (14, 9, NOW() - INTERVAL '2 DAY', 'inscrito', 'Quero mudar de carreira para design de interfaces.', 'Espero construir um portfólio inicial durante o curso.');

-- Inscrições em Introdução a Investimentos
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (13, 10, NOW() - INTERVAL '1 DAY', 'inscrito', 'Quero começar a investir meu dinheiro de forma consciente.', 'Espero entender os diferentes tipos de investimentos e riscos.'),
  (9, 10, NOW(), 'inscrito', 'Preciso organizar minha vida financeira e começar a investir.', 'Quero criar um plano de investimentos para meu futuro.');

-- =============================================
-- 18. INSCRIÇÃO CANCELADA (EXEMPLO)
-- =============================================
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, data_cancelamento, motivo_cancelamento)
VALUES
  (11, 10, NOW() - INTERVAL '10 DAY', 'cancelado', NOW() - INTERVAL '2 DAY', 'Conflito de horários com outro curso.');

-- =============================================
-- 19. QUIZZES E PERGUNTAS
-- =============================================

-- Quiz para o curso de Vue.js
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
VALUES
  (1, 'Quiz de Avaliação Final - Vue.js', 'Avaliação sobre os conceitos aprendidos no curso', NOW(), 60, true);

-- Perguntas para o quiz de Vue.js
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
VALUES
  (1, 'Qual é a diretiva correta para criar um binding bidirecional no Vue.js?', 'multipla_escolha', 2, 1),
  (1, 'O Vue.js é um framework progressivo para construção de interfaces de usuário.', 'verdadeiro_falso', 1, 2);

-- Opções para a primeira pergunta do quiz de Vue.js
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (1, 'v-model', true, 1),
  (1, 'v-bind', false, 2),
  (1, 'v-two-way', false, 3),
  (1, 'v-sync', false, 4);

-- Opções para a segunda pergunta do quiz de Vue.js
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (2, 'Verdadeiro', true, 1),
  (2, 'Falso', false, 2);

-- Quiz para o curso de Python
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
VALUES
  (5, 'Avaliação de Fundamentos Python', 'Teste seus conhecimentos de Python básico', NOW(), 45, true);

-- Perguntas para o quiz de Python
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
VALUES
  (2, 'Qual é a função usada para obter o comprimento de uma lista em Python?', 'multipla_escolha', 2, 1),
  (2, 'Em Python, as listas são imutáveis.', 'verdadeiro_falso', 1, 2),
  (2, 'Qual o resultado da expressão: 3 * "Python"?', 'multipla_escolha', 2, 3);

-- Opções para as perguntas do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (3, 'len()', true, 1),
  (3, 'size()', false, 2),
  (3, 'length()', false, 3),
  (3, 'count()', false, 4);

-- Opções para a segunda pergunta do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (4, 'Verdadeiro', false, 1),
  (4, 'Falso', true, 2);

-- Opções para a terceira pergunta do quiz de Python
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (5, 'Python Python Python', true, 1),
  (5, 'PythonPythonPython', false, 2),
  (5, 'Error', false, 3),
  (5, '9', false, 4);

-- Quiz para o curso de React Native
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
VALUES
  (4, 'Avaliação de React Native', 'Teste seus conhecimentos fundamentais de React Native', NOW(), 60, true);

-- Perguntas para o quiz de React Native
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
VALUES
  (3, 'Qual comando é usado para iniciar um novo projeto React Native com Expo?', 'multipla_escolha', 2, 1),
  (3, 'React Native compila para código nativo em cada plataforma.', 'verdadeiro_falso', 1, 2),
  (3, 'Qual é o componente equivalente a <div> do HTML no React Native?', 'multipla_escolha', 2, 3);

-- Opções para as perguntas do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (6, 'expo init MyApp', true, 1),
  (6, 'create-react-native-app MyApp', false, 2),
  (6, 'react-native init MyApp', false, 3),
  (6, 'npm create react-native MyApp', false, 4);

-- Opções para a segunda pergunta do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (7, 'Verdadeiro', true, 1),
  (7, 'Falso', false, 2);

-- Opções para a terceira pergunta do quiz de React Native
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (8, 'View', true, 1),
  (8, 'Container', false, 2),
  (8, 'Div', false, 3),
  (8, 'Block', false, 4);

-- =============================================
-- 20. RESPOSTAS AOS QUIZZES
-- =============================================
INSERT INTO quiz_respostas (id_inscricao, id_quiz, data_inicio, data_conclusao, nota, completo)
VALUES
  (1, 1, NOW() - INTERVAL '2 DAY', NOW() - INTERVAL '2 DAY' + INTERVAL '45 MINUTE', 8.5, true),
  (2, 1, NOW() - INTERVAL '1 DAY', NOW() - INTERVAL '1 DAY' + INTERVAL '30 MINUTE', 10.0, true);

-- Detalhes das respostas para a primeira tentativa
INSERT INTO quiz_respostas_detalhes (id_resposta, id_pergunta, id_opcao, correta, pontos_obtidos)
VALUES
  (1, 1, 1, true, 2),  -- Resposta correta para a primeira pergunta
  (1, 2, 2, false, 0);  -- Resposta errada para a segunda pergunta

-- Detalhes das respostas para a segunda tentativa
INSERT INTO quiz_respostas_detalhes (id_resposta, id_pergunta, id_opcao, correta, pontos_obtidos)
VALUES
  (2, 1, 1, true, 2),  -- Resposta correta para a primeira pergunta
  (2, 2, 1, true, 1);  -- Resposta correta para a segunda pergunta

-- =============================================
-- 21. TOPICOS DE FORUM
-- =============================================
INSERT INTO topicos (id_categoria, id_area, id_criador, titulo, descricao, dataCriacao, ativo)
VALUES
  (1, 1, 4, 'Dúvidas sobre instalação do Vue.js', 'Estou tendo problemas para instalar o Vue.js no Windows 11', NOW(), true),
  (6, 9, 7, 'Melhores práticas em Python para análise de dados', 'Gostaria de compartilhar técnicas otimizadas', NOW() - INTERVAL '2 DAY', true),
  (5, 8, 5, 'Estratégias para Instagram em 2025', 'Quais estratégias estão funcionando melhor este ano?', NOW() - INTERVAL '5 DAY', true);

-- =============================================
-- 22. TÓPICOS POR CATEGORIA
-- =============================================
INSERT INTO topicos_categorias (id_categoria, titulo, descricao, criado_por, data_criacao)
VALUES
  (1, 'Como começar com React?', 'Discussão sobre primeiros passos com React.', 4, NOW()),
  (2, 'Empatia no ambiente de trabalho', 'Reflexões e estratégias para cultivar empatia.', 4, NOW()),
  (6, 'Melhores práticas em Python', 'Discutindo boas práticas de codificação em Python', 7, NOW()),
  (5, 'Estratégias de marketing para pequenos negócios', 'Compartilhando estratégias eficientes para empresas com orçamento limitado', 5, NOW()),
  (4, 'Tendências de UI/UX para 2025', 'Quais serão as principais tendências em design de interfaces no próximo ano?', 4, NOW()),
  (7, 'Investimentos para iniciantes', 'Por onde começar a jornada de investimentos com pouco capital', 6, NOW());

-- =============================================
-- 23. COMENTÁRIOS NOS TÓPICOS
-- =============================================
INSERT INTO comentarios_topico (id_topico, id_utilizador, texto, data_criacao)
VALUES
  (1, 4, 'Essa é uma ótima questão! Para começar com React, recomendo a documentação oficial e alguns tutoriais.', NOW()),
  (1, 8, 'Obrigado pelas dicas! Vou começar a estudar hoje mesmo.', NOW() + INTERVAL '1 hour'),
  (1, 11, 'Estou tendo dificuldades para entender os hooks no React. Alguém poderia explicar de forma mais simples?', NOW() - INTERVAL '3 DAY'),
  (2, 12, 'Como vocês praticam empatia no ambiente de trabalho remoto? Tenho achado desafiador sem a interação presencial.', NOW() - INTERVAL '5 DAY'),
  (2, 5, 'Uma técnica que uso é fazer check-ins emocionais no início das reuniões. Perguntar como as pessoas estão se sentindo realmente, não só profissionalmente.', NOW() - INTERVAL '4 DAY');

-- =============================================
-- 24. CHAT MENSAGENS
-- =============================================
INSERT INTO chat_mensagens (id_topico, id_usuario, texto, dataCriacao)
VALUES
  (1, 4, 'Olá a todos! Bem-vindos à discussão sobre React.', NOW() - INTERVAL '1 DAY'),
  (1, 8, 'Olá! Estou iniciando agora com React, alguém tem dicas?', NOW() - INTERVAL '1 DAY' + INTERVAL '30 MINUTE'),
  (1, 4, 'Recomendo começar com os tutoriais oficiais e praticar com pequenos projetos.', NOW() - INTERVAL '1 DAY' + INTERVAL '45 MINUTE'),
  (2, 5, 'A empatia é fundamental para um ambiente de trabalho saudável!', NOW() - INTERVAL '2 DAY'),
  (2, 12, 'Concordo! Temos praticado muito isso na minha equipe. Vejo resultados incríveis.', NOW() - INTERVAL '2 DAY' + INTERVAL '2 HOUR');

-- =============================================
-- 25. TRABALHOS ENTREGUES
-- =============================================
INSERT INTO trabalhos_entregues (id_inscricao, ficheiro_path, data_entrega, avaliacao)
VALUES
  (2, 'uploads/trabalhos/joao_silva_vue_projeto_final.zip', NOW() - INTERVAL '1 DAY', 'Excelente trabalho! Implementação limpa e bem documentada.'),
  (3, 'uploads/trabalhos/ana_martins_vue_projeto_final.zip', NOW() - INTERVAL '2 DAY', 'Bom trabalho, mas faltou implementar algumas funcionalidades solicitadas.'),
  (15, 'uploads/trabalhos/luis_rodrigues_equipes_ageis_caso.pdf', NOW() - INTERVAL '3 DAY', NULL);

-- =============================================
-- 26. AVALIAÇÕES
-- =============================================
INSERT INTO avaliacoes (id_avaliacao, id_inscricao, nota, certificado, horas_totais, horas_presenca, data_avaliacao, url_certificado)
VALUES
  (1, 2, 9.5, true, 40, 38, NOW() - INTERVAL '1 DAY', 'uploads/certificados/joao_silva_vuejs_certificado.pdf'),
  (2, 3, 8.0, true, 40, 35, NOW() - INTERVAL '1 DAY', 'uploads/certificados/ana_martins_vuejs_certificado.pdf'),
  (3, 9, 7.5, true, 30, 28, NOW() - INTERVAL '2 DAY', 'uploads/certificados/pedro_costa_python_certificado.pdf');

-- =============================================
-- 27. NOTIFICAÇÕES
-- =============================================
INSERT INTO notificacoes (titulo, mensagem, tipo, id_referencia, data_criacao, enviado_email)
VALUES
  ('Novo Curso Disponível', 'O curso "Python para Análise de Dados" já está disponível para inscrições.', 'curso_adicionado', 5, NOW() - INTERVAL '5 DAY', true),
  ('Formador Alterado', 'O formador do curso "Comunicação Assertiva" foi alterado.', 'formador_alterado', 2, NOW() - INTERVAL '3 DAY', true),
  ('Novo Formador', 'Um novo formador foi adicionado à plataforma.', 'formador_criado', 7, NOW() - INTERVAL '7 DAY', true);

-- =============================================
-- 28. NOTIFICAÇÕES DE UTILIZADORES
-- =============================================
INSERT INTO notificacoes_utilizadores (id_notificacao, id_utilizador, lida, data_leitura)
VALUES
  (1, 8, true, NOW() - INTERVAL '4 DAY'),
  (1, 9, true, NOW() - INTERVAL '4 DAY' + INTERVAL '2 HOUR'),
  (1, 10, false, NULL),
  (2, 8, true, NOW() - INTERVAL '2 DAY'),
  (2, 9, false, NULL),
  (3, 4, true, NOW() - INTERVAL '6 DAY'),
  (3, 5, true, NOW() - INTERVAL '6 DAY' + INTERVAL '3 HOUR');