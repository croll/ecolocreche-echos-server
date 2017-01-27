/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('node', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_node_parent: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'node',
        key: 'id'
      }
    }
  }, {
    tableName: 'node',
    timestamps: false,
  });
};
