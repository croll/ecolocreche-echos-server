module.exports = function(server, epilogue, models, permchecks) {

    var labelingfileResource = epilogue.resource({
      model: models.labelingfile,
      endpoints: ['/rest/labelingfiles', '/rest/labelingfiles/:id'],
      pagination: false,
      excludeAttributes: ['datajson'],
    });
    //labelingfileResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    labelingfileResource.create.auth(permchecks.haveSuperAgent);
    labelingfileResource.list.auth(permchecks.haveAgent);
    labelingfileResource.read.auth(permchecks.haveAgent);
    labelingfileResource.update.auth(permchecks.haveSuperAgent);
    labelingfileResource.delete.auth(permchecks.haveAdmin);



    var datalabelingfileResource = epilogue.resource({
      model: models.labelingfile,
      endpoints: ['/rest/datalabelingfiles', '/rest/datalabelingfiles/:id'],
      pagination: false,
    });
    //datalabelingfileResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    datalabelingfileResource.create.auth(permchecks.haveSuperAgent);
    datalabelingfileResource.list.auth(permchecks.haveAgent);
    datalabelingfileResource.read.auth(permchecks.haveAgent);
    datalabelingfileResource.update.auth(permchecks.haveSuperAgent);
    datalabelingfileResource.delete.auth(permchecks.haveAdmin);

}
