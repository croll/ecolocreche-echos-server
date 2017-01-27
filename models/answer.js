/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('answer', {
    id_audit: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'audit',
        key: 'id'
      }
    },
    id_node: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    ignored: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'answer',
    timestamps: true,
  });
};
