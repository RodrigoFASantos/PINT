const express = require('express');
const router = express.Router();
const areasController = require('../../controllers/areas/areas_ctrl');
const verificarToken = require('../../middleware/auth');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * ROTAS PARA GESTÃO DE ÁREAS DE FORMAÇÃO
 * 
 * Este módulo define todas as rotas HTTP para gestão do segundo nível
 * da hierarquia educacional da plataforma:
 * Categoria → Área → Tópico → Curso
 * 
 * ESTRUTURA DE SEGURANÇA:
 * - Todas as rotas requerem autenticação obrigatória (verificarToken)
 * - Operações administrativas requerem cargo de administrador
 * - Consultas estão disponíveis para todos os utilizadores autenticados
 * 
 * REGRAS DE INTEGRIDADE IMPLEMENTADAS:
 * - Áreas só podem ser eliminadas se não tiverem tópicos dependentes
 * - Nome de área deve ser único dentro da mesma categoria
 * - Área deve sempre pertencer a uma categoria válida
 * - Validação automática de dependências antes de eliminações
 * - Transações garantem consistência em operações críticas
 */

// Aplicação de autenticação obrigatória a todas as rotas
// Este middleware é executado antes de qualquer controlador
router.use(verificarToken);

// =============================================================================
// ROTAS DE CONSULTA - Disponíveis para todos os utilizadores autenticados
// =============================================================================

/**
 * GET /api/areas
 * Obter lista paginada de áreas com filtros opcionais
 * 
 * FUNCIONALIDADES AVANÇADAS:
 * - Paginação automática com validação robusta de parâmetros
 * - Filtro de busca por nome (insensível a maiúsculas/minúsculas)
 * - Filtro por categoria específica para navegação hierárquica
 * - Ordenação alfabética por nome da área
 * - Contagem dinâmica de tópicos associados a cada área
 * - Informações completas da categoria pai para cada área
 * - Dados de paginação estruturados para o frontend
 * 
 * QUERY PARAMETERS ACEITES:
 * - page: Número da página (padrão: 1, mínimo: 1)
 * - limit: Itens por página (padrão: 10, máximo: 100)
 * - search: Termo de busca por nome da área
 * - categoria: ID da categoria para filtrar áreas específicas
 * 
 * RESPOSTA ESTRUTURADA:
 * {
 *   success: true,
 *   total: 45,                        // Total de áreas encontradas
 *   pages: 5,                         // Total de páginas disponíveis
 *   current_page: 1,                  // Página atual
 *   areas: [                          // Array de áreas da página
 *     {
 *       id_area: 1,
 *       nome: "Programação Web",
 *       categoria: {                  // Informações da categoria pai
 *         id_categoria: 1,
 *         nome: "Informática"
 *       },
 *       topicos_count: 8              // Contagem dinâmica de tópicos
 *     }
 *   ],
 *   pagination_info: {                // Informações detalhadas de paginação
 *     has_previous: false,
 *     has_next: true,
 *     items_per_page: 10,
 *     total_items: 45,
 *     showing_items: 10
 *   }
 * }
 * 
 * CASOS DE USO PRINCIPAIS:
 * - Interface principal de gestão de áreas
 * - Seletores em cascata (categoria → área) em formulários
 * - Navegação hierárquica da plataforma
 * - Relatórios e estatísticas por área
 * - Filtragem de conteúdo por área específica
 * 
 * OPTIMIZAÇÕES DE PERFORMANCE:
 * - Consulta otimizada com INNER JOIN para categorias
 * - Contagem de tópicos em consultas paralelas
 * - Paginação eficiente com LIMIT e OFFSET
 * - Índices em colunas de busca e filtragem
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/', areasController.getAllAreas);

/**
 * GET /api/areas/categoria/:id_categoria
 * Obter todas as áreas de uma categoria específica
 * 
 * FUNCIONALIDADES ESPECIALIZADAS:
 * - Validação automática da existência da categoria
 * - Retorno de áreas ordenadas alfabeticamente por nome
 * - Informações da categoria incluídas na resposta
 * - Contagem total de áreas para a categoria
 * 
 * PARÂMETROS OBRIGATÓRIOS:
 * - id_categoria: Identificador único da categoria pai
 * 
 * RESPOSTA DETALHADA:
 * {
 *   success: true,
 *   categoria: {                      // Dados da categoria solicitada
 *     id_categoria: 1,
 *     nome: "Informática"
 *   },
 *   areas: [                          // Lista de áreas da categoria
 *     {
 *       id_area: 1,
 *       nome: "Programação Web",
 *       id_categoria: 1
 *     },
 *     {
 *       id_area: 2,
 *       nome: "Base de Dados",
 *       id_categoria: 1
 *     }
 *   ],
 *   total_areas: 12                   // Contagem total de áreas
 * }
 * 
 * CASOS DE USO ESPECÍFICOS:
 * - Seletores em cascata para formulários (categoria → área)
 * - Navegação hierárquica entre níveis
 * - Construção de menus dinâmicos por categoria
 * - Relatórios específicos por categoria
 * - Filtragem de conteúdo educacional
 * 
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Categoria deve existir na base de dados
 * - ID da categoria deve ser válido
 * - Retorna 404 se categoria não encontrada
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/categoria/:id_categoria', areasController.getAreasByCategoria);

/**
 * GET /api/areas/:id
 * Obter dados completos de uma área específica
 * 
 * FUNCIONALIDADES DETALHADAS:
 * - Informações completas da área solicitada
 * - Dados da categoria pai incluídos
 * - Lista completa de tópicos associados à área
 * - Contagem total de tópicos para relatórios
 * - Validação automática da existência da área
 * 
 * PARÂMETROS:
 * - id: Identificador único da área (ID primário)
 * 
 * RESPOSTA COMPLETA:
 * {
 *   success: true,
 *   area: {
 *     id_area: 1,
 *     nome: "Programação Web",
 *     id_categoria: 1,
 *     categoria: {                    // Dados da categoria pai
 *       id_categoria: 1,
 *       nome: "Informática"
 *     },
 *     topicos: [                      // Lista de tópicos da área
 *       {
 *         id_topico: 1,
 *         titulo: "HTML e CSS",
 *         ativo: true
 *       },
 *       {
 *         id_topico: 2,
 *         titulo: "JavaScript",
 *         ativo: true
 *       }
 *     ],
 *     total_topicos: 8                // Contagem total de tópicos
 *   }
 * }
 * 
 * CASOS DE USO PRINCIPAIS:
 * - Página de detalhes da área no frontend
 * - Formulários de edição de área existente
 * - Navegação por tópicos da área específica
 * - Análise detalhada da estrutura hierárquica
 * - Relatórios específicos por área
 * 
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Área deve existir na base de dados
 * - ID deve ser um número válido
 * - Retorna 404 se área não encontrada
 * - Validação de integridade dos dados relacionados
 * 
 * ACESSO: Todos os utilizadores autenticados
 */
router.get('/:id', areasController.getAreaById);

// =============================================================================
// ROTAS ADMINISTRATIVAS - Apenas administradores (id_cargo === 1)
// =============================================================================

/**
 * POST /api/areas
 * Criar nova área de formação
 * 
 * OPERAÇÃO CRÍTICA com validações rigorosas de integridade hierárquica
 * 
 * CORPO DA REQUISIÇÃO:
 * {
 *   "nome": "Nome da Nova Área",
 *   "id_categoria": 1
 * }
 * 
 * VALIDAÇÕES OBRIGATÓRIAS IMPLEMENTADAS:
 * - Nome é obrigatório e não pode estar vazio
 * - Categoria é obrigatória e deve existir
 * - Nome deve ser único dentro da mesma categoria
 * - Busca insensível a maiúsculas/minúsculas
 * - Trimming automático de espaços em branco
 * - Utilizador deve ter permissões de administrador
 * 
 * PROCESSO DETALHADO DE CRIAÇÃO:
 * 1. Validar dados de entrada obrigatórios
 * 2. Verificar existência da categoria especificada
 * 3. Verificar unicidade do nome dentro da categoria
 * 4. Iniciar transação para operação atómica
 * 5. Criar área na base de dados
 * 6. Confirmar transação se tudo correr bem
 * 7. Retornar área criada com informações da categoria
 * 
 * RESPOSTA DE SUCESSO (201):
 * {
 *   success: true,
 *   message: "Área criada com sucesso",
 *   area: {
 *     id_area: 15,
 *     nome: "Nome da Nova Área",
 *     categoria: {
 *       id_categoria: 1,
 *       nome: "Informática"
 *     }
 *   }
 * }
 * 
 * CASOS DE ERRO FREQUENTES:
 * - 400: Nome vazio, categoria inválida ou nome já existe na categoria
 * - 403: Utilizador sem permissões de administrador
 * - 404: Categoria especificada não encontrada
 * - 500: Erro na base de dados ou problema de transação
 * 
 * REGRAS DE NEGÓCIO:
 * - Áreas são únicas apenas dentro da mesma categoria
 * - Diferentes categorias podem ter áreas com nomes iguais
 * - Nova área inicia sempre sem tópicos associados
 * 
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
router.post('/', 
  verificarCargo(['admin']), 
  areasController.createArea
);

/**
 * PUT /api/areas/:id
 * Atualizar área existente
 * 
 * OPERAÇÃO DE ATUALIZAÇÃO com suporte para mudança de categoria
 * 
 * PARÂMETROS:
 * - id: Identificador da área a atualizar
 * 
 * CORPO DA REQUISIÇÃO:
 * {
 *   "nome": "Novo Nome da Área",
 *   "id_categoria": 2
 * }
 * 
 * VALIDAÇÕES RIGOROSAS IMPLEMENTADAS:
 * - Área deve existir na base de dados
 * - Novo nome é obrigatório e não pode estar vazio
 * - Nova categoria deve existir (se especificada)
 * - Novo nome deve ser único na categoria (excluindo a própria área)
 * - Verificação de duplicação com outras áreas na categoria
 * - Utilizador deve ter permissões adequadas
 * 
 * PROCESSO DETALHADO DE ATUALIZAÇÃO:
 * 1. Verificar existência da área a atualizar
 * 2. Validar novos dados fornecidos
 * 3. Verificar existência da nova categoria
 * 4. Verificar duplicação excluindo a própria área
 * 5. Iniciar transação para operação atómica
 * 6. Atualizar dados na base de dados
 * 7. Confirmar transação se operação bem-sucedida
 * 8. Retornar área atualizada com informações da categoria
 * 
 * FUNCIONALIDADES AVANÇADAS:
 * - Permite mover área entre categorias diferentes
 * - Preserva contagem atual de tópicos associados
 * - Atualização atómica com transações
 * - Validação de unicidade específica por categoria
 * - Gestão automática de relacionamentos
 * 
 * CASOS DE USO:
 * - Correção de nomes de áreas
 * - Reorganização da estrutura hierárquica
 * - Movimento de áreas entre categorias
 * - Ajustes na taxonomia educacional
 * 
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
router.put('/:id', 
  verificarCargo(['admin']), 
  areasController.updateArea
);

/**
 * DELETE /api/areas/:id
 * Eliminar área de formação
 * 
 * ⚠️  OPERAÇÃO CRÍTICA E IRREVERSÍVEL ⚠️
 * 
 * Esta é uma operação extremamente sensível que afeta diretamente
 * a estrutura hierárquica e pode impactar tópicos, cursos e
 * todo o conteúdo educacional associado.
 * 
 * PARÂMETROS:
 * - id: Identificador da área a eliminar
 * 
 * RESTRIÇÕES DE INTEGRIDADE CRÍTICAS:
 * - Área DEVE existir na base de dados
 * - NÃO pode ter tópicos associados (validação obrigatória)
 * - Operação é completamente irreversível
 * - Pode afetar navegação e estrutura de cursos
 * 
 * VALIDAÇÕES DE SEGURANÇA OBRIGATÓRIAS:
 * 1. Verificar existência da área
 * 2. Contar tópicos associados à área
 * 3. BLOQUEAR eliminação se houver dependências
 * 4. Verificar permissões de administrador
 * 5. Executar dentro de transação para consistência
 * 
 * PROCESSO DE ELIMINAÇÃO SEGURA:
 * 1. Validar existência da área na base de dados
 * 2. Verificar se existem tópicos associados (COUNT query)
 * 3. INTERROMPER operação se houver dependências
 * 4. Iniciar transação para operação atómica
 * 5. Eliminar área da base de dados
 * 6. Confirmar transação apenas se tudo correr bem
 * 7. Retornar confirmação com nome da área eliminada
 * 
 * CASOS DE ERRO FREQUENTES:
 * - 404: Área não encontrada na base de dados
 * - 400: Área tem tópicos associados (BLOQUEIO PRINCIPAL)
 * - 403: Utilizador sem permissões de administrador
 * - 500: Problemas de conectividade ou transação
 * 
 * RESPOSTA DE SUCESSO (200):
 * {
 *   success: true,
 *   message: "Área 'Programação Web' eliminada com sucesso"
 * }
 * 
 * RESPOSTA DE BLOQUEIO (400):
 * {
 *   success: false,
 *   message: "Não é possível eliminar a área pois existem 5 tópico(s) associado(s). 
 *             Remove primeiro os tópicos desta área ou elimina-os 
 *             (o que também removerá cursos e chats associados)."
 * }
 * 
 * NOTA CRÍTICA PARA ADMINISTRADORES:
 * Para eliminar uma área com tópicos associados:
 * 1. Primeiro eliminar ou reatribuir todos os tópicos
 * 2. Verificar se não há cursos ativos nos tópicos
 * 3. Considerar impacto nos utilizadores inscritos
 * 4. Fazer backup dos dados antes de operações críticas
 * 5. Comunicar mudanças aos utilizadores afetados
 * 
 * Esta é uma regra fundamental da hierarquia educacional que
 * garante a integridade de todo o sistema de formação.
 * 
 * ACESSO: Apenas administradores (id_cargo === 1)
 */
router.delete('/:id', 
  verificarCargo(['admin']),
  areasController.deleteArea
);

/**
 * EXPORTAÇÃO DO ROUTER CONFIGURADO
 * 
 * Este router implementa a gestão completa do segundo nível da
 * hierarquia educacional da plataforma de formação.
 * 
 * MIDDLEWARE APLICADO GLOBALMENTE:
 * - verificarToken: Autenticação obrigatória em todas as rotas
 * - verificarCargo: Autorização específica nas rotas administrativas
 * 
 * PADRONIZAÇÃO DAS RESPOSTAS:
 * - Códigos HTTP apropriados (200, 201, 400, 403, 404, 500)
 * - Estrutura JSON consistente com success/error/message
 * - Mensagens de erro em português claro e específico
 * - Dados paginados nas listagens com informações completas
 * - Transações para todas as operações críticas
 * 
 * FUNCIONALIDADES PRINCIPAIS IMPLEMENTADAS:
 * - CRUD completo para áreas de formação
 * - Validação rigorosa de integridade referencial
 * - Paginação e filtros avançados para grandes volumes
 * - Filtragem em cascata (categoria → área)
 * - Contadores dinâmicos de tópicos por área
 * - Gestão granular de permissões por tipo de utilizador
 * - Suporte completo para navegação hierárquica
 * - Prevenção de operações destrutivas sem validação
 * 
 * INTEGRAÇÃO HIERÁRQUICA:
 * - Relacionamento direto com categorias (nível superior)
 * - Relacionamento direto com tópicos (nível inferior)
 * - Validação de dependências em ambas as direções
 * - Suporte para reorganização da estrutura educacional
 * 
 * CONSIDERAÇÕES DE PERFORMANCE:
 * - Consultas otimizadas com JOINs apropriados
 * - Contagens dinâmicas em consultas paralelas
 * - Transações mínimas mas consistentes
 * - Índices apropriados em colunas de busca e relação
 * - Cache estratégico para dados frequentemente acedidos
 * 
 * CASOS DE USO AVANÇADOS:
 * - Reorganização da taxonomia educacional
 * - Migração de conteúdo entre áreas
 * - Relatórios hierárquicos detalhados
 * - Análise de distribuição de conteúdo
 * - Gestão de permissões por área específica
 */
module.exports = router;