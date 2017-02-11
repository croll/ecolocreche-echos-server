/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('choice', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_node: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'node',
        key: 'id'
      }
    }
  }, {
    tableName: 'choice',
    timestamps: true, // sequelize want timestamps ON if we want paranoid, so, timestamps is ON here
    paranoid: true,
  });
};
