/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reponse', {
    identifiant: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    audit: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    theme: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    rubrique: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    question: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    reponseIgnoree: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    valeur: {
      type: DataTypes.STRING,
      allowNull: true
    },
    horodatage: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    tableName: 'reponse',
    timestamps: false,
  });
};
