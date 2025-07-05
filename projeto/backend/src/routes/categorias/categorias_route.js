const express = require('express');
const router = express.Router();
const categoriasController = require('../../controllers/categorias/categorias_ctrl');
const verificarToken = require('../../middleware/auth');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * Rotas para gestão de categorias de formação
 * 
 * Define todas as rotas relacionadas com categorias,
 * organizando as operações de consulta e gestão com as permissões adequadas.
 * 
 * As categorias servem para organizar áreas de formação e cursos,
 * criando uma estrutura hierárquica: categoria > área > curso.
 * 
 * Estrutura de permissões:
 * - Consulta de categorias: Todos os utilizadores autenticados
 * - Criação, edição e eliminação: Apenas administradores (id_cargo 1)
 */

// Aplicar autenticação a todas as rotas
router.use(verificarToken);

// ==========================================
// ROTAS DE CONSULTA (Utilizadores Autenticados)
// ==========================================

/**
 * GET /api/categorias
 * Obter lista paginada de todas as categorias com filtros opcionais
 * 
 * Query Parameters:
 * - page: Número da página (padrão: 1)
 * - limit: Itens por página (padrão: 10, máximo: 100)
 * - search: Filtro de busca por nome da categoria
 * 
 * Resposta inclui:
 * - Lista de categorias ordenadas por nome
 * - Contagem de áreas associadas a cada categoria
 * - Informações de paginação completas
 * - Total de categorias encontradas
 * 
 * Funcionalidades:
 * - Busca insensível a maiúsculas e minúsculas
 * - Paginação automática com validação de parâmetros
 * - Ordenação alfabética por nome
 * - Contagem dinâmica de áreas por categoria
 * 
 * Casos de uso:
 * - Interface de gestão de categorias
 * - Seletores de categoria em formulários
 * - Navegação hierárquica do sistema
 * - Relatórios e estatísticas
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/', categoriasController.getAllCategorias);

/**
 * GET /api/categorias/:id
 * Obter dados detalhados de uma categoria específica
 * 
 * Parâmetros:
 * - id: Identificador único da categoria
 * 
 * Dados retornados:
 * - Informações completas da categoria
 * - Lista de áreas associadas à categoria
 * - Total de áreas na categoria
 * - Dados organizados hierarquicamente
 * 
 * Validações:
 * - Categoria deve existir na base de dados
 * - ID deve ser um número válido
 * - Utilizador deve estar autenticado
 * 
 * Casos de uso:
 * - Página de detalhes da categoria
 * - Edição de categoria existente
 * - Navegação por áreas da categoria
 * - Análise de estrutura hierárquica
 * 
 * Acesso: Utilizadores autenticados (todos os cargos)
 */
router.get('/:id', categoriasController.getCategoriaById);

// ==========================================
// ROTAS DE GESTÃO ADMINISTRATIVA
// ==========================================

/**
 * POST /api/categorias
 * Criar uma nova categoria de formação
 * 
 * Corpo da requisição (JSON):
 * - nome: Nome da categoria (string, obrigatório, único)
 * 
 * Validações realizadas:
 * - Nome não pode estar vazio ou conter apenas espaços
 * - Nome deve ser único no sistema (busca insensível a maiúsculas)
 * - Utilizador deve ter permissões de administrador
 * - Dados são processados dentro de transação
 * 
 * Processo de criação:
 * 1. Validar dados de entrada
 * 2. Verificar duplicação de nome
 * 3. Criar categoria na base de dados
 * 4. Confirmar transação
 * 5. Retornar categoria criada com contadores zerados
 * 
 * Resposta de sucesso:
 * - Status 201 Created
 * - Dados completos da categoria criada
 * - Contagem de áreas inicializada a zero
 * - Mensagem de confirmação
 * 
 * Casos de erro:
 * - Nome vazio ou inválido (400)
 * - Nome já existe (400)
 * - Permissões insuficientes (403)
 * - Erro na base de dados (500)
 * 
 * Permissões: Apenas administradores (id_cargo 1)
 */
router.post('/', 
  verificarCargo(['admin']), 
  categoriasController.createCategoria
);

/**
 * PUT /api/categorias/:id
 * Actualizar dados de uma categoria existente
 * 
 * Parâmetros:
 * - id: Identificador da categoria a actualizar
 * 
 * Corpo da requisição (JSON):
 * - nome: Novo nome da categoria (string, obrigatório)
 * 
 * Validações realizadas:
 * - Categoria deve existir na base de dados
 * - Nome não pode estar vazio
 * - Novo nome deve ser único (excluindo a própria categoria)
 * - Utilizador deve ter permissões adequadas
 * 
 * Processo de actualização:
 * 1. Verificar existência da categoria
 * 2. Validar novo nome
 * 3. Verificar duplicação com outras categorias
 * 4. Actualizar dados na base de dados
 * 5. Confirmar transação
 * 6. Retornar categoria actualizada
 * 
 * Funcionalidades:
 * - Preserva contagem actual de áreas
 * - Actualização atómica com transações
 * - Validação de unicidade automática
 * - Trimming automático de espaços
 * 
 * Resposta inclui:
 * - Dados actualizados da categoria
 * - Contagem actual de áreas associadas
 * - Mensagem de confirmação da operação
 * 
 * Permissões: Apenas administradores (id_cargo 1)
 */
router.put('/:id', 
  verificarCargo(['admin']), 
  categoriasController.updateCategoria
);

/**
 * DELETE /api/categorias/:id
 * Eliminar uma categoria de formação
 * 
 * Parâmetros:
 * - id: Identificador da categoria a eliminar
 * 
 * Restrições de integridade:
 * - Categoria deve existir na base de dados
 * - Não pode ter áreas associadas
 * - Operação é irreversível
 * 
 * Validações de segurança:
 * - Verificar existência da categoria
 * - Contar áreas associadas
 * - Bloquear eliminação se houver dependências
 * - Verificar permissões de administrador
 * 
 * Processo de eliminação:
 * 1. Validar existência da categoria
 * 2. Verificar se existem áreas associadas
 * 3. Bloquear operação se houver dependências
 * 4. Eliminar categoria dentro de transação
 * 5. Confirmar eliminação com nome da categoria
 * 
 * Casos de erro comuns:
 * - Categoria não encontrada (404)
 * - Categoria tem áreas associadas (400)
 * - Permissões insuficientes (403)
 * - Problemas na base de dados (500)
 * 
 * Resposta de sucesso:
 * - Confirmação da eliminação
 * - Nome da categoria eliminada
 * - Mensagem informativa
 * 
 * Nota importante:
 * Para eliminar uma categoria, é necessário primeiro
 * remover ou reatribuir todas as áreas associadas.
 * 
 * Permissões: Apenas administradores (id_cargo 1)
 */
router.delete('/:id', 
  verificarCargo(['admin']),
  categoriasController.deleteCategoria
);

/**
 * Exportar router configurado
 * 
 * Este router será montado no caminho /api/categorias pelo servidor principal,
 * fornecendo uma API REST completa para gestão de categorias de formação.
 * 
 * Middleware aplicado:
 * - verificarToken: Autenticação obrigatória em todas as rotas
 * - verificarCargo: Autorização específica em rotas de gestão
 * 
 * Padronização de respostas:
 * - Códigos HTTP apropriados (200, 201, 400, 403, 404, 500)
 * - Estrutura JSON consistente com success/error
 * - Mensagens de erro em português
 * - Dados paginados nas listagens
 * - Transações para operações críticas
 * 
 * Funcionalidades principais:
 * - CRUD completo para categorias
 * - Validação de integridade referencial
 * - Paginação e filtros avançados
 * - Contadores dinâmicos de áreas
 * - Gestão de permissões granular
 * - Suporte para estrutura hierárquica do sistema
 */
module.exports = router;