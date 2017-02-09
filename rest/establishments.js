module.exports = function(server, epilogue, models, permchecks) {

    var establishmentResource = epilogue.resource({
      model: models.establishment,
      endpoints: ['/rest/establishments', '/rest/establishments/:id']
    });
    //establishmentResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    establishmentResource.create.auth.before(permchecks.haveAdmin);
    establishmentResource.list.auth.before(permchecks.haveAgent);
    establishmentResource.read.auth.before(permchecks.haveAgent);
    establishmentResource.update.auth.before(permchecks.haveAdmin);
    establishmentResource.delete.auth.before(permchecks.haveAdmin);

}
