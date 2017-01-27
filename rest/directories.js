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
     * list directories at moment
     *
     * optional params :
     *  - date: <date string> : return directories has they where on this date, '2222-12-22' by default
     *  - id_node_parent : null by default
     */
    server.get('/rest/hist/directories', function (req, res, next) {

        var date = '2222-12-22';

        if ('date' in req.params) {
            date = req.params.date;
        }

        var query = `
            select
             node.id_node_parent,
             nh1.*
            from node
            left join node_hist nh1 ON nh1.id_node = node.id
            where nh1.createdAt=(
             select max(createdAt)
             from node_hist nh2
             where nh1.id_node = nh2.id_node
             and createdAt <= ?
            )
            and state != 'deleted'`;

        var replacements = [ date ];


        if ('id_node_parent' in req.params
            && req.params.id_node_parent !== null
            && req.params.id_node_parent !== "null") {
            query+=' and node.id_node_parent = ?';
            replacements.push(req.params.id_node_parent);
        } else {
            query+=' and node.id_node_parent is null';
        }

        return models.sequelize.query(query, {
                replacements: replacements,
                type: models.sequelize.QueryTypes.SELECT
            }
        ).then(function(directories) {
            res.send(directories);
        });
    });

    /*
     * add a new directory
     */
    server.post('/rest/hist/directories/:id_node_parent', function (req, res, next) {
        return models.node.create({
            id_node_parent: req.params.id_node_parent,
        }).then(function(node) {
            return models.node_hist.create({
                id_node: req.params.id_node,
                type: req.params.type,
                title: req.params.title,
                description: req.params.description,
                position: req.params.position,
                color: req.params.color,
                state: req.params.state,
            });
        }).then(function(node_hist) {
            res.send(node_hist);
        });
    });

    /*
     * edit a directory
     */
    server.put('/rest/hist/directories/:id_node', function (req, res, next) {
        //return models.node.get()
    });

}
