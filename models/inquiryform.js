/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inquiryform', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
  }, {
    tableName: 'inquiryform',
    timestamps: false,
  });
};
