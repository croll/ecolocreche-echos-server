var bcrypt = require('bcryptjs');

module.exports = function(server, epilogue, models) {
    // login
    server.post('/rest/login', function (req, res, next) {
        console.log("params: ", req.params);
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
};
