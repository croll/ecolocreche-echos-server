/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('audit', {
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
    id_inquiryform: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'inquiryform',
        key: 'id'
      }
    },
    id_audit_src: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'audit',
        key: 'id'
      }
    },
    inquiry_type: {
      type: DataTypes.ENUM('audit','recapaction'),
      allowNull: false,
      defaultValue: "audit"
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    date_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    synthesis: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cached_percent_complete: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    cached_percent_ignored: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    }
  }, {
    tableName: 'audit',
    timestamps: true,
    setterMethods : {
        active: function(value) {
            this.setDataValue('active', value); // always do the default behaviour
            if (value == false && this.previous('active') == true) {
                this.setDataValue('date_end', sequelize.fn('NOW'));
            } else if (value == true) {
                this.setDataValue('date_end', null);
            }
        },
        date_end: function(value) {
            // do nothing, we don't allow update date_end directly
        },
    }
  });
};
