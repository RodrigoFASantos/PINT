const express = require('express');
const router = express.Router();
const categoriasController = require('../../controllers/categorias/categorias_ctrl');
const verificarToken = require('../../middleware/auth');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * Rotas para gestão de categorias de formação
 * 
 * Sistema hierárquico: Categoria → Área → Tópico → Curso
 * 
 * Segurança:
 * - Todas as rotas requerem autenticação (verificarToken)
 * - Operações administrativas requerem cargo de administrador
 * - Consultas estão disponíveis para todos os utilizadores autenticados
 */

// Aplicar autenticação obrigatória a todas as rotas
router.use(verificarToken);

/**
 * GET /api/categorias
 * Obter lista paginada de categorias com contagem de áreas
 * 
 * Query parameters:
 * - page: número da página (padrão: 1)
 * - limit: itens por página (padrão: 10, máximo: 100)
 * - search: termo de busca por nome da categoria
 * 
 * Resposta:
 * {
 *   success: true,
 *   total: 25,
 *   pages: 3,
 *   current_page: 1,
 *   categorias: [
 *     {
 *       id_categoria: 1,
 *       nome: "Informática",
 *       areas_count: 8
 *     }
 *   ],
 *   pagination_info: {
 *     has_previous: false,
 *     has_next: true,
 *     items_per_page: 10,
 *     total_items: 25,
 *     showing_items: 10
 *   }
 * }
 * 
 * Acesso: Todos os utilizadores autenticados
 */
router.get('/', categoriasController.getAllCategorias);

/**
 * GET /api/categorias/:id
 * Obter dados detalhados de uma categoria específica
 * 
 * Parâmetros:
 * - id: identificador único da categoria
 * 
 * Resposta:
 * {
 *   success: true,
 *   categoria: {
 *     id_categoria: 1,
 *     nome: "Informática",
 *     areas: [
 *       { id_area: 1, nome: "Programação Web" },
 *       { id_area: 2, nome: "Base de Dados" }
 *     ],
 *     total_areas: 2
 *   }
 * }
 * 
 * Acesso: Todos os utilizadores autenticados
 */
router.get('/:id', categoriasController.getCategoriaById);

/**
 * POST /api/categorias
 * Criar nova categoria de formação
 * 
 * Corpo da requisição:
 * {
 *   "nome": "Nome da Nova Categoria"
 * }
 * 
 * Validações:
 * - Nome é obrigatório e não pode estar vazio
 * - Nome deve ser único no sistema
 * - Utilizador deve ter permissões de administrador
 * 
 * Resposta de sucesso (201):
 * {
 *   success: true,
 *   message: "Categoria criada com sucesso",
 *   categoria: {
 *     id_categoria: 12,
 *     nome: "Nome da Nova Categoria",
 *     areas_count: 0
 *   }
 * }
 * 
 * Acesso: Apenas administradores (id_cargo === 1)
 */
router.post('/', 
  verificarCargo(['admin']), 
  categoriasController.createCategoria
);

/**
 * PUT /api/categorias/:id
 * Atualizar categoria existente
 * 
 * Parâmetros:
 * - id: identificador da categoria a atualizar
 * 
 * Corpo da requisição:
 * {
 *   "nome": "Novo Nome da Categoria"
 * }
 * 
 * Validações:
 * - Categoria deve existir na base de dados
 * - Novo nome é obrigatório e não pode estar vazio
 * - Novo nome deve ser único (excluindo a própria categoria)
 * - Utilizador deve ter permissões de administrador
 * 
 * Processo:
 * 1. Verificar existência da categoria
 * 2. Validar novo nome
 * 3. Verificar duplicação com outras categorias
 * 4. Atualizar dados dentro de transação
 * 5. Retornar categoria atualizada com contagem de áreas
 * 
 * Acesso: Apenas administradores (id_cargo === 1)
 */
router.put('/:id', 
  verificarCargo(['admin']), 
  categoriasController.updateCategoria
);

/**
 * DELETE /api/categorias/:id
 * Eliminar categoria de formação
 * 
 * ⚠️ OPERAÇÃO CRÍTICA E IRREVERSÍVEL ⚠️
 * 
 * Parâmetros:
 * - id: identificador da categoria a eliminar
 * 
 * Restrições críticas:
 * - Categoria DEVE existir na base de dados
 * - NÃO pode ter áreas associadas (validação obrigatória)
 * - Operação é completamente irreversível
 * 
 * Processo de segurança:
 * 1. Verificar existência da categoria
 * 2. Contar áreas associadas à categoria
 * 3. BLOQUEAR eliminação se houver dependências
 * 4. Eliminar categoria dentro de transação
 * 5. Retornar confirmação
 * 
 * Resposta de sucesso (200):
 * {
 *   success: true,
 *   message: "Categoria 'Informática' eliminada com sucesso"
 * }
 * 
 * Resposta de bloqueio (400):
 * {
 *   success: false,
 *   message: "Não é possível eliminar a categoria pois existem 5 área(s) associada(s). 
 *             Remove primeiro as áreas desta categoria ou reatribui-as a outra categoria."
 * }
 * 
 * Nota importante:
 * Para eliminar uma categoria com áreas associadas, é necessário primeiro:
 * 1. Eliminar ou reatribuir todas as áreas
 * 2. Verificar se não há cursos dependentes nas áreas
 * 3. Considerar o impacto na navegação dos utilizadores
 * 
 * Esta regra garante a integridade referencial do sistema.
 * 
 * Acesso: Apenas administradores (id_cargo === 1)
 */
router.delete('/:id', 
  verificarCargo(['admin']),
  categoriasController.deleteCategoria
);

module.exports = router;