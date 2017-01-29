var Sequelize = require('sequelize');
var Promise = require("bluebird");

var config    = require(__dirname + '/config/config.json');

var models = require(__dirname + '/models');
var models_import = require(__dirname + '/models_import');

function getLatestNodeHist(params) {
    return new Promise(function(resolve, reject) {
        var date = '2222-12-22';

        if ('date' in params) {
            date = params.date;
        }

        var query = `
            select
             node.id_node_parent,
             nh1.*
            from node
            left join node_hist nh1 ON nh1.id_node = node.id
            where nh1.createdAt=(
             select max(createdAt)
             from node_hist nh2
             where nh1.id_node = nh2.id_node
             and createdAt <= ?
         )`;
            //and deletedAt IS NOT NULL`;

        var replacements = [ date ];


        if ('id_node_parent' in params
            && params.id_node_parent !== null
            && params.id_node_parent !== "null") {
            query+=' and node.id_node_parent = ?';
            replacements.push(params.id_node_parent);
        }

        if ('id_node' in params
            && params.id_node !== null
            && params.id_node !== "null") {
            query+=' and node.id = ?';
            replacements.push(params.id_node);
        }

        return models.sequelize.query(query, {
                replacements: replacements,
                type: models.sequelize.QueryTypes.SELECT
            }
        ).then(function(directories) {
            if ('id_node' in params) {
                if (directories.length == 1) {
                    resolve(directories[0]);
                } else {
                    reject("latest node_hist not found !");
                }
            } else {
                resolve(directories);
            }
        }, function(err) {
            reject(err);
        });
    });
}


function import_users() {
    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    // import des users
    p = p.then(function() {
        console.log("#########");
        console.log("######### import des users");
        console.log("#########");
        return models_import.users.findAll();
    });
    p = p.then(function(rows) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        rows.forEach(function(row) {
            p2=p2.then(function() {
                return models.users.create({
                    name: row.user_name,
                    password_hash: row.user_password_hash,
                    email: row.user_email,
                    account_type: row.user_account_type ? 'agent' : 'admin',
                    rememberme_token: row.user_rememberme_token ? row.user_rememberme_token : '',
                    creation_timestamp: row.user_creation_timestamp ? row.user_creation_timestamp : "1975-02-06",
                }).then(function() {
                    console.log("user "+row.user_name+" imported.");
                }, function(err) {
                    console.log("user "+row.user_name+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("users imported ok");
    }, function(err) {
        console.error("can't import users: ", err);
    });

    return p;
}

function import_etablissements() {
    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    // import des etablissements
    p = p.then(function() {
        console.log("#########");
        console.log("######### import des etablissements");
        console.log("#########");
        return models_import.etablissement.findAll();
    });
    p = p.then(function(rows) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        rows.forEach(function(row) {
            p2=p2.then(function() {
                return models.establishment.create({
                    name: row.nom,
                    address: row.address ? row.address : '',
                    postalcode: row.codepostal ? row.codepostal : '',
                    city: row.ville ? row.ville : '',
                    phone: row.telephone ? row.telephone : '',
                    mail: row.mail ? row.mail : '',
                    type: ['creche', 'halte-garderie', 'micro-creche', 'multi-accueil', 'relais-d-assistante', 'autre'][row.type],
                    status: ['association','association-parentale','entreprise','publique','indetermine','autre'][row.statut],
                }).then(function() {
                    console.log("establishment "+row.nom+" imported.");
                }, function(err) {
                    console.log("establishment "+row.nom+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("establishment imported ok");
    }, function(err) {
        console.error("can't import establishment: ", err);
    });

    return p;
}


var themes_identifiants = {};
var rubriques_identifiants = {};
function import_themes() {
    // import des themes
    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    p = p.then(function() {
        console.log("#########");
        console.log("######### import des themes");
        console.log("#########");
        return models_import.theme.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $ne: 2
                }
            }
        });
    });
    p = p.then(function(themes) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        themes.forEach(function(theme) {
            var node_theme;
            var node_theme_hist;
            p2=p2.then(function() {
                return models.node.create({
                });
            });
            p2=p2.then(function(_node_theme) {
                node_theme=_node_theme;
                themes_identifiants[theme.dataValues.identifiant] = node_theme.dataValues.id;
                return models.node_hist.create({
                    id_node: node_theme.dataValues.id,
                    type: 'directory',
                    title: theme.intitule ? theme.intitule : '',
                    description: theme.description ? theme.description : '',
                    position: theme.position ? theme.position : 0,
                    color: theme.couleur ? theme.couleur : "#000000",
                    createdAt: theme.horodatage,
                    updatedAt: theme.horodatage,
                }).then(function(_node_theme_hist) {
                    node_theme_hist = _node_theme_hist;
                    console.log("theme "+theme.intitule+" imported.");
                }, function(err) {
                    console.log("theme "+theme.intitule+" error: ", err);
                });
            });

            // import des rubriques
            p2 = p2.then(function() {
                return models_import.rubrique.findAll({
                    order: [
                        ['identifiant', 'ASC'],
                        ['version', 'ASC'],
                    ],
                    where: {
                        theme: theme.identifiant,
                        etat: {
                            $ne: 2
                        }
                    }
                });
            });
            p2=p2.then(function(rubriques) {
                var p3 = new Promise(function (resolve, reject) {
                    resolve();
                });
                rubriques.forEach(function(rubrique) {
                    var node_rubrique;
                    var node_rubrique_hist;
                    p3=p3.then(function() {
                        return models.node.create({
                            id_node_parent: node_theme.dataValues.id,
                        });
                    });
                    p3=p3.then(function(_node_rubrique) {
                        node_rubrique = _node_rubrique;
                        rubriques_identifiants[rubrique.dataValues.identifiant] = node_rubrique.dataValues.id;
                        return models.node_hist.create({
                            id_node: node_rubrique.dataValues.id,
                            type: 'directory',
                            title: rubrique.intitule ? rubrique.intitule : '',
                            description: rubrique.description ? rubrique.description : '',
                            position: rubrique.position ? rubrique.position : 0,
                            color: "#000000", // no color in original rubrique
                            createdAt: rubrique.horodatage,
                            updatedAt: rubrique.horodatage,
                        }).then(function(_node_rubrique_hist) {
                            node_rubrique_hist = _node_rubrique_hist;
                            console.log("rubrique "+rubrique.intitule+" imported.");
                        }, function(err) {
                            console.log("rubrique "+rubrique.intitule+" error: ", err);
                        });
                    });
                });
                return p3;
            });
        }); // /import des rubriques
        return p2;
    }).then(function() {
        console.log("themes imported ok");
    }, function(err) {
        console.error("@@@@@@@@ can't import themes: ", err);
    });

    return p;
}

function import_themes_deleted() {
    //
    // import des themes deleted
    //

    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    p = p.then(function() {
        console.log("#########");
        console.log("######### import des themes deleted");
        console.log("#########");
        return models_import.theme.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: 2
                }
            }
        });
    });
    p = p.then(function(themes) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        themes.forEach(function(theme) {
            var node_theme;
            var node_theme_hist;
            p2=p2.then(function() {
                return models.node.findOne({
                    where: {
                        id: themes_identifiants[theme.dataValues.identifiant],

                    }
                });
            });
            p2=p2.then(function(_node_theme) {
                node_theme=_node_theme;
                return getLatestNodeHist({
                    id_node: node_theme.dataValues.id,
                })
            });
            p2=p2.then(function(_node_directory) {
                return models.node_hist.findById(_node_directory.id);
            });
            p2=p2.then(function(_node_hist) {
                if (_node_hist)
                    return _node_hist.destroy();
            });
        });

        return p2;
    });

    return p;
}

function import_rubriques_deleted() {
    //
    // import des rubriques deleted
    //
    p = p.then(function() {
        console.log("#########");
        console.log("######### import des rubriques deleted");
        console.log("#########");
        return models_import.rubrique.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: 2
                }
            }
        });
    });
    p = p.then(function(rubriques) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        rubriques.forEach(function(rubrique) {
            var node_rubrique;
            var node_rubrique_hist;
            p2=p2.then(function() {
                console.log("rubriques_identifiants", rubriques_identifiants);
                console.log("rubrique.dataValues.identifiant", rubrique.dataValues.identifiant);
                return models.node.findOne({
                    where: {
                        id: rubriques_identifiants[rubrique.dataValues.identifiant],

                    }
                });
            });
            p2=p2.then(function(_node_rubrique) {
                node_rubrique=_node_rubrique;
                return getLatestNodeHist({
                    id_node: node_rubrique.dataValues.id,
                })
            });
            p2=p2.then(function(_node_directory) {
                return models.node_hist.findById(_node_directory.id);
            });
            p2=p2.then(function(_node_hist) {
                if (_node_hist)
                    return _node_hist.destroy();
            });
        });

        return p2;
    });

    return p;
}

models.sequelize.sync({
    force: true,
}).then(function() {
    var p = new Promise(function (resolve, reject) {
        resolve();
    });

    // import des users
    p = p.then(function() {
        return import_users();
    });

    // import des etablissements
    p = p.then(function() {
        return import_etablissements();
    });

    // création d'un premier questionnaire
    p=p.then(function() {
        return models.inquiryform.create({
            title: "Questionnaire original",
            description: "Le questionnaire tel qu'il existait dans l'ancienne version",
        }).then(function() {
            console.log("questionnaire created.");
        }, function(err) {
            console.log("questionnaire creation error: ", err);
        });
    });

    // import des themes
    p = p.then(function() {
        return import_themes();
    });

    // import des themes deleted
    p = p.then(function() {
        return import_themes_deleted();
    });

    // import des rubriques deleted
    p = p.then(function() {
        return import_themes_deleted();
    });


    // end
    p = p.then(function() {
        console.log("THE END");
    });
    return p;

}, function(err) {
    console.error("can't sync db ", err);
});
