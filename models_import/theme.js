/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('theme', {
    identifiant: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    intitule: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    couleur: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    etat: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    horodatage: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'theme',
    timestamps: false,
  });
};
