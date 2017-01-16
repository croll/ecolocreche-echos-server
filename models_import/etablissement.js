/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('etablissement', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    adresse: {
      type: DataTypes.STRING,
      allowNull: true
    },
    codepostal: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ville: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    statut: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
    tableName: 'etablissement',
    timestamps: false,
  });
};
