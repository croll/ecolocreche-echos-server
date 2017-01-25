module.exports = function(server, epilogue, models) {

    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories', '/rest/directories/:id'],
        model: models.node,
        include: [{
            model: models.node_hist
        }]
    });

}
