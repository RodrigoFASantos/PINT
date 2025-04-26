/**
 * Middleware para verificar a função/cargo do usuário
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
    5: 'user'
    // Adicione outros cargos conforme necessário
  };

  return (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Acesso não autorizado: Usuário não autenticado"
        });
      }

      console.log('Verificando permissões para usuário:', req.user);
      
      // Tentar obter o cargo do usuário de várias maneiras
      let temPermissao = false;
      
      // Verificação por nome de cargo (string)
      if (req.user.cargo) {
        const cargoUser = req.user.cargo.toLowerCase();
        temPermissao = rolesPermitidas.some(role => role.toLowerCase() === cargoUser);
        console.log(`Verificação por nome de cargo: ${cargoUser}, tem permissão: ${temPermissao}`);
      }
      
      // Se não achou por nome ou não tem permissão, tenta por ID
      if (!temPermissao && req.user.id_cargo) {
        const idCargo = req.user.id_cargo;
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