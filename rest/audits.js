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


    auditResource.delete.write.before(function(req, res, context) {
        //console.log("instance to delete : ", context.instance);
        if (context.instance) {
            var id_audit=context.instance.get('id');
            return models.audit.update({
                id_audit_src: null,
            }, {
                where: {
                    id_audit_src: id_audit,
                }
            }).then(() => {
                return context.continue;
            });
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
                    recapaction_url: config.httpd.url+`/audit/`+audit.get('id'),
                    recapaction_synthesis: audit.synthesis,
                    inquiryform_title: inquiryform_hist.title,
                    inquiryform_description: inquiryform_hist.description,
                    inquiryform_comment: inquiryform_hist.comment,
                }
            });

        });
    }

    function copyAudit(id_audit_src, id_audit_dst) {
        var audit_src, audit_dst;

        id_audit_src=parseInt(id_audit_src);
        id_audit_dst=parseInt(id_audit_dst);

        return models.audit.findById(id_audit_src).then((_audit_src) => {
            audit_src=_audit_src;
        }).then(() => {
            return models.audit.findById(id_audit_dst).then((_audit_dst) => {
                audit_dst=_audit_dst;
            });
        }).then(() => {
            return dbtools.getLatestNodeHist(models, {
                id_inquiryform: audit_dst.id_inquiryform,
            }).then((nodes) => {
                var p = new Promise(function (resolve, reject) {
                    resolve();
                });
                nodes.forEach(node => {
                    p=p.then(models.answer.findOne({
                        where: {
                            id_audit: id_audit_src,
                            id_node: node.id_node,
                            ignored: false,
                        }
                    }).then(answer => {
                        if (answer) {
                            var _answer = JSON.parse(JSON.stringify(answer.dataValues));
                            _answer.id_audit = id_audit_dst;
                            _answer.status = 'not-saved';
                            return models.answer.create(_answer);
                        } else {
                        }
                    }));
                });
                return p;
                //console.log("nodes: ", nodes);
            });
        }).then(() => {
            return dbtools.update_audit_cached_complete(models, id_audit_dst);
        });
    }

    auditResource.create.write.after(function(req, res, context) {
        var audit_dst = context.instance;
        if (req.params.id_audit_src && req.params.inquiry_type == 'audit') {
            return copyAudit(parseInt(req.params.id_audit_src), audit_dst.id).then(() => {
                return context.continue;
            }, function(err) {
                console.error("auditResource.create.write.after end: ", err);
                return context.error(500, err);
            });
        }
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
            if (audit.establishment.get('mail')) {
                audit_mail(audit).then(function() {
                    return context.continue;
                }, function(err) {
                    console.error(err);
                    return context.error(500, err);
                });
            } else {
                return context.continue;
            }
        }, function(err) {
            console.error("auditResource.create.complete end: ", err);
            //return context.error(500, err);
            return context.continue;
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
