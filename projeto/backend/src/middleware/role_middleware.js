/**
 * Middleware para verificar a função/cargo do usuário
 * @param {Array} rolesPermitidas - Array com os nomes dos cargos permitidos
 * @returns {Function} Middleware
 */
module.exports = (rolesPermitidas) => {
    return (req, res, next) => {
      try {
        // Verificar se o usuário está autenticado e tem um cargo
        if (!req.user || !req.user.cargo) {
          return res.status(401).json({
            success: false,
            message: "Acesso não autorizado: Usuário não autenticado ou sem cargo definido"
          });
        }
  
        // Verificar o nome do cargo na coleção de cargos permitidos
        const cargoUser = req.user.cargo.toLowerCase();
        const rolePermitida = rolesPermitidas.some(
          role => role.toLowerCase() === cargoUser
        );
  
        if (!rolePermitida) {
          return res.status(403).json({
            success: false,
            message: "Acesso negado: Você não tem permissão para realizar esta ação"
          });
        }
        
        // Se chegou aqui, o usuário tem permissão
        next();
      } catch (error) {
        console.error("Erro no middleware de verificação de cargo:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno ao verificar permissões",
          error: error.message
        });
      }
    };
  };