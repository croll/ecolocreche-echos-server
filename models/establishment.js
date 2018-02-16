/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('establishment', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    postalcode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('creche','halte-garderie','micro-creche','multi-accueil','relais-d-assistante','autre','assistant-maternel'),
      allowNull: false,
      defaultValue: "autre"
    },
    status: {
      type: DataTypes.ENUM('association','association-parentale','entreprise','publique','indetermine','autre','domicile','creche-familiale','ram','mam'),
      allowNull: false,
      defaultValue: "autre"
    }
  }, {
    tableName: 'establishment',
    timestamps: true,
  });
};
