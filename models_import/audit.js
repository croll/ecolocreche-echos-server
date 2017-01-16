/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('audit', {
    identifiant: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    etablissement: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    cle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    en_cours: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    synthese: {
      type: DataTypes.STRING,
      allowNull: false
    },
    horodatage: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'audit',
    timestamps: false,
  });
};
