/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_password_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_account_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    user_rememberme_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_creation_timestamp: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    user_last_login_timestamp: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    user_failed_logins: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    user_last_failed_login: {
      type: DataTypes.INTEGER(10),
      allowNull: true
    },
    user_password_reset_hash: {
      type: DataTypes.CHAR(40),
      allowNull: true
    },
    user_password_reset_timestamp: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: false,
  });
};
