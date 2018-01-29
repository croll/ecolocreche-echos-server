var Sequelize = require('sequelize');
var Promise = require("bluebird");

var config    = require(__dirname + '/config/config.json');
var models = require(__dirname + '/models');
var dbtools = require(__dirname + '/lib/dbtools.js');

function update_audit_cached_complete() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### update_audit_cached_complete ...");
        console.log("#########");
        resolve();
    });

    // import des audits
    p = p.then(function() {
        return models.audit.findAll();
    });
    p = p.then(function(audits) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        audits.forEach(function(audit) {
            p2=p2.then(function(answer_counts) {
                process.stdout.write('.');
                return dbtools.update_audit_cached_complete(models, audit.id);
            });
        });
        return p2;
    }).then(function() {
        console.log("\naudit update_audit_cached_complete ok");
    }, function(err) {
        console.error("\ncan't update_audit_cached_complete audit: ", err);
    });

    return p;
}


models.sequelize.sync({
    force: false,
}).then(function() {
    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    // cache des % complete d'audits
    p = p.then(function() {
        return update_audit_cached_complete();
    });

    // end
    p = p.then(function() {
        console.log("THE END");
    });
    return p;

}, function(err) {
    console.error("can't sync db ", err);
});
