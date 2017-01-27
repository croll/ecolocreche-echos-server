/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('choice_hist', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_choice: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'choice',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    impact: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
  }, {
    tableName: 'choice_hist',
    timestamps: true,
    paranoid: true,
  });
};
