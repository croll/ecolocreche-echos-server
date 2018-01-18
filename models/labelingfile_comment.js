/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('labelingfile_comment', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_labelingfile: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'labelingfile',
        key: 'id'
      }
    },
    id_node: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'node',
        key: 'id'
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'labelingfile_comment',
    timestamps: true,
  });
};
