'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json');
var db        = {};

var seqoptions = {
    logging: false,
    define: {
        timestamps: true,
        paranoid: false,
    }
}

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.sql.database, config.sql.username, config.sql.password, seqoptions);
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;



// associations
db.node.hasMany(db.node_hist, { foreignKey: "id_node"});
db.audit.belongsTo(db.establishment, { foreignKey: "id_establishment", onDelete: "cascade"});
db.audit.belongsTo(db.audit, { as: 'audit_src', foreignKey: "id_audit_src" });
db.answer.belongsTo(db.audit, { foreignKey: "id_audit", onDelete: "cascade"});
