const bcrypt = require('bcryptjs');
const Promise = require("bluebird");
const nodemailer = require('nodemailer');
var config    = require(__dirname + '/../config/config.json');


module.exports = function(server, epilogue, models) {
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
      endpoints: ['/rest/users', '/rest/users/:id']
    });

    userResource.list.auth(function(req, res, context) {
        if ('user' in req.session && req.session.user) {
            // ok
            return context.continue;
        } else {
            // not ok
            throw new epilogue.Errors.ForbiddenError("you are not authized to list users !");
        }
    });

    /*
     * password hash generating on user create/update
     */
    function user_save_write_before(req, res, context) {
        if (req.params.password && req.params.password.length > 0) {
            return new Promise(function(resolve, reject) {
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(req.params.password, salt, function(err, hash) {
                        context.attributes.password_hash = hash;
                        resolve(context.continue);
                    });
                });
            });
        } else return context.contonue;
    }
    userResource.create.write.before(user_save_write_before);
    userResource.update.write.before(user_save_write_before);

    /*
     * send mail to user on user create
     */
    userResource.create.complete(function(req, res, context) {
        console.log("sending email...");
        var transporter = nodemailer.createTransport({
            sendmail: true,
            newline: 'unix',
            path: '/usr/sbin/sendmail'
        });
        transporter.sendMail({
            from: config.mail.from,
            to: context.instance.get('email'),
            subject: 'Votre compte sur echos',
            text: 'Je suis heureux de vous apprendre que votre compte echos à été créé.'
        }, (err, info) => {
            console.log(info.envelope);
            console.log(info.messageId);
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
