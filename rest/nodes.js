var dbtools = require(__dirname + '/../lib/dbtools.js');

module.exports = function(server, epilogue, models) {


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


    /*
     * list root directories
     */
    models.node.addScope('roots', {
        where: {
            "id_node_parent": null,
        }
    });

    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories/roots', '/rest/directories/roots/:id'],
        model: models.node.scope('roots'),
        include: [{
            model: models.node_hist
        }],
    });

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
            res.send(dir_hist);
        });
    });

    /*
     * add a new node
     */
    server.post('/rest/hist/nodes/:id_node_parent', function (req, res, next) {
        return models.node.create({
            id_node_parent: req.params.id_node_parent,
        }).then(function(node) {
            return models.node_hist.create({
                id_node: req.params.id_node,
                type: req.params.type,
                title: req.params.title,
                description: req.params.description,
                position: req.params.position,
                color: req.params.color
            });
        }).then(function(node_hist) {
            res.send(node_hist);
        });
    });

    /*
     * edit a node
     */
    server.put('/rest/hist/nodes/:id_node', function (req, res, next) {
        return dbtools.getLatestNodeHist(models, {
            id_node: req.params.id_node,
        }).then(function(dir_hist) {
            return models.node_hist.findOne({
                where: {
                    id: dir_hist.dataValues.id,
                }
            });
        }).then(function(node_hist) {
            return node_hist.update(req.params, {
                fields: [
                    'type', 'title', 'description', 'position', 'color'
                ],
            })
        }).then(function(node_hist) {
                res.send(node_hist);
        });
        //return models.node.get()
    });

    server.del('/rest/hist/nodes/:id_node', function (req, res, next) {
        return dbtools.getLatestNodeHist(models, {
            id_node: req.params.id_node,
        }).then(function(dir_hist) {
            return models.node_hist.findOne({
                where: {
                    id: dir_hist.dataValues.id,
                }
            });
        }).then(function(node_hist) {
            return node_hist.destroy();
        }).then(function(node_hist) {
            res.send(node_hist);
        });
    });
}
