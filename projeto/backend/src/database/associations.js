// models/associations.js
const User = require("./User");
const Curso = require("./Curso");
const InscricaoCurso = require("./InscricaoCurso");

// Relação muitos-para-muitos
User.belongsToMany(Curso, {
  through: InscricaoCurso,
  foreignKey: "id_utilizador",
  otherKey: "id_curso",
  as: "cursos"
});

Curso.belongsToMany(User, {
  through: InscricaoCurso,
  foreignKey: "id_curso",
  otherKey: "id_utilizador",
  as: "utilizadores"
});

module.exports = { User, Curso, InscricaoCurso };
