const bcrypt = require('bcryptjs');
const Promise = require("bluebird");
const nodemailer = require('nodemailer');
var config    = require(__dirname + '/../config/config.json');


module.exports = function(server, epilogue, models, permchecks) {
    // login
    server.post('/rest/login', function (req, res, next) {
        //console.log("params: ", req.params);
        models.users.findOne({
            where: {
                $or: [
                    {
                        name: req.params.username,
                    },
                    {
                        email: req.params.username,
                    },
                ]
            },
            plain: true,
        }).then(function(user) {
            if (user) { // user found, check password
                var ok = bcrypt.compareSync(req.params.password, user.dataValues.password_hash);
                console.log("user found: ", user.dataValues.name, "ok ?", ok);
                if (ok) {
                    delete user.dataValues.password_hash;
                    req.session.user = user.dataValues;
                    res.send({
                        user: user.dataValues
                    });
                } else {
                    req.session.user = null;
                    res.send({
                        user: null
                    });
                }
            } else {
                req.session.user = null;
                res.send({
                    user: null
                });
            }
        }, function(err) {
            req.session.user = null;
            res.send({
                user: null
            });
            console.log("login err: ", err);
        });
        return next();
    });

    // logout
    server.post('/rest/logout', function (req, res, next) {
        req.session.user = null;
        res.send({
            user: null
        });
    });

    // whoami
    server.get('/rest/whoami', function (req, res, next) {
        res.send({
            user: 'user' in req.session ? req.session.user : null
        });
    });


    var userResource = epilogue.resource({
      model: models.users,
      endpoints: ['/rest/users', '/rest/users/:id'],
      pagination: false
    });
    userResource.use(permchecks.default_permissions);

    /*
     * custom permision for self user edit
     */
    function auth_selfuseredit(req, res, context) {
        if (('user' in req.session) && req.session.user) {
            switch(req.session.user.account_type) {
                // superagent & agent can only view/update there own account
                case 'superagent':
                case 'agent':
                    if (req.params.id == req.session.user.id) {
                        return context.skip; // skip les check suivant, donc authorize
                    }
                break;
            }
        }
        return context.continue; // passe aux checks suivants (haveAdmin)
    }

    userResource.read.auth.before(auth_selfuseredit);
    userResource.update.auth.before(auth_selfuseredit);

    userResource.update.write.before(function(req, res, context) {
        if (req.session.user.account_type != 'admin') {
            // ok pour self edit, mais pas ces champs :
            delete req.body.account_type;
            delete req.params.account_type;
        }
        return context.continue;
    });


    /*
     * password hash generating on user create/update
     */
    function user_save_write_before(req, res, context) {
        if (req.params.password && req.params.password.length > 0) {
            return new Promise(function(resolve, reject) {
                bcrypt.genSalt(10, function(err, salt) {
                    if (err) {
                        reject(err);
                        return err;
                    }
                    bcrypt.hash(req.params.password, salt, function(err, hash) {
                        if (err) {
                            reject(err);
                            return err;
                        }
                        context.attributes.password_hash = hash;
                        resolve(context.continue);
                    });
                });
            });
        } else return context.continue;
    }
    userResource.create.write.before(user_save_write_before);
    userResource.update.write.before(user_save_write_before);

    /*
     * send mail to user on user create
     */
    userResource.create.complete(function(req, res, context) {
        console.log("sending email...");
        var transporter = nodemailer.createTransport(config.email.transport);
        transporter.sendMail({
            from: config.email.from,
            to: context.instance.get('email'),
            subject: `ECHO(S): Identifiants de connexion de votre compte`,
            text: `Bonjour,

Votre compte sur Echo(s) est maintenant créé.

Votre nom d'utilisateur est "`+req.param.name+`" et votre mot de passe est `+req.param.password+`
Vous pouvez vous connecter à l'addresse suivante: http://echos.dev.rhack.net/connexion

Cordialement,

Echo(s)
`
        }, (err, info) => {
            if (err) {
                console.error("error while sending mail : ", err);
            } else {
                console.log(info.envelope);
                console.log(info.messageId);
            }
        });

        return context.continue;
    });

    /* exemple send.before
    userResource.list.send.before(function(req, res, context) {
        console.log(context.instance);
        return context.continue;
    });
    */

};
