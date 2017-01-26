module.exports = function(server, epilogue, models) {


    /*
     * list any directories
     */
    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories', '/rest/directories/:id'],
        model: models.node.scope,
        include: [{
            model: models.node_hist
        }],
    });


    /*
     * list root directories
     */
    models.node.addScope('roots', {
        where: {
            "id_directory_parent": null,
        }
    });

    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories/roots', '/rest/directories/roots/:id'],
        model: models.node.scope('roots'),
        include: [{
            model: models.node_hist
        }],
    });

}
