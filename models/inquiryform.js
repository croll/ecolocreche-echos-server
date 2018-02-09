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
    mail_from: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    mail_title: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    mail_body: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    audit_report_header: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
  }, {
    tableName: 'inquiryform',
    timestamps: true,
    paranoid: true,
  });
};
