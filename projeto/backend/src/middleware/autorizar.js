/**
 * Middleware de autorização baseado em cargos/roles
 * Controla o acesso a recursos baseado no cargo do utilizador autenticado
 */

/**
 * Cria middleware de autorização para cargos específicos
 * @param {Array<number>} cargosPermitidos - Array com IDs dos cargos autorizados
 * @returns {Function} Middleware de autorização
 */
const autorizar = (cargosPermitidos) => {
  return (req, res, next) => {
    // Verificar se o utilizador está autenticado
    if (!req.utilizador) {
      return res.status(401).json({ message: "Não autenticado!" });
    }
    
    // Verificar se o cargo do utilizador está autorizado
    if (!cargosPermitidos.includes(req.utilizador.id_cargo)) {
      return res.status(403).json({ message: "Sem permissão para esta acção!" });
    }
    
    // Utilizador autorizado, continuar
    next();
  };
};

module.exports = autorizar;