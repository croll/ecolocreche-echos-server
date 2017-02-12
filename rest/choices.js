var dbtools = require(__dirname + '/../lib/dbtools.js');

module.exports = function(server, epilogue, models, permchecks) {


    /*
     * list choices at moment
     *
     * not optional params :
     *  - id_node : id of the question node
     * optional params :
     *  - date: <date string> : return choices has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/choices',
        permchecks.haveAdmin,
        function (req, res, next) {
            if (!('id_node' in req.params)) {
                throw new epilogue.Errors.BadRequestError("id_node is mandatory");
            }
            return dbtools.getLatestChoiceHist(models, req.params).then(function(dirs) {
                res.send(dirs);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * get choice at moment
     *
     * optional params :
     *  - date: <date string> : return choices has they where on this date, '2222-12-22' by default
     *  - id_node : not very usefull here
     */
    server.get('/rest/hist/choices/:id_choice',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestChoiceHist(models, req.params).then(function(dir_hist) {
                res.send(dir_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * add a new choice
     */
    server.post('/rest/hist/choices/:id_choice_parent',
        permchecks.haveAdmin,
        function (req, res, next) {
            return models.choice.create({
                id_choice_parent: req.params.id_choice_parent,
            }).then(function(choice) {
                return models.choice_hist.create({
                    id_choice: req.params.id_choice,
                    type: req.params.type,
                    title: req.params.title,
                    description: req.params.description,
                    position: req.params.position,
                    color: req.params.color
                });
            }).then(function(choice_hist) {
                res.send(choice_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * edit a choice
     */
    server.put('/rest/hist/choices/:id_choice',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestChoiceHist(models, {
                id_choice: req.params.id_choice,
            }).then(function(dir_hist) {
                return models.choice_hist.findOne({
                    where: {
                        id: dir_hist.dataValues.id,
                    }
                });
            }).then(function(choice_hist) {
                return choice_hist.update(req.params, {
                    fields: [
                        'type', 'title', 'description', 'position', 'color'
                    ],
                })
            }).then(function(choice_hist) {
                    res.send(choice_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    server.del('/rest/hist/choices/:id_choice',
        permchecks.haveAdmin,
        function (req, res, next) {
            return models.choice.findOne({
                where: {
                    id: req.params.id_choice,
                }
            }).then(function(choice) {
                if (choice) {
                    return choice.destroy();
                } else {
                    return false;
                }
            }).then(function(res) {
                return dbtools.getLatestNodeHist(models, {
                    id_choice: req.params.id_choice,
                });
            }).then(function(dir_hist) {
                res.send(dir_hist);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

}
