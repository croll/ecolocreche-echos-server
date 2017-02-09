module.exports = function(server, epilogue, models, permchecks) {

    var establishmentResource = epilogue.resource({
      model: models.establishment,
      endpoints: ['/rest/establishments', '/rest/establishments/:id']
    });
    establishmentResource.use(permchecks.default_permissions);

}
