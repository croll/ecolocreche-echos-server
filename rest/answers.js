var restify = require('restify');
var Promise = require("bluebird");

module.exports = function(server, epilogue, models, permchecks) {


    server.post('/rest/answers/:id_audit/:id_node',
        permchecks.haveAgent,
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
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

}
