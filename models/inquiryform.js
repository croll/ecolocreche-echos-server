/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inquiryform', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    inquiry_type: {
      type: DataTypes.ENUM('audit','recapaction'),
      allowNull: false,
      defaultValue: "audit"
    },
  }, {
    tableName: 'inquiryform',
    timestamps: true,
    paranoid: true,
  });
};
