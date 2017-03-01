/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    account_type: {
      type: DataTypes.ENUM('admin','superagent','agent'),
      allowNull: false,
      defaultValue: "agent"
    },
    rememberme_token: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    last_login_timestamp: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    failed_logins: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    last_failed_login: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    password_reset_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password_reset_timestamp: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
  });
};
