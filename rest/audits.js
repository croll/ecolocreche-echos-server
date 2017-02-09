module.exports = function(server, epilogue, models, permchecks) {

    var auditResource = epilogue.resource({
      model: models.audit,
      endpoints: ['/rest/audits', '/rest/audits/:id']
    });

    //auditResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    auditResource.create.auth.before(permchecks.haveSuperAgent);
    auditResource.list.auth.before(permchecks.haveAgent);
    auditResource.read.auth.before(permchecks.haveAgent);
    auditResource.update.auth.before(permchecks.haveAdmin);
    auditResource.delete.auth.before(permchecks.haveAdmin);

    // toutefois, on autorise pas un agent de créer un audit avec un status que 'en cours'
    auditResource.create.write.before(function(req, res, context) {
        if (req.session.user.account_type != 'admin') {
            req.body.active = true;
        }
        return context.continue;
    });

}
