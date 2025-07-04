/**
 * Middleware de verificação de roles/cargos por nome
 * Permite autorização baseada em nomes de cargos em vez de IDs numéricos
 * Oferece maior flexibilidade e legibilidade no código
 */

/**
 * Mapeamento entre IDs de cargo e nomes correspondentes
 * Facilita a tradução entre sistemas numéricos e textuais
 */
const cargoMap = {
  1: 'admin',
  2: 'gestor', 
  3: 'formador',
  4: 'aluno',
  5: 'utilizador'
};

/**
 * Cria middleware de verificação de roles baseado em nomes
 * @param {Array<string>} rolesPermitidas - Array com nomes dos cargos autorizados
 * @returns {Function} Middleware de verificação de roles
 * 
 * @example
 * // Permitir apenas admins e gestores
 * router.get('/admin-only', roleMiddleware(['admin', 'gestor']), controller);
 */
module.exports = (rolesPermitidas) => {
  return (req, res, next) => {
    try {
      // Verificar se o utilizador está autenticado
      if (!req.utilizador) {
        return res.status(401).json({
          success: false,
          message: "Acesso não autorizado: Utilizador não autenticado"
        });
      }
      
      let temPermissao = false;
      
      // Verificação por nome de cargo (directo do token)
      if (req.utilizador.cargo) {
        const cargoUtilizador = req.utilizador.cargo.toLowerCase();
        temPermissao = rolesPermitidas.some(role => role.toLowerCase() === cargoUtilizador);
      }
      
      // Se não encontrou por nome, tentar por ID de cargo
      if (!temPermissao && req.utilizador.id_cargo) {
        const idCargo = req.utilizador.id_cargo;
        const nomeCargo = cargoMap[idCargo];
        
        if (nomeCargo) {
          temPermissao = rolesPermitidas.some(role => role.toLowerCase() === nomeCargo.toLowerCase());
        }
      }

      // Verificar se o utilizador tem permissão
      if (!temPermissao) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado: Não tem permissão para realizar esta acção"
        });
      }
      
      // Utilizador autorizado, continuar
      next();
    } catch (error) {
      console.error("Erro no middleware de verificação de cargo:", error.message);
      res.status(500).json({
        success: false,
        message: "Erro interno ao verificar permissões",
        error: error.message
      });
    }
  };
};