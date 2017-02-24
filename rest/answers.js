var dbtools = require(__dirname + '/../lib/dbtools.js');
var restify = require('restify');
var Promise = require("bluebird");

module.exports = function(server, epilogue, models, permchecks) {


    server.post('/rest/answers/:id_audit/:id_node',

        // check perms
        function(req, res, next) {
            if (permchecks._haveAgent(req, res, next)) {
                return permchecks._ret(false, req, res, next);
            }
            if (req.params.id_audit && req.params.audit_key) {
                models.audit.findOne({
                    where: {
                        id: req.params.id_audit,
                        key: req.params.audit_key,
                    }
                }).then(function(audit) {
                    if (audit) {
                        req.audit = audit;
                        return next();
                    } else {
                        return permchecks._ret(true, req, res, next); // return perm denied
                    }
                });
            } else {
                return permchecks._ret(true, req, res, next); // return perm denied
            }
        },

        // do the job
        function (req, res, next) {
            return models.answer.upsert(
                req.params,
                {
                    fields: [ 'id_audit', 'id_node', 'ignored', 'value'],
                }
            ).then(function() {
                return models.answer.findOne({
                    where: {
                        id_audit: req.params.id_audit,
                        id_node: req.params.id_node,
                    }
                });
            }).then(function(answer) {
                res.send(answer);
                return dbtools.update_audit_cached_complete(models, req.params.id_audit);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

}
