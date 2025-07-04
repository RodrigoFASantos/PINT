-- =============================================
-- 1. CARGOS
-- =============================================
INSERT INTO cargos (id_cargo, descricao)
VALUES
  (1, 'Administrador'),
  (2, 'Formador'),
  (3, 'Formando');

-- =============================================
-- 2. CATEGORIAS
-- =============================================
INSERT INTO categorias (nome)
VALUES
  ('Programação'),
  ('Design'),
  ('Marketing Digital'),
  ('Gestão de Projetos'),
  ('Desenvolvimento Pessoal'),
  ('Agricultura');

-- =============================================
-- 3. TIPOS DE CONTEÚDO
-- =============================================
INSERT INTO tipos_conteudo (nome, icone, descricao, ativo)
VALUES
  ('Vídeo', 'video-icon', 'Vídeos e aulas gravadas', TRUE),
  ('Documento', 'document-icon', 'Documentos e materiais de leitura', TRUE),
  ('Quiz', 'quiz-icon', 'Questionários e avaliações', TRUE),
  ('Link', 'link-icon', 'Links para recursos externos', TRUE),
  ('Apresentação', 'presentation-icon', 'Slides e apresentações', TRUE);

-- =============================================
-- 4. ÁREAS
-- =============================================
INSERT INTO areas (nome, id_categoria)
VALUES
  ('Desenvolvimento Web', 1),
  ('Desenvolvimento Mobile', 1),
  ('Inteligência Artificial', 1),
  ('UX/UI Design', 2),
  ('Design Gráfico', 2),
  ('SEO', 3),
  ('Social Media', 3),
  ('Gestão Ágil', 4),
  ('Liderança', 5),
  ('Comunicação Eficaz', 5),
  ('Técnicas Agrícolas', 6);

-- =============================================
-- 5. UTILIZADORES
-- =============================================
INSERT INTO utilizadores (id_cargo, nome, idade, email, telefone, password, primeiro_login, foto_perfil, foto_capa)
VALUES
  -- Administradores
  (1, 'Formador Rodrigo', 25, 'ro@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/ro_at_gmail_com/ro@gmail.com_AVATAR.png', 'uploads/users/ro_at_gmail_com/ro@gmail.com_CAPA.png'),
  (1, 'Formador Rareura', 25, 'fe@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/fe_at_gmail_com/fe@gmail.com_AVATAR.png', 'uploads/users/fe_at_gmail_com/fe@gmail.com_CAPA.png'),
  (1, 'Administrador', 35, 'admin@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'AVATAR.png', 'CAPA.png'),
  
  -- Formadores
  (2, 'Formador', 40, 'a@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 1, 'uploads/users/a_at_gmail_com/a@gmail.com_AVATAR.png', 'uploads/users/a_at_gmail_com/a@gmail.com_CAPA.png'),
  (2, 'Carla Pereira', 38, 'carla@gmail.com', '923456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/carla_at_gmail_com/carla@gmail.com_AVATAR.png', 'uploads/users/carla_at_gmail_com/carla@gmail.com_CAPA.png'),
  (2, 'Miguel Santos', 42, 'miguel@gmail.com', '933456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/miguel_at_gmail_com/miguel@gmail.com_AVATAR.png', 'uploads/users/miguel_at_gmail_com/miguel@gmail.com_CAPA.png'),
  (2, 'Sara Oliveira', 35, 'sara@gmail.com', '943456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/sara_at_gmail_com/sara@gmail.com_AVATAR.png', 'uploads/users/sara_at_gmail_com/sara@gmail.com_CAPA.png'),
  
  -- Formandos
  (3, 'Formando', 25, 'b@gmail.com', '123456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/b_at_gmail_com/b@gmail.com_AVATAR.png', 'uploads/users/b_at_gmail_com/b@gmail.com_CAPA.png'),
  (3, 'João Silva', 28, 'joao@gmail.com', '953456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/joao_at_gmail_com/joao@gmail.com_AVATAR.png', 'uploads/users/joao_at_gmail_com/joao@gmail.com_CAPA.png'),
  (3, 'Ana Martins', 24, 'ana@gmail.com', '963456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/ana_at_gmail_com/ana@gmail.com_AVATAR.png', 'uploads/users/ana_at_gmail_com/ana@gmail.com_CAPA.png'),
  (3, 'Pedro Costa', 31, 'pedro@gmail.com', '973456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/pedro_at_gmail_com/pedro@gmail.com_AVATAR.png', 'uploads/users/pedro_at_gmail_com/pedro@gmail.com_CAPA.png'),
  (3, 'Sofia Nunes', 26, 'sofia@gmail.com', '983456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/sofia_at_gmail_com/sofia@gmail.com_AVATAR.png', 'uploads/users/sofia_at_gmail_com/sofia@gmail.com_CAPA.png'),
  (3, 'Ricardo Ferreira', 29, 'ricardo@gmail.com', '993456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/ricardo_at_gmail_com/ricardo@gmail.com_AVATAR.png', 'uploads/users/ricardo_at_gmail_com/ricardo@gmail.com_CAPA.png'),
  (3, 'Mariana Lopes', 27, 'mariana@gmail.com', '913456789', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/mariana_at_gmail_com/mariana@gmail.com_AVATAR.png', 'uploads/users/mariana_at_gmail_com/mariana@gmail.com_CAPA.png'),
  (3, 'Luís Rodrigues', 33, 'luis@gmail.com', '913456788', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 0, 'uploads/users/luis_at_gmail_com/luis@gmail.com_AVATAR.png', 'uploads/users/luis_at_gmail_com/luis@gmail.com_CAPA.png');

-- =============================================
-- 6. USER PENDENTES
-- =============================================
INSERT INTO "User_Pendente" (id_cargo, nome, idade, email, telefone, password, token, expires_at, created_at, updated_at)
VALUES
  (2, 'Formador Pendente', 30, 'pendente@gmail.com', '987654321', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 'token123', NOW() + INTERVAL '24 hours', NOW(), NOW()),
  (3, 'Formando Pendente', 25, 'pendente2@gmail.com', '987654322', '$2b$10$.9k7z4T4HyciRcEYa6/0Xu/adc/fXdr1pui5EvCDu97KLTY5V1/jO', 'token456', NOW() + INTERVAL '24 hours', NOW(), NOW());

-- =============================================
-- 7. FORMADOR_ASSOCIACOES_PENDENTES
-- =============================================
INSERT INTO formador_associacoes_pendentes (id_pendente, categorias, areas, cursos, created_at)
VALUES
  (1, '[1, 2]', '[1, 3]', '[]', NOW());

-- =============================================
-- 8. FORMADOR_CATEGORIA
-- =============================================
INSERT INTO formador_categoria (id_formador, id_categoria, data_associacao)
VALUES
  (4, 1, NOW()), -- Formador com Programação
  (5, 2, NOW()), -- Carla com Design
  (6, 3, NOW()), -- Miguel com Marketing Digital
  (7, 4, NOW()), -- Sara com Gestão de Projetos
  (4, 5, NOW()); -- Formador também com Desenvolvimento Pessoal

-- =============================================
-- 9. FORMADOR_AREA
-- =============================================
INSERT INTO formador_area (id_formador, id_area, data_associacao)
VALUES
  (4, 1, NOW()), -- Formador com Dev Web
  (4, 2, NOW()), -- Formador com Dev Mobile
  (5, 4, NOW()), -- Carla com UX/UI
  (6, 6, NOW()), -- Miguel com SEO
  (7, 8, NOW()), -- Sara com Gestão Ágil
  (4, 11, NOW()); -- ← Formador também com Técnicas Agrícolas

-- =============================================
-- 10. PUSH_SUBSCRIPTIONS
-- =============================================
INSERT INTO push_subscriptions (id_utilizador, endpoint, p256dh, auth, created_at)
VALUES
  (8, 'https://fcm.googleapis.com/fcm/send/example-endpoint-1', 'base64-encoded-p256dh-key-1', 'base64-encoded-auth-secret-1', NOW()),
  (9, 'https://fcm.googleapis.com/fcm/send/example-endpoint-2', 'base64-encoded-p256dh-key-2', 'base64-encoded-auth-secret-2', NOW());

-- =============================================
-- 11. TOPICO_AREA
-- =============================================
INSERT INTO topico_area (id_categoria, id_area, titulo, descricao, criado_por, data_criacao, ativo)
VALUES
  (1, 1, 'JavaScript Moderno', 'Discussões sobre JavaScript ES6+', 1, NOW(), TRUE),
  (1, 2, 'Desenvolvimento React Native', 'Tópicos sobre desenvolvimento mobile com React Native', 4, NOW(), TRUE),
  (2, 4, 'Princípios de UX/UI', 'Discussões sobre experiência do utilizador e interface', 5, NOW(), TRUE),
  (3, 6, 'Estratégias SEO 2025', 'Técnicas de otimização para mecanismos de busca', 6, NOW(), TRUE),
  (4, 8, 'Metodologias Ágeis', 'Discussões sobre Scrum, Kanban e outras metodologias ágeis', 7, NOW(), TRUE),
  (6, 11, 'Práticas Agrícolas Sustentáveis', 'Discussões sobre agricultura moderna e sustentável', 1, NOW(), TRUE);


-- =============================================
-- 12. NOTIFICACOES
-- =============================================
INSERT INTO notificacoes (titulo, mensagem, tipo, id_referencia, data_criacao, enviado_email)
VALUES
  ('Novo curso disponível', 'Um novo curso de JavaScript foi adicionado', 'curso_adicionado', 1, NOW(), FALSE),
  ('Alteração de formador', 'O formador do curso de React Native foi alterado', 'formador_alterado', 2, NOW(), TRUE),
  ('Nova conta de formador', 'Um novo formador foi registrado na plataforma', 'formador_criado', 6, NOW(), TRUE);

-- =============================================
-- 13. CURSO
-- =============================================
INSERT INTO curso (nome, descricao, tipo, vagas, duracao, data_inicio, data_fim, estado, ativo, id_formador, id_categoria, id_area, id_topico_area, imagem_path, dir_path)
VALUES
  ('JavaScript Avançado', 'Curso completo de JavaScript moderno', 'assincrono', 20, 40, '2025-06-01', '2025-08-30', 'planeado', TRUE, 4, 1, 1, 1, 'uploads/cursos/javascript_avancado.jpg', 'uploads/cursos/javascript_avancado/'),
  ('React Native do Zero', 'Aprenda a desenvolver apps mobile', 'sincrono', 15, 60, '2025-07-15', '2025-09-30', 'planeado', TRUE, 4, 1, 2, 2, 'uploads/cursos/react_native.jpg', 'uploads/cursos/react_native/'),
  ('Design UX/UI Profissional', 'Princípios e técnicas de design de interface', 'assincrono', 25, 30, '2025-06-15', '2025-08-15', 'planeado', TRUE, 5, 2, 4, 3, 'uploads/cursos/ux_ui.jpg', 'uploads/cursos/ux_ui/'),
  ('SEO Avançado', 'Estratégias de otimização para mecanismos de busca', 'sincrono', 18, 25, '2025-08-01', '2025-10-15', 'planeado', TRUE, 6, 3, 6, 4, 'uploads/cursos/seo.jpg', 'uploads/cursos/seo/'),
  ('Gestão Ágil de Projetos', 'Metodologias ágeis para gerenciamento de projetos', 'sincrono', 20, 45, '2025-07-01', '2025-09-15', 'planeado', TRUE, 7, 4, 8, 5, 'uploads/cursos/agile.jpg', 'uploads/cursos/agile/'),
  ('Curso de agricultura', 'Curso completo sobre técnicas modernas de agricultura', 'sincrono', 50, 100, '2025-01-01', '2025-05-01', 'terminado', TRUE, 4, 6, 11, 6, 'uploads/cursos/agricultura.jpg', 'uploads/cursos/agricultura/');


-- =============================================
-- 14. NOTIFICACOES_UTILIZADORES
-- =============================================
INSERT INTO notificacoes_utilizadores (id_notificacao, id_utilizador, lida, data_leitura)
VALUES
  (1, 8, TRUE, NOW()),
  (1, 9, FALSE, NULL),
  (2, 10, FALSE, NULL),
  (3, 11, TRUE, NOW());

-- =============================================
-- 15. ASSOCIAR_CURSOS
-- =============================================
INSERT INTO associar_cursos (id_curso_origem, id_curso_destino, descricao, created_at, updated_at)
VALUES
  (1, 2, 'O curso de React Native requer conhecimento prévio de JavaScript', NOW(), NOW()),
  (3, 4, 'SEO e UX/UI são complementares para estratégias de marketing digital', NOW(), NOW());

-- =============================================
-- 16. CURSO_TOPICO
-- =============================================
INSERT INTO curso_topico (nome, id_curso, ordem, ativo, arquivo_path, dir_path)
VALUES
  ('Introdução ao JavaScript Moderno', 1, 1, TRUE, NULL, 'uploads/cursos/javascript_avancado/topico1/'),
  ('Conceitos Avançados', 1, 2, TRUE, NULL, 'uploads/cursos/javascript_avancado/topico2/'),
  ('Introdução ao React Native', 2, 1, TRUE, NULL, 'uploads/cursos/react_native/topico1/'),
  ('Componentes e Props', 2, 2, TRUE, NULL, 'uploads/cursos/react_native/topico2/'),
  ('Princípios de UX', 3, 1, TRUE, NULL, 'uploads/cursos/ux_ui/topico1/'),
  ('Pesquisa e Testes de Usabilidade', 3, 2, TRUE, NULL, 'uploads/cursos/ux_ui/topico2/');

-- =============================================
-- 17. QUIZZES
-- =============================================
INSERT INTO quizzes (id_curso, titulo, descricao, data_criacao, tempo_limite, ativo)
VALUES
  (1, 'Avaliação de JavaScript Básico', 'Teste seus conhecimentos em JavaScript', NOW(), 30, TRUE),
  (1, 'Avaliação Final de JavaScript', 'Avaliação final do curso', NOW(), 60, TRUE),
  (2, 'Fundamentos de React Native', 'Teste sobre os fundamentos do React Native', NOW(), 45, TRUE),
  (3, 'Princípios de UX/UI', 'Questionário sobre os princípios de experiência do utilizador', NOW(), 30, TRUE);

-- =============================================
-- 18. OCORRENCIAS_CURSOS
-- =============================================
INSERT INTO ocorrencias_cursos (id_curso_original, id_curso_nova_ocorrencia, data_criacao, numero_edicao)
VALUES
  (1, 1, NOW(), 1); -- Primeira edição do curso

-- =============================================
-- 19. INSCRICOES_CURSOS
-- =============================================
INSERT INTO inscricoes_cursos (id_utilizador, id_curso, data_inscricao, estado, motivacao, expectativas)
VALUES
  (1, 1, NOW(), 'inscrito', 'Inscrição para avaliação do curso como administrador', 'Avaliar a qualidade e estrutura do curso'),
  (1, 2, NOW(), 'inscrito', 'Análise das metodologias de ensino aplicadas', 'Verificar a eficácia do material didático'),
  (8, 1, NOW(), 'inscrito', 'Aprender JavaScript avançado para melhorar habilidades profissionais', 'Espero aprender técnicas modernas de JavaScript'),
  (9, 1, NOW(), 'inscrito', 'Atualização profissional', 'Aprofundar conhecimentos em JavaScript'),
  (10, 2, NOW(), 'inscrito', 'Interesse em desenvolvimento mobile', 'Aprender a criar aplicativos completos'),
  (11, 3, NOW(), 'inscrito', 'Melhorar habilidades de design', 'Criar interfaces mais amigáveis'),
  (12, 4, NOW(), 'inscrito', 'Necessidade profissional', 'Melhorar o posicionamento nos motores de busca'),
  (13, 5, NOW(), 'inscrito', 'Interesse em gestão de projetos', 'Implementar metodologias ágeis na minha equipe'),

    -- INSCRIÇÕES NO CURSO DE AGRICULTURA
  (1, 6, '2024-12-15', 'inscrito', 'Supervisão administrativa do curso', 'Avaliar metodologia aplicada'),
  (2, 6, '2024-12-15', 'inscrito', 'Acompanhamento pedagógico', 'Verificar qualidade do ensino'),
  (3, 6, '2024-12-15', 'inscrito', 'Avaliação do curso como administrador', 'Monitorizar progresso'),
  (4, 6, '2024-12-15', 'inscrito', 'Formador responsável', 'Ministrar conhecimentos agrícolas'),
  (5, 6, '2024-12-15', 'inscrito', 'Interesse em agricultura sustentável', 'Aprender técnicas modernas'),
  (6, 6, '2024-12-15', 'inscrito', 'Aplicação em contexto rural', 'Implementar na propriedade familiar'),
  (7, 6, '2024-12-15', 'inscrito', 'Diversificação profissional', 'Explorar setor agrícola'),
  (8, 6, '2024-12-15', 'inscrito', 'Interesse pessoal', 'Conhecimento sobre agricultura'),
  (9, 6, '2024-12-15', 'inscrito', 'Desenvolvimento rural', 'Melhorar técnicas locais'),
  (10, 6, '2024-12-15', 'inscrito', 'Sustentabilidade ambiental', 'Práticas eco-friendly'),
  (11, 6, '2024-12-15', 'inscrito', 'Projeto de horta comunitária', 'Aplicar na comunidade'),
  (12, 6, '2024-12-15', 'inscrito', 'Transição de carreira', 'Mudar para setor agrícola'),
  (13, 6, '2024-12-15', 'inscrito', 'Complemento formativo', 'Expandir conhecimentos'),
  (14, 6, '2024-12-15', 'inscrito', 'Inovação agrícola', 'Técnicas tecnológicas'),
  (15, 6, '2024-12-15', 'inscrito', 'Produção orgânica', 'Agricultura biológica');

-- =============================================
-- 20. CURSO_TOPICO_PASTA
-- =============================================
INSERT INTO curso_topico_pasta (nome, arquivo_path, id_topico, ordem, ativo)
VALUES
  ('Materiais de Estudo', NULL, 1, 1, TRUE),
  ('Exercícios', NULL, 1, 2, TRUE),
  ('Recursos Adicionais', NULL, 1, 3, TRUE),
  ('Aulas', NULL, 2, 1, TRUE),
  ('Materiais Complementares', NULL, 3, 1, TRUE),
  ('Exemplos Práticos', NULL, 3, 2, TRUE);

-- =============================================
-- 21. QUIZ_PERGUNTAS
-- =============================================
INSERT INTO quiz_perguntas (id_quiz, pergunta, tipo, pontos, ordem)
VALUES
  (1, 'O que é uma closure em JavaScript?', 'multipla_escolha', 5, 1),
  (1, 'Como declarar uma constante em JavaScript moderno?', 'multipla_escolha', 3, 2),
  (1, 'JavaScript é uma linguagem de tipagem estática?', 'verdadeiro_falso', 2, 3),
  (2, 'Explique o conceito de promises em JavaScript', 'resposta_curta', 10, 1),
  (3, 'Qual componente é usado para criar uma lista rolável em React Native?', 'multipla_escolha', 5, 1);

-- =============================================
-- 22. QUIZ_OPCOES
-- =============================================
INSERT INTO quiz_opcoes (id_pergunta, texto, correta, ordem)
VALUES
  (1, 'Uma função que tem acesso ao escopo de uma função externa, mesmo após a função externa ter retornado', TRUE, 1),
  (1, 'Um método para fechar uma conexão com o servidor', FALSE, 2),
  (1, 'Uma técnica para otimizar a performance do código', FALSE, 3),
  (1, 'Uma função que não pode ser modificada após ser definida', FALSE, 4),
  (2, 'const minhaVariavel = valor;', TRUE, 1),
  (2, 'let minhaVariavel = valor;', FALSE, 2),
  (2, 'var minhaVariavel = valor;', FALSE, 3),
  (2, 'constant minhaVariavel = valor;', FALSE, 4),
  (3, 'Verdadeiro', FALSE, 1),
  (3, 'Falso', TRUE, 2),
  (5, 'FlatList', TRUE, 1),
  (5, 'ScrollView', FALSE, 2),
  (5, 'ListView', FALSE, 3),
  (5, 'RecyclerView', FALSE, 4);

-- =============================================
-- 23. QUIZ_RESPOSTAS
-- =============================================
INSERT INTO quiz_respostas (id_inscricao, id_quiz, data_inicio, data_conclusao, nota, completo)
VALUES
  (1, 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 8.5, TRUE),
  (2, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 7.0, TRUE),
  (3, 3, NOW() - INTERVAL '1 hour', NULL, NULL, FALSE);


-- =============================================
-- 25. AVALIACOES
-- =============================================
INSERT INTO avaliacoes (id_inscricao, nota, certificado, horas_totais, horas_presenca, data_avaliacao, url_certificado)
VALUES
  (1, 8.5, TRUE, 40, 35, NOW() - INTERVAL '1 day', 'uploads/certificados/certificado_aluno1_javascript.pdf'),
  (2, 7.0, TRUE, 40, 30, NOW() - INTERVAL '1 day', 'uploads/certificados/certificado_aluno2_javascript.pdf'),
   -- AVALIAÇÕES DO CURSO DE AGRICULTURA (100% presença = 100h, outros com menos)
  (9, 9.2, TRUE, 100, 100, '2025-05-02', 'uploads/certificados/certificado_rodrigo_agricultura.pdf'),    -- Rodrigo (100%)
  (10, 8.8, TRUE, 100, 100, '2025-05-02', 'uploads/certificados/certificado_rareura_agricultura.pdf'),   -- Rareura (100%)
  (11, 8.5, TRUE, 100, 95, '2025-05-02', 'uploads/certificados/certificado_admin_agricultura.pdf'),      -- Admin (95%)
  (12, 9.0, TRUE, 100, 100, '2025-05-02', 'uploads/certificados/certificado_formador_agricultura.pdf'),  -- Formador (100%)
  (13, 8.3, TRUE, 100, 88, '2025-05-02', 'uploads/certificados/certificado_carla_agricultura.pdf'),      -- Carla (88%)
  (14, 7.9, TRUE, 100, 82, '2025-05-02', 'uploads/certificados/certificado_miguel_agricultura.pdf'),     -- Miguel (82%)
  (15, 8.7, TRUE, 100, 92, '2025-05-02', 'uploads/certificados/certificado_sara_agricultura.pdf'),       -- Sara (92%)
  (16, 8.1, TRUE, 100, 85, '2025-05-02', 'uploads/certificados/certificado_formando_agricultura.pdf'),   -- Formando (85%)
  (17, 9.1, TRUE, 100, 98, '2025-05-02', 'uploads/certificados/certificado_joao_agricultura.pdf'),       -- João (98%)
  (18, 8.6, TRUE, 100, 90, '2025-05-02', 'uploads/certificados/certificado_ana_agricultura.pdf'),        -- Ana (90%)
  (19, 7.8, TRUE, 100, 78, '2025-05-02', 'uploads/certificados/certificado_pedro_agricultura.pdf'),      -- Pedro (78%)
  (20, 8.4, TRUE, 100, 87, '2025-05-02', 'uploads/certificados/certificado_sofia_agricultura.pdf'),      -- Sofia (87%)
  (21, 8.0, TRUE, 100, 80, '2025-05-02', 'uploads/certificados/certificado_ricardo_agricultura.pdf'),    -- Ricardo (80%)
  (22, 8.9, TRUE, 100, 94, '2025-05-02', 'uploads/certificados/certificado_mariana_agricultura.pdf'),    -- Mariana (94%)
  (23, 7.7, TRUE, 100, 76, '2025-05-02', 'uploads/certificados/certificado_luis_agricultura.pdf');       -- Luís (76%)

-- =============================================
-- 26. CURSO_TOPICO_PASTA_CONTEUDO
-- =============================================
INSERT INTO curso_topico_pasta_conteudo (titulo, descricao, tipo, url, arquivo_path, id_pasta, id_curso, data_criacao, ordem, ativo)
VALUES
  ('Introdução a ES6+', 'Visão geral das novas funcionalidades do JavaScript moderno', 'video', 'https://example.com/videos/js-intro', NULL, 1, 1, NOW(), 1, TRUE),
  ('Guia de Arrow Functions', 'Manual completo sobre arrow functions e seus usos', 'file', NULL, 'uploads/cursos/javascript_avancado/material_arrow_functions.pdf', 1, 1, NOW(), 2, TRUE),
  ('Exercício: Implementar Promises', 'Implemente soluções usando promises e async/await', 'file', NULL, 'uploads/cursos/javascript_avancado/exercicio_promises.pdf', 2, 1, NOW(), 1, TRUE),
  ('Documentação MDN', 'Referência oficial do JavaScript', 'link', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript', NULL, 3, 1, NOW(), 1, TRUE),
  ('Aula 1: Componentes do React Native', 'Visão geral dos componentes básicos', 'video', 'https://example.com/videos/react-native-components', NULL, 5, 2, NOW(), 1, TRUE);

-- =============================================
-- 27. QUIZ_RESPOSTAS_DETALHES
-- =============================================
INSERT INTO quiz_respostas_detalhes (id_resposta, id_pergunta, resposta_texto, id_opcao, correta, pontos_obtidos)
VALUES
  (1, 1, NULL, 1, TRUE, 5.0),
  (1, 2, NULL, 5, TRUE, 3.0),
  (1, 3, NULL, 10, TRUE, 2.0),
  (2, 1, NULL, 2, FALSE, 0.0),
  (2, 2, NULL, 5, TRUE, 3.0);

-- =============================================
-- 28. CHAT_MENSAGENS
-- =============================================
INSERT INTO chat_mensagens (id_topico, id_utilizador, texto, anexo_url, anexo_nome, tipo_anexo, data_criacao, likes, dislikes, foi_denunciada, oculta)
VALUES
  (1, 8, 'Olá, alguém pode me ajudar com closures em JavaScript?', NULL, NULL, NULL, NOW() - INTERVAL '2 days', 2, 0, FALSE, FALSE),
  (1, 4, 'Claro! Closures são funções que têm acesso ao escopo externo mesmo após a função externa ter retornado. Exemplo: function criarContador() { let contador = 0; return function() { return ++contador; }; }', NULL, NULL, NULL, NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 3, 0, FALSE, FALSE),
  (1, 8, 'Muito obrigado pela explicação! Agora entendi melhor.', NULL, NULL, NULL, NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 1, 0, FALSE, FALSE),
  (2, 10, 'Como faço para estilizar um componente no React Native?', NULL, NULL, NULL, NOW() - INTERVAL '1 day', 0, 0, FALSE, FALSE),
  (2, 4, 'No React Native  pode usar o StyleSheet. Exemplo: const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#fff" } });', 'uploads/anexos/exemplo_stylesheet.png', 'exemplo_stylesheet.png', 'imagem', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 2, 0, FALSE, FALSE);

-- =============================================
-- 29. CHAT_INTERACOES
-- =============================================
INSERT INTO chat_interacoes (id_mensagem, id_utilizador, tipo, data_interacao)
VALUES
  (1, 9, 'like', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
  (1, 10, 'like', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'),
  (2, 8, 'like', NOW() - INTERVAL '2 days' + INTERVAL '35 minutes'),
  (2, 9, 'like', NOW() - INTERVAL '2 days' + INTERVAL '40 minutes'),
  (2, 10, 'like', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),
  (3, 4, 'like', NOW() - INTERVAL '2 days' + INTERVAL '1 hour' + INTERVAL '5 minutes'),
  (5, 10, 'like', NOW() - INTERVAL '1 day' + INTERVAL '2 hours' + INTERVAL '10 minutes'),
  (5, 11, 'like', NOW() - INTERVAL '1 day' + INTERVAL '2 hours' + INTERVAL '15 minutes');

-- =============================================
-- 30. CHAT_DENUNCIAS
-- =============================================
INSERT INTO chat_denuncias (id_mensagem, id_denunciante, motivo, descricao, data_denuncia, resolvida, acao_tomada)
VALUES
  (3, 11, 'Spam', 'Esta mensagem parece ser spam promocional', NOW() - INTERVAL '1 day', TRUE, 'Ignorada - não é spam');