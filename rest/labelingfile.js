module.exports = function(server, epilogue, models, permchecks) {

    var labelingfileResource = epilogue.resource({
      model: models.labelingfile,
      endpoints: ['/rest/labelingfiles', '/rest/labelingfiles/:id'],
      pagination: false
    });
    //labelingfileResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    labelingfileResource.create.auth(permchecks.haveSuperAgent);
    labelingfileResource.list.auth(permchecks.haveAgent);
    labelingfileResource.read.auth(permchecks.haveAgent);
    labelingfileResource.update.auth(permchecks.haveSuperAgent);
    labelingfileResource.delete.auth(permchecks.haveAdmin);

}
