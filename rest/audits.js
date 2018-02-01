const config    = require(__dirname + '/../config/config.json');
const dbtools = require(__dirname + '/../lib/dbtools.js');
const mail = require("../lib/mail");

const default_audit_mail_from = config.email.from;
const default_audit_mail_subject = `ECHO(S): Audit de {establishment_name}`;
const default_audit_mail_body = `Bonjour,

Voici le lien vers l'audit concernant l'établissement {establishment_name}.

{audit_url}

Cordialement,

Echo(s)
`;

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

        // only admin can set date_start
        if (!permchecks._haveAdmin(req, res, context)) {
            if ('date_start' in req.body)
                delete req.body['date_start'];
        }

        if (!('date_start' in req.body)) {
            req.body['date_start'] = new Date();
        }

        return context.continue;
    });

    auditResource.update.write.before(function(req, res, context) {

        // only admin can change date_start
        if (!permchecks._haveAdmin(req, res, context)) {
            if ('date_start' in req.body)
                delete req.body['date_start'];
        }

        return context.continue;
    });

    function audit_mail(audit) {
        return dbtools.getLatestInquiryformHist(models, {
            id_inquiryform: audit.id_inquiryform
        }).then(function(inquiryform_hist) {
            return mail.tplsend({
                from: inquiryform_hist.mail_from ? inquiryform_hist.mail_from : default_audit_mail_from,
                to: audit.establishment.get('mail'),
                subject: inquiryform_hist.mail_title ? inquiryform_hist.mail_title : default_audit_mail_subject,
                text: inquiryform_hist.mail_body  ? inquiryform_hist.mail_body  : default_audit_mail_body,
                replaces: {
                    establishment_name: audit.establishment.get('name'),
                    establishment_mail: audit.establishment.get('mail'),
                    audit_url: config.httpd.url+`/audit/`+audit.get('key'),
                    audit_synthesis: audit.synthesis,
                    recapaction_url: config.httpd.url+`/audit/`+audit.get('key'),
                    recapaction_synthesis: audit.synthesis,
                    inquiryform_title: inquiryform_hist.title,
                    inquiryform_description: inquiryform_hist.description,
                    inquiryform_comment: inquiryform_hist.comment,
                }
            });

        });
    }

    auditResource.create.complete(function(req, res, context) {
        return models.audit.findOne({
            where: {
                id: context.instance.get('id'),
            },
            include: [{
                model: models.establishment
            }]
        }).then(function(audit) {
            if (audit.establishment.get('mail')) {
                audit_mail(audit).then(function() {
                    return context.continue;
                }, function(err) {
                    throw new epilogue.Errors.EpilogueError(500, err);
                });
            } else {
                return context.continue;
            }
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
                if (audit.establishment.get('mail')) {
                    audit_mail(audit).then(function() {
                        return next();
                    }, function(err) {
                        console.error("err: ", err);
                        return next();
                    });
                } else {
                    return context.continue;
                }
            });
        }
    );


}
