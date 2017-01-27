/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('node_hist', {
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
    },
    type: {
      type: DataTypes.ENUM('directory','q_radio','q_checkbox','q_percents','q_text','q_numeric'),
      allowNull: false,
      defaultValue: "directory"
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    tableName: 'node_hist',
    timestamps: true,
    paranoid: true,
  });
};
