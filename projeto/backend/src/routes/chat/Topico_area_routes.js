const express = require('express');
const router = express.Router();
const { 
  getAllTopicosCategoria,
  getTopicoById,
  getTopicosByCategoria,
  createTopico,
  updateTopico,
  deleteTopico,
  getComentariosByTopico,
  createComentario,
  avaliarComentario
} = require('../../controllers/chat/Topico_area_ctrl');
const authMiddleware = require('../../middleware/auth');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * Rotas para gestão de tópicos de área e comentários
 * 
 * Define todas as rotas relacionadas com tópicos de discussão,
 * organizando as operações de consulta e gestão com as permissões adequadas.
 * 
 * Os tópicos organizam discussões por categorias e áreas específicas,
 * facilitando a comunicação entre utilizadores do sistema.
 * 
 * Estrutura de permissões:
 * - Consulta de tópicos: Todos os utilizadores autenticados
 * - Criação e edição: Administradores e formadores (id_cargo 1 e 2)
 * - Eliminação: Apenas administradores (id_cargo 1)
 * - Comentários: Todos os utilizadores autenticados
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// ==========================================
// ROTAS DE CONSULTA PÚBLICA (Utilizadores Autenticados)
// ==========================================

/**
 * GET /api/topicos-area/todos
 * Obter lista paginada de todos os tópicos com filtros opcionais
 * 
 * Query Parameters:
 * - page: Número da página (padrão: 1)
 * - limit: Itens por página (padrão: 10, máximo: 100)
 * - search: Filtro de busca por título ou descrição do tópico
 * - categoria: ID da categoria para filtrar tópicos
 * - area: ID da área para filtrar tópicos
 * - grouped: 'true' para agrupar por categorias
 * 
 * Resposta inclui:
 * - Lista de tópicos com informações da categoria e área
 * - Contagem de mensagens associadas
 * - Informações de paginação
 * - Dados do criador do tópico
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/todos', getAllTopicosCategoria);

/**
 * GET /api/topicos-area
 * Alias para /todos - Obter lista de tópicos
 * Mantém compatibilidade com frontend existente
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/', getAllTopicosCategoria);

/**
 * GET /api/topicos-area/:id
 * Obter dados detalhados de um tópico específico
 * 
 * Parâmetros:
 * - id: Identificador único do tópico
 * 
 * Dados retornados:
 * - Informações completas do tópico
 * - Dados da categoria e área associadas
 * - Informações do criador
 * - Estatísticas de participação (mensagens, participantes únicos)
 * - Data da última atividade
 * 
 * Casos de uso:
 * - Página de detalhes do tópico
 * - Entrada no chat/fórum
 * - Análise de atividade
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/:id', getTopicoById);

/**
 * GET /api/topicos-area/categoria/:id_categoria
 * Obter todos os tópicos pertencentes a uma categoria específica
 * 
 * Parâmetros:
 * - id_categoria: Identificador único da categoria
 * 
 * Query Parameters:
 * - area_id: Filtrar por área específica dentro da categoria
 * - busca: Termo de busca por título ou descrição
 * - limit: Itens por página (padrão: 20)
 * - offset: Número de itens a saltar (padrão: 0)
 * 
 * Funcionalidades:
 * - Validação da existência da categoria
 * - Retorno de tópicos ordenados por data de criação
 * - Paginação automática
 * - Informações do criador incluídas
 * 
 * Casos de uso:
 * - Navegação por categoria no frontend
 * - Construção de menus dinâmicos
 * - Filtros de seleção rápida
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/categoria/:id_categoria', getTopicosByCategoria);

// ==========================================
// ROTAS DE GESTÃO ADMINISTRATIVA
// ==========================================

/**
 * POST /api/topicos-area
 * Criar um novo tópico de discussão
 * 
 * Corpo da requisição (JSON):
 * - titulo: Título do tópico (string, obrigatório, único por área)
 * - descricao: Descrição do tópico (string, opcional)
 * - id_categoria: ID da categoria (integer, obrigatório)
 * - id_area: ID da área (integer, obrigatório)
 * 
 * Validações:
 * - Título não pode estar vazio
 * - Categoria e área devem existir
 * - Título único dentro da mesma área
 * - Utilizador deve ter permissões adequadas
 * - Consistência transacional
 * 
 * Resposta de sucesso:
 * - Status 201 Created
 * - Dados completos do tópico criado
 * - Informações da categoria e área associadas
 * - Dados do criador
 * 
 * Permissões: Administradores e formadores apenas
 */
router.post('/', 
  verificarCargo(['admin', 'formador']), 
  createTopico
);

/**
 * PUT /api/topicos-area/:id
 * Actualizar dados de um tópico existente
 * 
 * Parâmetros:
 * - id: Identificador do tópico a actualizar
 * 
 * Corpo da requisição (JSON):
 * - titulo: Novo título do tópico (string, opcional)
 * - descricao: Nova descrição (string, opcional)
 * - id_categoria: Nova categoria (integer, opcional)
 * - id_area: Nova área (integer, opcional)
 * - ativo: Status do tópico (boolean, apenas admin/formador)
 * 
 * Validações:
 * - Tópico deve existir
 * - Utilizador deve ser o criador ou ter permissões elevadas
 * - Nova categoria/área devem existir se especificadas
 * - Título único na área (excluindo o próprio tópico)
 * - Dados não podem estar vazios se fornecidos
 * 
 * Casos de uso:
 * - Correção de informações
 * - Reorganização de categorias/áreas
 * - Moderação de conteúdo
 * - Desativação de tópicos
 * 
 * Permissões: Criador do tópico, administradores ou formadores
 */
router.put('/:id', updateTopico);

/**
 * DELETE /api/topicos-area/:id
 * Eliminar um tópico de discussão
 * 
 * Parâmetros:
 * - id: Identificador do tópico a eliminar
 * 
 * Restrições de integridade:
 * - Tópico deve existir
 * - Operação elimina todo o conteúdo associado
 * - Remove mensagens, interações e denúncias
 * - Operação irreversível
 * 
 * Processo:
 * 1. Validar existência do tópico
 * 2. Contar mensagens e denúncias associadas
 * 3. Eliminar denúncias relacionadas
 * 4. Eliminar interações das mensagens
 * 5. Eliminar mensagens do tópico
 * 6. Eliminar o tópico dentro de transação
 * 7. Confirmar eliminação com estatísticas
 * 
 * Casos de erro:
 * - Tópico não encontrado (404)
 * - Permissões insuficientes (403)
 * - Problemas de base de dados (500)
 * 
 * Permissões: Apenas administradores
 */
router.delete('/:id', 
  verificarCargo(['admin']),
  deleteTopico
);

// ==========================================
// ROTAS DE GESTÃO DE COMENTÁRIOS
// ==========================================

/**
 * GET /api/topicos-area/:id/comentarios
 * Obter comentários de um tópico específico
 * 
 * Parâmetros:
 * - id: Identificador do tópico
 * 
 * Query Parameters:
 * - limit: Mensagens por página (padrão: 50)
 * - offset: Número de mensagens a saltar (padrão: 0)
 * - ordem: Ordenação por data ('ASC' ou 'DESC', padrão: 'ASC')
 * 
 * Dados retornados:
 * - Lista de mensagens não ocultas
 * - Informações do utilizador que criou cada mensagem
 * - Contadores de likes e dislikes
 * - Anexos se existirem
 * - Informações de paginação
 * - Dados básicos do tópico
 * 
 * Casos de uso:
 * - Carregar mensagens do chat/fórum
 * - Paginação de conversas longas
 * - Histórico de discussões
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/:id/comentarios', getComentariosByTopico);

/**
 * POST /api/topicos-area/:id/comentarios
 * Criar novo comentário em um tópico
 * 
 * Parâmetros:
 * - id: Identificador do tópico
 * 
 * Corpo da requisição:
 * - texto: Conteúdo da mensagem (string, opcional se houver anexo)
 * - file: Ficheiro anexado (multipart/form-data, opcional)
 * 
 * Funcionalidades:
 * - Validação da existência e estado ativo do tópico
 * - Processamento de anexos com estrutura de diretórios
 * - Geração de nomes únicos para ficheiros
 * - Determinação automática do tipo de ficheiro
 * - Notificação em tempo real via WebSocket
 * - Criação de registo de atividade
 * 
 * Validações:
 * - Tópico deve existir e estar ativo
 * - Deve fornecer texto ou anexo
 * - Ficheiros dentro dos limites permitidos
 * - Utilizador autenticado
 * 
 * Resposta inclui:
 * - Dados completos da mensagem criada
 * - Informações do utilizador
 * - URLs de anexos se aplicável
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.post('/:id/comentarios', createComentario);

// ==========================================
// ROTAS DE INTERAÇÃO COM COMENTÁRIOS
// ==========================================

/**
 * POST /api/topicos-area/:id_topico/comentarios/:id_comentario/avaliar
 * Avaliar comentário (like/dislike)
 * 
 * Parâmetros:
 * - id_topico: Identificador do tópico
 * - id_comentario: Identificador da mensagem
 * 
 * Corpo da requisição (JSON):
 * - tipo: Tipo de avaliação ('like' ou 'dislike')
 * 
 * Funcionalidades:
 * - Sistema de toggle (clicar novamente remove a avaliação)
 * - Mudança de tipo de avaliação (like para dislike e vice-versa)
 * - Atualização automática de contadores
 * - Notificação em tempo real via WebSocket
 * - Histórico de interações por utilizador
 * 
 * Validações:
 * - Mensagem deve existir no tópico especificado
 * - Tipo de avaliação deve ser válido
 * - Um utilizador só pode ter uma avaliação por mensagem
 * - Utilizador autenticado
 * 
 * Resposta inclui:
 * - Contadores atualizados (likes/dislikes)
 * - Estado da interação do utilizador
 * - Confirmação da ação realizada
 * 
 * Casos de uso:
 * - Sistema de feedback em discussões
 * - Moderação comunitária
 * - Destaque de conteúdo relevante
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.post('/:id_topico/comentarios/:id_comentario/avaliar', avaliarComentario);

/**
 * Exportar router configurado
 * 
 * Este router será montado no caminho /api/topicos-area pelo servidor principal,
 * fornecendo uma API REST completa para gestão de tópicos de discussão.
 * 
 * Middleware aplicado:
 * - authMiddleware: Autenticação obrigatória em todas as rotas
 * - verificarCargo: Autorização específica em rotas de gestão
 * 
 * Padronização de respostas:
 * - Códigos HTTP apropriados (200, 201, 400, 403, 404, 500)
 * - Estrutura JSON consistente com success/error
 * - Mensagens de erro em português
 * - Dados paginados quando aplicável
 * - Transações para operações críticas
 * 
 * Funcionalidades avançadas:
 * - WebSocket para notificações em tempo real
 * - Upload e gestão de ficheiros anexados
 * - Sistema de moderação integrado
 * - Estatísticas de participação
 * - Estrutura hierárquica (categoria > área > tópico > mensagem)
 */
module.exports = router;