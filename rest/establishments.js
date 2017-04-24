module.exports = function(server, epilogue, models, permchecks) {

    var establishmentResource = epilogue.resource({
      model: models.establishment,
      endpoints: ['/rest/establishments', '/rest/establishments/:id'],
      pagination: false
    });
    //establishmentResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    establishmentResource.create.auth(permchecks.haveSuperAgent);
    establishmentResource.list.auth(permchecks.haveAgent);
    establishmentResource.read.auth(permchecks.haveAgent);
    establishmentResource.update.auth(permchecks.haveSuperAgent);
    establishmentResource.delete.auth(permchecks.haveSuperAgent);

}
