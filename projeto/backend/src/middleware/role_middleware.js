/**
 * Middleware para verificar a função/cargo do utilizador
 * @param {Array} rolesPermitidas - Array com os nomes dos cargos permitidos
 * @returns {Function} Middleware
 */
module.exports = (rolesPermitidas) => {
  // Mapeamento de IDs para nomes de cargos
  const cargoMap = {
    1: 'admin',
    2: 'gestor',
    3: 'formador',
    4: 'aluno',
    5: 'utilizador'
    // Adicione outros cargos conforme necessário
  };

  return (req, res, next) => {
    try {
      // Verificar se o utilizador está autenticado
      if (!req.utilizador) {
        return res.status(401).json({
          success: false,
          message: "Acesso não autorizado: Utilizador não autenticado"
        });
      }

      console.log('A verificar permissões para utilizador:', req.utilizador);
      
      // Tentar obter o cargo do utilizador de várias maneiras
      let temPermissao = false;
      
      // Verificação por nome de cargo (string)
      if (req.utilizador.cargo) {
        const cargoUtilizador = req.utilizador.cargo.toLowerCase();
        temPermissao = rolesPermitidas.some(role => role.toLowerCase() === cargoUtilizador);
        console.log(`Verificação por nome de cargo: ${cargoUtilizador}, tem permissão: ${temPermissao}`);
      }
      
      // Se não achou por nome ou não tem permissão, tenta por ID
      if (!temPermissao && req.utilizador.id_cargo) {
        const idCargo = req.utilizador.id_cargo;
        const nomeCargo = cargoMap[idCargo];
        
        if (nomeCargo) {
          temPermissao = rolesPermitidas.some(role => role.toLowerCase() === nomeCargo.toLowerCase());
          console.log(`Verificação por ID de cargo: ${idCargo} (${nomeCargo}), tem permissão: ${temPermissao}`);
        }
      }

      // Se não tem permissão de nenhuma forma
      if (!temPermissao) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado: Não tem permissão para realizar esta ação"
        });
      }
      
      // Se chegou aqui, o utilizador tem permissão
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