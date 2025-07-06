const express = require('express');
const router = express.Router();
const formadorController = require('../../controllers/users/formador_ctrl');
const uploadUtils = require('../../middleware/upload');
const verificarToken = require('../../middleware/auth');

/**
 * ROTAS PARA GESTÃO COMPLETA DE FORMADORES
 * 
 * Este ficheiro define todas as rotas relacionadas com a gestão de formadores,
 * incluindo registo, consulta, atualização e administração de especializações.
 * As rotas estão organizadas por níveis de acesso: públicas, protegidas e administrativas.
 */

/**
 * Middleware para verificação de permissões baseadas no cargo do utilizador
 * Controla o acesso aos recursos conforme o tipo de utilizador autenticado
 * 
 * @param {Array} cargosPermitidos - Lista de cargos que podem aceder ao recurso
 * @returns {Function} Middleware que valida as permissões do utilizador
 */
const verificarCargo = (cargosPermitidos) => {
  return async (req, res, next) => {
    try {
      const cargo = req.user.id_cargo || 0;
      
      // Mapeamento dos identificadores numéricos para nomes legíveis
      const cargoMap = {
        1: 'admin',      // Administrador do sistema
        2: 'formador',   // Formador certificado
        3: 'formando'    // Formando/Estudante
      };
      
      const cargoNome = cargoMap[cargo] || 'desconhecido';
      
      // Verifica se o cargo atual está na lista de cargos permitidos
      if (!cargosPermitidos.includes(cargoNome)) {
        return res.status(403).json({ 
          message: "Acesso negado. Não tens permissão para aceder a este recurso." 
        });
      }
      
      next();
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      return res.status(500).json({ 
        message: "Erro interno ao verificar permissões", 
        error: error.message 
      });
    }
  };
};

// =============================================================================
// ROTAS PÚBLICAS - Acessíveis sem autenticação
// =============================================================================

/**
 * GET /formadores
 * Obtém lista paginada de todos os formadores registados no sistema
 * 
 * Permite consulta pública dos formadores disponíveis com suporte a paginação.
 * Aceita parâmetros de query: page (número da página) e limit (itens por página).
 * 
 * @query {number} page - Número da página (padrão: 1)
 * @query {number} limit - Itens por página (padrão: 10, máximo: 50)
 * @returns {Object} Lista paginada de formadores com metadados
 */
router.get('/', formadorController.getAllFormadores);

/**
 * POST /formadores/register
 * Regista novo candidato a formador no sistema
 * 
 * Permite que qualquer pessoa se candidate a formador. O registo fica pendente
 * de aprovação e requer confirmação por email antes de ser ativado.
 * 
 * @body {string} nome - Nome completo do candidato
 * @body {string} email - Email válido para contacto
 * @body {string} password - Senha de acesso
 * @body {number} idade - Idade (deve estar entre 18 e 100 anos)
 * @body {string} telefone - Número de telefone
 * @body {string} morada - Morada completa
 * @body {string} codigo_postal - Código postal
 * @body {Array} categorias - IDs das categorias de especialização (opcional)
 * @body {Array} areas - IDs das áreas de conhecimento (opcional)
 * @returns {Object} Confirmação de registo pendente
 */
router.post('/register', formadorController.registerFormador);

// =============================================================================
// ROTAS DE CONSULTA POR IDENTIFICADOR
// =============================================================================

/**
 * GET /formadores/:id
 * Obtém dados detalhados de um formador específico
 * 
 * Retorna informação completa sobre um formador incluindo especializações
 * e cursos ministrados. Acessível publicamente para visualização de perfis.
 * 
 * @param {number} id - ID único do formador
 * @returns {Object} Dados completos do formador
 */
router.get('/:id', formadorController.getFormadorById);

/**
 * GET /formadores/:id/cursos
 * Obtém lista de cursos ministrados por um formador específico
 * 
 * Apresenta o histórico completo de cursos onde o formador foi responsável,
 * incluindo informações sobre categoria, área e datas.
 * 
 * @param {number} id - ID único do formador
 * @returns {Array} Lista de cursos ministrados
 */
router.get('/:id/cursos', formadorController.getCursosFormador);

// =============================================================================
// ROTAS PROTEGIDAS - Requerem autenticação válida
// =============================================================================

/**
 * GET /formadores/profile
 * Obtém perfil completo do formador autenticado
 * 
 * Retorna dados pessoais, especializações, cursos ministrados e inscrições
 * do utilizador atual. Esta rota é utilizada para dashboards e áreas pessoais.
 * 
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Perfil completo com dados pessoais e profissionais
 */
router.get("/profile", verificarToken, formadorController.getFormadorProfile);

// =============================================================================
// GESTÃO DE CATEGORIAS DE ESPECIALIZAÇÃO
// =============================================================================

/**
 * GET /formadores/:id/categorias
 * Consulta categorias associadas a um formador
 * 
 * Lista todas as áreas de conhecimento gerais em que o formador tem
 * competências reconhecidas ou certificadas.
 * 
 * @param {number} id - ID único do formador
 * @returns {Array} Lista de categorias de especialização
 */
router.get('/:id/categorias', formadorController.getCategoriasFormador);

/**
 * POST /formadores/:id/categorias
 * Adiciona novas categorias de especialização a um formador
 * 
 * Permite expandir as áreas de conhecimento do formador. Acesso restrito
 * a administradores e ao próprio formador.
 * 
 * @param {number} id - ID único do formador
 * @body {Array} categorias - Array com IDs das categorias a adicionar
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Confirmação das categorias adicionadas
 */
router.post('/:id/categorias', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.addCategoriasFormador
);

/**
 * DELETE /formadores/:id/categorias/:categoriaId
 * Remove categoria específica de um formador
 * 
 * Permite remoção de especializações que já não são relevantes ou válidas.
 * Acesso restrito a administradores e ao próprio formador.
 * 
 * @param {number} id - ID único do formador
 * @param {number} categoriaId - ID da categoria a remover
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Confirmação da remoção
 */
router.delete('/:id/categorias/:categoriaId', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.removeFormadorCategoria
);

// =============================================================================
// GESTÃO DE ÁREAS ESPECÍFICAS DE CONHECIMENTO
// =============================================================================

/**
 * GET /formadores/:id/areas
 * Consulta áreas específicas de conhecimento de um formador
 * 
 * Lista competências detalhadas dentro de cada categoria, incluindo
 * a categoria pai de cada área especializada.
 * 
 * @param {number} id - ID único do formador
 * @returns {Array} Lista de áreas específicas com categorias pai
 */
router.get('/:id/areas', formadorController.getAreasFormador);

/**
 * POST /formadores/:id/areas
 * Adiciona novas áreas específicas a um formador
 * 
 * Permite especialização mais detalhada dentro das categorias existentes.
 * Adiciona automaticamente a categoria pai se ainda não estiver associada.
 * Acesso restrito a administradores e ao próprio formador.
 * 
 * @param {number} id - ID único do formador
 * @body {Array} areas - Array com IDs das áreas a adicionar
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Confirmação das áreas adicionadas
 */
router.post('/:id/areas', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.addAreasFormador
);

/**
 * DELETE /formadores/:id/areas/:areaId
 * Remove área específica de conhecimento de um formador
 * 
 * Remove competência específica mantendo outras especializações na mesma categoria.
 * Acesso restrito a administradores e ao próprio formador.
 * 
 * @param {number} id - ID único do formador
 * @param {number} areaId - ID da área a remover
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Confirmação da remoção
 */
router.delete('/:id/areas/:areaId', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.removeFormadorArea
);

// =============================================================================
// ROTAS ADMINISTRATIVAS - Apenas para administradores
// =============================================================================

/**
 * PUT /formadores/:id
 * Atualização completa de dados de um formador
 * 
 * Permite modificação de informações pessoais e profissionais do formador.
 * Inclui validações de formato e verificação de unicidade de email.
 * Acesso restrito apenas a administradores do sistema.
 * 
 * @param {number} id - ID único do formador
 * @body {string} nome - Novo nome (opcional)
 * @body {string} email - Novo email (opcional)
 * @body {string} foto_perfil - URL da foto de perfil (opcional)
 * @body {string} telefone - Novo telefone (opcional)
 * @body {string} data_nascimento - Nova data de nascimento (opcional)
 * @body {string} biografia - Nova biografia (opcional)
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Dados atualizados do formador
 */
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin']), 
  formadorController.updateFormador
);

/**
 * DELETE /formadores/:id
 * Remoção de estatuto de formador
 * 
 * Converte formador para formando e remove todas as especializações associadas.
 * Apenas possível se não houver cursos ativos associados ao formador.
 * Acesso restrito apenas a administradores do sistema.
 * 
 * @param {number} id - ID único do formador
 * @header {string} Authorization - Token Bearer para autenticação
 * @returns {Object} Confirmação da alteração de estatuto
 */
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin']), 
  formadorController.deleteFormador
);

module.exports = router;