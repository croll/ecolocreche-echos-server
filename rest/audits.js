const config    = require(__dirname + '/../config/config.json');
const mail = require("../lib/mail");

module.exports = function(server, epilogue, models, permchecks) {

    var auditResource = epilogue.resource({
      model: models.audit,
      endpoints: ['/rest/audits', '/rest/audits/:id'],
      include: [{
          model: models.establishment
      }],
      pagination: false
    });

    //auditResource.use(permchecks.default_permissions);

    // if we don't use the default permissions above, we must set it for all possible rest call (create, list, read, update and delete)
    auditResource.create.auth(permchecks.haveSuperAgent);
    auditResource.list.auth(function(req, res, context) {
        if (permchecks._haveAgent(req, res, context))
            return permchecks._ret(false, req, res, context);
        if ('key' in req.params && req.params.key)
            return permchecks._ret(false, req, res, context);
        return permchecks._ret(true, req, res, context);
    });
    auditResource.read.auth(permchecks.haveAgent);
    auditResource.update.auth(permchecks.haveSuperAgent);
    auditResource.delete.auth(permchecks.haveAdmin);

    // toutefois, on autorise pas un agent de créer un audit avec un status que 'en cours'
    auditResource.create.write.before(function(req, res, context) {
        if (req.session.user.account_type != 'admin') {
            req.body.active = true;
        }

	// update du champ date
        if (permchecks._haveAdmin(req, res, context)) {
	    if ('createdAt' in req.body) {
		// hack sequelize to set createdAt, this is dangerous, we set private instance variable to make it working...
		context.instance.createdAt = req.body.createdAt;
		context.instance.dataValues.createdAt = req.body.createdAt;
		context.instance._changed.createdAt = true;
	    }
        }

        return context.continue;
    });

    auditResource.update.write.before(function(req, res, context) {

	// update du champ date
        if (permchecks._haveAdmin(req, res, context)) {
	    if ('createdAt' in req.body) {
		// hack sequelize to set createdAt, this is dangerous, we set private instance variable to make it working...
		context.instance.createdAt = req.body.createdAt;
		context.instance.dataValues.createdAt = req.body.createdAt;
		context.instance._changed.createdAt = true;
	    }
        }

        //console.log("createdAt: ", context.instance);
        //console.log("datavalues: ", context.instance.dataValues);
	
        return context.continue;
    });
    
    auditResource.create.complete(function(req, res, context) {
        return models.audit.findOne({
            where: {
                id: context.instance.get('id'),
            },
            include: [{
                model: models.establishment
            }]
        }).then(function(audit) {
            return mail.send({
                to: audit.establishment.get('mail'),
                subject: `ECHO(S): Audit de `+audit.establishment.get('name'),
                text: `Bonjour,

Voici le lien vers l'audit concernant l'établissement `+audit.establishment.get('name')+`.

`+config.httpd.url+`/audit/`+audit.get('key')+`

Cordialement,

Echo(s)
`
            }).then(function(res) {
                return context.continue;
            }, function(err) {
                console.error("err: ", err);
                return context.continue;
            });
        });
    });

    /*
     * The REST call that send an email to the establishment of the audit, containing the url of the audit
     * parameters :
     *  id_audit: integer
     */
    server.post('/rest/auditmail',
        permchecks.haveAgent,
        function (req, res, next) {
            return models.audit.findOne({
                where: {
                    id: req.params.id_audit,
                },
                include: [{
                    model: models.establishment
                }]
            }).then(function(audit) {
                return mail.send({
                    to: audit.establishment.get('mail'),
                    subject: `ECHO(S): Audit de `+audit.establishment.get('name'),
                    text: `Bonjour,

Voici le lien vers l'audit concernant l'établissement `+audit.establishment.get('name')+`.

`+config.httpd.url+`/audit/`+audit.get('key')+`

Cordialement,

Echo(s)
`
                }).then(function() {
                    res.send("ok");
                    console.log("mail sent.");
                    return next;
                }, function(err) {
                    res.send(500, "something bad appened");
                    console.error("err: ", err);
                    return next();
                });
            });
        }
    );

    // server.post('/rest/pdf', function(req, res, next) {
    //     var fs = require('fs');
    //     fs.writeFile("/tmp/test.html", req.body, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         } else {
    //             console.log("The file was saved!");
    //         }
    //     });
    //     res.send("ok");
    // });

}
