/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inquiryform', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nodeslist: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    }
  }, {
    tableName: 'inquiryform',
    timestamps: true,
  });
};
