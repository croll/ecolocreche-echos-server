/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('audit', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_establishment: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'establishment',
        key: 'id'
      }
    },
    id_inquiryform: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'inquiryform',
        key: 'id'
      }
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    synthesis: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'audit',
    timestamps: true,
  });
};
