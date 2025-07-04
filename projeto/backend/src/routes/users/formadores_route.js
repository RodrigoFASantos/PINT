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
 * @returns {Function} Middleware que valida as permissões
 */
const verificarCargo = (cargosPermitidos) => {
  return async (req, res, next) => {
    try {
      const cargo = req.user.id_cargo || 0;
      
      // Mapeamento dos identificadores numéricos para nomes legíveis
      const cargoMap = {
        1: 'admin',
        2: 'formador', 
        3: 'formando'
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
 * Rota para obter lista paginada de todos os formadores
 * Permite consulta pública dos formadores registados no sistema
 * Suporta parâmetros de paginação via query string
 */
router.get('/', formadorController.getAllFormadores);

/**
 * Rota para registo de novos formadores
 * Permite que qualquer pessoa se registe como formador (sujeito a aprovação)
 * Envia email de confirmação após registo bem-sucedido
 */
router.post('/register', formadorController.registerFormador);

// =============================================================================
// ROTAS DE CONSULTA POR IDENTIFICADOR
// =============================================================================

/**
 * Rota para obter dados detalhados de um formador específico
 * Inclui informações sobre especializações e cursos ministrados
 * Acessível publicamente para visualização de perfis
 */
router.get('/:id', formadorController.getFormadorById);

/**
 * Rota para obter lista de cursos ministrados por um formador
 * Mostra o histórico de cursos onde o formador foi responsável
 */
router.get('/:id/cursos', formadorController.getCursosFormador);

// =============================================================================
// ROTAS PROTEGIDAS - Requerem autenticação
// =============================================================================

/**
 * Rota para obter perfil completo do formador autenticado
 * Retorna dados pessoais, especializações e cursos do utilizador atual
 * Apenas acessível pelo próprio formador após autenticação
 */
router.get("/profile", verificarToken, formadorController.getFormadorProfile);

// =============================================================================
// GESTÃO DE CATEGORIAS DE ESPECIALIZAÇÃO
// =============================================================================

/**
 * Rota para consultar categorias associadas a um formador
 * Lista todas as áreas de conhecimento em que o formador tem competências
 */
router.get('/:id/categorias', formadorController.getCategoriasFormador);

/**
 * Rota para adicionar novas categorias a um formador
 * Restrita a administradores e ao próprio formador
 * Permite expansão das áreas de especialização
 */
router.post('/:id/categorias', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.addCategoriasFormador
);

/**
 * Rota para remover categoria específica de um formador
 * Permite remoção de especializações que já não são relevantes
 * Restrita a administradores e ao próprio formador
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
 * Rota para consultar áreas específicas de um formador
 * Lista competências detalhadas dentro de cada categoria
 */
router.get('/:id/areas', formadorController.getAreasFormador);

/**
 * Rota para adicionar novas áreas específicas a um formador
 * Adiciona automaticamente a categoria pai se ainda não estiver associada
 * Restrita a administradores e ao próprio formador
 */
router.post('/:id/areas', 
  verificarToken, 
  verificarCargo(['admin', 'formador']), 
  formadorController.addAreasFormador
);

/**
 * Rota para remover área específica de um formador
 * Remove competência específica mantendo outras na mesma categoria
 * Restrita a administradores e ao próprio formador
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
 * Rota para atualização completa de dados de um formador
 * Permite modificação de informações pessoais e profissionais
 * Acesso restrito apenas a administradores do sistema
 */
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin']), 
  formadorController.updateFormador
);

/**
 * Rota para remoção de estatuto de formador
 * Converte formador para formando e remove especializações
 * Apenas possível se não houver cursos ativos associados
 * Acesso restrito apenas a administradores do sistema
 */
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin']), 
  formadorController.deleteFormador
);

module.exports = router;