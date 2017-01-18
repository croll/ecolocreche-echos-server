var Sequelize = require('sequelize');
var Promise = require("bluebird");

var config    = require(__dirname + '/config/config.json');

var models = require(__dirname + '/models');
var models_import = require(__dirname + '/models_import');

models.sequelize.sync({
    force: true,
}).then(function() {
    models_import.users.findAll().then(function(users) {
        var p = new Promise(function (resolve, reject) {
            resolve();
        });
        users.forEach(function(user) {
            p=p.then(function() {
                return models.users.create({
                    name: user.user_name,
                    password_hash: user.user_password_hash,
                    email: user.user_email,
                    account_type: user.user_account_type ? 'agent' : 'admin',
                    rememberme_token: user.user_rememberme_token ? user.user_rememberme_token : '',
                    creation_timestamp: user.user_creation_timestamp ? user.user_creation_timestamp : "1975-02-06",
                }).then(function() {
                    console.log("user "+user.user_name+" imported.");
                }, function(err) {
                    console.log("user "+user.user_name+" error: ", err);
                });
            });
        });
        return p;
    }).then(function() {
        console.log("users imported ok");
    }, function(err) {
        console.error("can't import users: ", err);
    });
}, function(err) {
    console.error("can't sync db ", err);
});
