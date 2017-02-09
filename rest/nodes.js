var dbtools = require(__dirname + '/../lib/dbtools.js');
var restify = require('restify');
var Promise = require("bluebird");

module.exports = function(server, epilogue, models, permchecks) {


    /*
     * list any directories
     */
    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories', '/rest/directories/:id'],
        model: models.node,
        include: [{
            model: models.node_hist
        }],
    });
    nodeResource.use(permchecks.default_permissions);

    /*
     * list nodes at moment
     *
     * optional params :
     *  - date: <date string> : return nodes has they where on this date, '2222-12-22' by default
     *  - id_node_parent : null by default
     */
    server.get('/rest/hist/nodes', function (req, res, next) {
        if (!('id_node_parent' in req.params)) {
            req.params.id_node_parent="null";
        }
        return dbtools.getLatestNodeHist(models, req.params).then(function(dirs) {
            res.send(dirs);
        }, function(err) {
            console.error(err);
            return next(new restify.InternalServerError(err));
        });
    });

    /*
     * get node at moment
     *
     * optional params :
     *  - date: <date string> : return nodes has they where on this date, '2222-12-22' by default
     *  - id_node_parent : not very usefull here
     */
    server.get('/rest/hist/nodes/:id_node', function (req, res, next) {
        return dbtools.getLatestNodeHist(models, req.params).then(function(dir_hist) {
            if (dir_hist === undefined) {
                return next(new restify.NotFoundError("node does not exists"));
            } else {
                return dir_hist;
            }
        }).then(function(dir_hist) {
            return dbtools.getNodePath(models, dir_hist.id_node).then(function(path) {
                dir_hist.nodepath = path;
                return dir_hist;
            });
        }).then(function(dir_hist) {
            if (dir_hist.type != 'directory') { // this is a question, so also take the choices of it
                return dbtools.getLatestChoiceHist(models, req.params).then(function(choices_hist) {
                    dir_hist.choices = choices_hist;
                    if (req.params.id_audit) { // this is an audit, so also take the answer of the question
                        models.answer.findOne({
                            where: {
                                id_audit: req.params.id_audit,
                                id_node: dir_hist.id_node,
                            },
                        }).then(function(answer) {
                            dir_hist.answer = answer;
                            res.send(dir_hist);
                        })
                    } else {
                        res.send(dir_hist);
                    }
                });
            } else {
                res.send(dir_hist);
            }
        }, function(err) {
            console.error(err);
            return next(new restify.InternalServerError(err));
        });
    });

    /*
     * add a new node
     *
     * optional params :
     *  - id_node_parent : null by default
     */
    server.post('/rest/hist/nodes', function (req, res, next) {
        return models.node.create({
            id_node_parent: 'id_node_parent' in req.params && req.params.id_node_parent ? req.params.id_node_parent : null,
        }).then(function(node) {
            return models.node_hist.create({
                id_node: node.get('id'),
                type: req.params.type,
                title: req.params.title,
                description: req.params.description,
                position: req.params.position,
                color: req.params.color
            });
        }).then(function(node_hist) {
            if (node_hist.get("type") == "directory") {
                return node_hist;
            } else {
                // create choices
                var p = new Promise(function (resolve, reject) {
                    resolve();
                });
                req.params.choices.forEach(function(param_choice) {
                    p=p.then(function() {
                        return models.choice.create({
                            id_node: node_hist.get("id_node"),
                        });
                    });
                    p=p.then(function(choice) {
                        return models.choice_hist.create({
                            id_choice: choice.get('id'),
                            title: param_choice.title,
                            comment: param_choice.comment,
                            position: param_choice.position,
                            impact: param_choice.impact,
                        });
                    });
                });
                p=p.then(function() {
                    return node_hist;
                });
                return p;
            }
        }).then(function(node_hist) {
            res.send(node_hist);
        }, function(err) {
            console.error(err);
            return next(new restify.InternalServerError(err));
        });
    });

    /*
     * edit a node
     */
    server.put('/rest/hist/nodes/:id_node', function (req, res, next) {
        return dbtools.getLatestNodeHist(models, {
            id_node: req.params.id_node,
        }).then(function(dir_hist) {
            return models.node_hist.create({
                id_node: dir_hist.id_node,
                type: req.params.type,
                title: req.params.title,
                description: req.params.description,
                position: req.params.position,
                color: req.params.color,
            });
        }).then(function(node_hist) {
            if (node_hist.get("type") == "directory") {
                return node_hist;
            } else {
                console.log("TODO: delete removed choices !!")
                // update choices
                var p = new Promise(function (resolve, reject) {
                    resolve();
                });
                req.params.choices.forEach(function(param_choice) {

                    if ('id_choice' in param_choice) {
                        p=p.then(function() {
                            return models.choice.findOne({
                                where: {
                                    id: param_choice.id_choice,
                                    id_node: node_hist.get("id_node"),
                                }
                            });
                        });
                    } else {
                        p=p.then(function() {
                            return models.choice.create({
                                id_node: node_hist.get("id_node"),
                            });
                        });
                    }

                    var id_choice;
                    p=p.then(function(choice) {
                        id_choice = choice.get("id");
                        return dbtools.getLatestChoiceHist(models, {
                            id_choice: id_choice,
                        });
                    });

                    // create a new version..
                    p=p.then(function(fullchoice) {
                        if (!('id_choice' in param_choice)
                            || param_choice.title != fullchoice.title
                            || param_choice.comment != fullchoice.comment
                            || param_choice.position != fullchoice.position
                            || param_choice.impact != fullchoice.impact
                        ) {
                            return models.choice_hist.create({
                                id_choice: id_choice,
                                title: param_choice.title,
                                comment: param_choice.comment,
                                position: param_choice.position,
                                impact: param_choice.impact,
                            });
                        }
                    });
                });

                p=p.then(function() {
                    return node_hist;
                });
                return p;
            }
        }).then(function(node_hist) {
            res.send(node_hist);
        }, function(err) {
            console.error(err);
            return next(new restify.InternalServerError(err));
        });
    });

    server.del('/rest/hist/nodes/:id_node', function (req, res, next) {
        return dbtools.getLatestNodeHist(models, {
            id_node: req.params.id_node,
        }).then(function(dir_hist) {
            return models.node_hist.findOne({
                where: {
                    id: dir_hist.id,
                }
            });
        }).then(function(node_hist) {
            return node_hist.destroy();
        }).then(function(node_hist) {
            res.send(node_hist);
        }, function(err) {
            console.error(err);
            return next(new restify.InternalServerError(err));
        });
    });
}
