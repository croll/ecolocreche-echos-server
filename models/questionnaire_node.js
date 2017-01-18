/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('questionnaire_node', {
    id_questionnaire: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'questionnaire',
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
    tableName: 'questionnaire_node'
  });
};