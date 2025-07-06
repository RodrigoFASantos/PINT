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
 * ROTAS PARA GESTÃO DE TÓPICOS DE ÁREA E COMENTÁRIOS (3º nível da hierarquia)
 * 
 * Implementa a gestão completa do terceiro nível da estrutura educacional:
 * Categoria → Área → Tópico → Curso (com chats de conversa)
 * 
 * FUNCIONALIDADES PRINCIPAIS:
 * - Gestão de tópicos de discussão organizados por área
 * - Sistema de chat/comentários em tempo real
 * - Sistema de avaliações (likes/dislikes)
 * - Upload de ficheiros anexados
 * - Notificações WebSocket
 * 
 * REGRAS DE ACESSO:
 * - Consulta de tópicos: Todos os utilizadores autenticados
 * - Criação e edição: Administradores (id_cargo === 1) e Formadores (id_cargo === 2)
 * - Eliminação: Apenas administradores (id_cargo === 1)
 * - Comentários: Todos os utilizadores autenticados
 * 
 * REGRAS CRÍTICAS DE INTEGRIDADE:
 * - Eliminar tópico remove automaticamente TODOS os elementos dependentes:
 *   • Chats de conversa associados ao tópico
 *   • Cursos associados ao tópico  
 *   • Inscrições de formandos nesses cursos
 *   • Associações de formadores
 * 
 * Esta é uma das operações mais críticas do sistema!
 */

// Aplicar autenticação obrigatória a todas as rotas
router.use(authMiddleware);

// =============================================================================
// ROTAS DE CONSULTA PÚBLICA (Utilizadores Autenticados)
// =============================================================================

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
 * Funcionalidades:
 * - Busca insensível a maiúsculas em título e descrição
 * - Filtragem hierárquica por categoria e área
 * - Paginação automática com validação
 * - Contagem de mensagens associadas a cada tópico
 * - Informações do criador incluídas
 * - Opção de agrupamento por categorias
 * 
 * Resposta normal:
 * {
 *   success: true,
 *   total: 87,
 *   pages: 9,
 *   current_page: 1,
 *   data: [
 *     {
 *       id_topico: 1,
 *       titulo: "Discussão sobre React",
 *       categoria: { nome: "Informática" },
 *       area: { nome: "Programação Web" },
 *       criador: { nome: "João Silva" },
 *       mensagens_count: 23
 *     }
 *   ],
 *   pagination_info: {...}
 * }
 * 
 * Resposta agrupada (grouped=true):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id_categoria: 1,
 *       nome: "Informática",
 *       topicos_categoria: [...]
 *     }
 *   ],
 *   total_categorias: 5
 * }
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/todos', getAllTopicosCategoria);

/**
 * GET /api/topicos-area
 * Alias para /todos - Obter lista de tópicos
 * Mantém compatibilidade com frontend existente
 * 
 * ACESSO: Todos os utilizadores autenticados
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
 * - Informações do criador (nome, email, foto)
 * - Estatísticas de participação:
 *   • Total de mensagens
 *   • Participantes únicos
 *   • Data da última atividade
 * 
 * Casos de uso:
 * - Página de detalhes do tópico
 * - Entrada no chat/fórum
 * - Análise de atividade
 * - Navegação hierárquica
 * 
 * ACESSO: Todos os utilizadores autenticados
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
 * - Filtragem opcional por área dentro da categoria
 * - Busca textual em título e descrição
 * - Contagem de mensagens por tópico
 * - Ordenação por data de criação (mais recentes primeiro)
 * 
 * Casos de uso:
 * - Navegação por categoria no frontend
 * - Construção de menus dinâmicos
 * - Filtros de seleção rápida
 * - Análise de atividade por categoria
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/categoria/:id_categoria', getTopicosByCategoria);

// =============================================================================
// ROTAS DE GESTÃO ADMINISTRATIVA
// =============================================================================

/**
 * POST /api/topicos-area
 * Criar um novo tópico de discussão
 * 
 * Corpo da requisição (JSON):
 * {
 *   "titulo": "Título do Tópico",
 *   "descricao": "Descrição opcional",
 *   "id_categoria": 1,
 *   "id_area": 5
 * }
 * 
 * Validações rigorosas:
 * - Título não pode estar vazio
 * - Categoria e área devem existir na base de dados
 * - Título deve ser único dentro da mesma área
 * - Utilizador deve ter permissões adequadas
 * - Consistência transacional garantida
 * 
 * Processo de criação:
 * 1. Validar dados obrigatórios
 * 2. Verificar existência de categoria e área
 * 3. Verificar unicidade do título na área
 * 4. Criar tópico com utilizador como criador
 * 5. Confirmar transação
 * 6. Retornar tópico completo com relacionamentos
 * 
 * Resposta de sucesso (201):
 * {
 *   success: true,
 *   message: "Tópico criado com sucesso",
 *   data: {
 *     id_topico: 1,
 *     titulo: "Discussão sobre React",
 *     criador: {...},
 *     categoria: {...},
 *     area: {...}
 *   }
 * }
 * 
 * ACESSO: Administradores e formadores apenas
 */
router.post('/', 
  verificarCargo(['admin', 'formador']), 
  createTopico
);

/**
 * PUT /api/topicos-area/:id
 * Atualizar dados de um tópico existente
 * 
 * Parâmetros:
 * - id: Identificador do tópico a atualizar
 * 
 * Corpo da requisição (JSON):
 * {
 *   "titulo": "Novo título",
 *   "descricao": "Nova descrição",
 *   "id_categoria": 2,
 *   "id_area": 8,
 *   "ativo": true
 * }
 * 
 * Validações de permissões:
 * - Tópico deve existir
 * - Utilizador deve ser o criador OU ter permissões elevadas
 * - Nova categoria/área devem existir se especificadas
 * - Título único na área (excluindo o próprio tópico)
 * - Dados não podem estar vazios se fornecidos
 * 
 * Regras especiais:
 * - Apenas admin/formador podem alterar status 'ativo'
 * - Criador pode editar título e descrição
 * - Admin pode mover tópico entre áreas/categorias
 * 
 * Casos de uso:
 * - Correção de informações
 * - Reorganização de categorias/áreas  
 * - Moderação de conteúdo
 * - Desativação de tópicos
 * 
 * ACESSO: Criador do tópico, administradores ou formadores
 */
router.put('/:id', updateTopico);

/**
 * DELETE /api/topicos-area/:id
 * Eliminar um tópico de discussão
 * 
 * Parâmetros:
 * - id: Identificador do tópico a eliminar
 * 
 * ⚠️ OPERAÇÃO EXTREMAMENTE CRÍTICA ⚠️
 * 
 * EFEITOS EM CASCATA (automáticos):
 * 1. Elimina TODAS as denúncias relacionadas com mensagens do tópico
 * 2. Elimina TODAS as interações (likes/dislikes) das mensagens
 * 3. Elimina TODAS as mensagens do chat do tópico
 * 4. Elimina TODOS os cursos associados ao tópico
 * 5. Remove TODAS as inscrições de formandos nesses cursos
 * 6. Remove TODAS as associações de formadores
 * 7. Elimina o próprio tópico
 * 
 * Processo detalhado:
 * 1. Validar existência do tópico
 * 2. Contar mensagens e denúncias associadas
 * 3. Dentro de uma transação:
 *    a. Eliminar denúncias relacionadas
 *    b. Eliminar interações das mensagens  
 *    c. Eliminar mensagens do tópico
 *    d. Eliminar cursos associados (CASCADE)
 *    e. Eliminar o tópico
 * 4. Confirmar transação
 * 5. Retornar estatísticas da eliminação
 * 
 * Resposta de sucesso (200):
 * {
 *   success: true,
 *   message: "Tópico 'React' eliminado. 45 mensagens e 3 denúncias removidas."
 * }
 * 
 * IMPORTANTE: Esta operação não pode ser desfeita!
 * 
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
router.delete('/:id', 
  verificarCargo(['admin']),
  deleteTopico
);

// =============================================================================
// ROTAS DE GESTÃO DE COMENTÁRIOS E CHAT
// =============================================================================

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
 * - URLs de anexos se existirem
 * - Informações de paginação
 * - Dados básicos do tópico
 * 
 * Funcionalidades:
 * - Apenas mensagens visíveis (oculta = false)
 * - Paginação para conversas longas
 * - Ordenação cronológica configurável
 * - Inclui anexos (imagens, vídeos, ficheiros)
 * 
 * Casos de uso:
 * - Carregar mensagens do chat/fórum
 * - Paginação de conversas longas
 * - Histórico de discussões
 * - Scroll infinito no frontend
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/:id/comentarios', getComentariosByTopico);

/**
 * POST /api/topicos-area/:id/comentarios
 * Criar novo comentário em um tópico
 * 
 * Parâmetros:
 * - id: Identificador do tópico
 * 
 * Corpo da requisição (multipart/form-data):
 * - texto: Conteúdo da mensagem (string, opcional se houver anexo)
 * - file: Ficheiro anexado (opcional)
 * 
 * Funcionalidades avançadas:
 * - Validação da existência e estado ativo do tópico
 * - Processamento de anexos com estrutura organizada de diretórios
 * - Geração de nomes únicos para ficheiros
 * - Determinação automática do tipo de ficheiro (imagem/video/file)
 * - Notificação em tempo real via WebSocket
 * - Criação de registo de atividade
 * 
 * Estrutura de diretórios criada:
 * uploads/chat/[categoria]/[topico]/[ficheiro]
 * 
 * Validações:
 * - Tópico deve existir e estar ativo
 * - Deve fornecer texto OU anexo (pelo menos um)
 * - Ficheiros dentro dos limites permitidos
 * - Utilizador autenticado
 * 
 * Processo de criação:
 * 1. Validar tópico e dados
 * 2. Processar anexo (se fornecido)
 * 3. Criar estrutura de diretórios
 * 4. Mover ficheiro para localização final
 * 5. Criar registo na base de dados
 * 6. Enviar notificação WebSocket
 * 7. Retornar mensagem completa
 * 
 * Resposta inclui:
 * - Dados completos da mensagem criada
 * - Informações do utilizador
 * - URLs de anexos se aplicável
 * - Contadores iniciais (likes: 0, dislikes: 0)
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.post('/:id/comentarios', createComentario);

// =============================================================================
// ROTAS DE INTERAÇÃO COM COMENTÁRIOS
// =============================================================================

/**
 * POST /api/topicos-area/:id_topico/comentarios/:id_comentario/avaliar
 * Avaliar comentário (like/dislike)
 * 
 * Parâmetros:
 * - id_topico: Identificador do tópico
 * - id_comentario: Identificador da mensagem
 * 
 * Corpo da requisição (JSON):
 * {
 *   "tipo": "like" | "dislike"
 * }
 * 
 * Funcionalidades inteligentes:
 * - Sistema de toggle: clicar novamente remove a avaliação
 * - Mudança de tipo: like → dislike e vice-versa
 * - Atualização automática de contadores
 * - Notificação em tempo real via WebSocket
 * - Histórico de interações por utilizador
 * - Prevenção de múltiplas avaliações pelo mesmo utilizador
 * 
 * Lógica de avaliação:
 * 1. Se não há avaliação anterior: Criar nova
 * 2. Se há avaliação igual: Remover (toggle off)
 * 3. Se há avaliação diferente: Alterar tipo
 * 4. Atualizar contadores appropriadamente
 * 5. Notificar utilizadores conectados
 * 
 * Validações:
 * - Mensagem deve existir no tópico especificado
 * - Tipo deve ser 'like' ou 'dislike'
 * - Um utilizador só pode ter uma avaliação por mensagem
 * - Utilizador autenticado
 * 
 * Resposta inclui:
 * - Contadores atualizados (likes/dislikes)
 * - Estado da interação do utilizador
 * - Confirmação da ação realizada
 * 
 * WebSocket emitido:
 * - Evento: 'comentarioAvaliado'
 * - Para: todos na sala `topico_${id_topico}`
 * - Dados: contadores atualizados + ação
 * 
 * Casos de uso:
 * - Sistema de feedback em discussões
 * - Moderação comunitária
 * - Destaque de conteúdo relevante
 * - Gamificação da participação
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.post('/:id_topico/comentarios/:id_comentario/avaliar', avaliarComentario);

/**
 * Exportar router configurado
 * 
 * Este router implementa o sistema mais complexo da plataforma:
 * - Gestão hierárquica de tópicos (3º nível)
 * - Sistema de chat em tempo real
 * - Upload e gestão de ficheiros
 * - Sistema de avaliações e interações
 * - Notificações WebSocket
 * - Moderação de conteúdo
 * 
 * Middleware aplicado:
 * - authMiddleware: Autenticação obrigatória
 * - verificarCargo: Autorização específica por operação
 * 
 * Tecnologias integradas:
 * - Sequelize para base de dados
 * - Socket.IO para tempo real
 * - Multer para upload de ficheiros
 * - Validação rigorosa de integridade
 * 
 * Padrões implementados:
 * - RESTful API design
 * - Transações para operações críticas
 * - Paginação consistente
 * - Gestão de erros padronizada
 * - Logging de atividades
 * 
 * REGRA CRÍTICA LEMBRETE:
 * A eliminação de tópicos é a operação mais destrutiva do sistema,
 * removendo cursos, inscrições e todo o histórico de chat.
 * Usar apenas em casos extremos!
 */
module.exports = router;