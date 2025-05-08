const autorizar = (cargosPermitidos) => {
  return (req, res, next) => {
    // Verificar se o utilizador está autenticado (verificarToken deve ser chamado antes)
    if (!req.utilizador) {
      return res.status(401).json({ message: "Não autenticado!" });
    }
    
    // Verificar se o cargo do utilizador está na lista de cargos permitidos
    if (!cargosPermitidos.includes(req.utilizador.id_cargo)) {
      return res.status(403).json({ message: "Sem permissão para esta ação!" });
    }
    
    next();
  };
};

module.exports = autorizar;