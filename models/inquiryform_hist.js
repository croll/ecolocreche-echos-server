/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inquiryform_hist', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    nodeslist: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    position: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    }
  }, {
    tableName: 'inquiryform_hist',
    timestamps: true,
    paranoid: true,
  });
};
