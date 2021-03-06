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
      type: DataTypes.ENUM('directory','q_radio','q_checkbox','q_percents','q_text','q_numeric','q_wysiwyg'),
      allowNull: false,
      defaultValue: "directory"
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
    privcomment: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    family: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
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
    linked_to_node_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'node',
        key: 'id'
      }
    },
  }, {
    tableName: 'node_hist',
    timestamps: true,
    paranoid: false,
  });
};
