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
    },
    inquiry_type: {
      type: DataTypes.ENUM('audit','recapaction'),
      allowNull: false,
      defaultValue: "audit"
    },
  }, {
    tableName: 'node',
    timestamps: true, // sequelize want timestamps ON if we want paranoid, so, timestamps is ON here
    paranoid: true,
  });
};
