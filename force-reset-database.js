var Sequelize = require('sequelize');
var config    = require(__dirname + '/config/config.json');
var models = require(__dirname + '/models');

// Create database
models.sequelize
  .sync({ force: true })
  .then(function() {
      console.log('database reseted !');
  });
