/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('labelingfile', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_establishment: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'establishment',
        key: 'id'
      }
    },
    id_labelingfile_src: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'labelingfile',
        key: 'id'
      }
    },
    id_audit_1: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'audit',
        key: 'id'
      }
    },
    id_audit_2: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'audit',
        key: 'id'
      }
    },
    id_audit_actionrecap: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'audit',
        key: 'id'
      }
    },
  }, {
    tableName: 'labelingfile',
    timestamps: true,
  });
};
