/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inqueryform_node', {
    id_inqueryform: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'inqueryform',
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
    }
  }, {
    tableName: 'inqueryform_node'
  });
};
