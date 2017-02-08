const bcrypt = require('bcryptjs');
const Promise = require("bluebird");


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

    userResource.create.write.before(function(req, res, context) {
        return new Promise(function(resolve, reject) {
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(req.params.password, salt, function(err, hash) {
                    context.attributes.password_hash = hash;
                    resolve(context.continue);
                });
            });
        });
    });

    /* exemple send.before
    userResource.list.send.before(function(req, res, context) {
        console.log(context.instance);
        return context.continue;
    });
    */

};
