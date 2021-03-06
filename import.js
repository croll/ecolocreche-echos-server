var Sequelize = require('sequelize');
var Promise = require("bluebird");

var config    = require(__dirname + '/config/config.json');

var models = require(__dirname + '/models');
var models_import = require(__dirname + '/models_import');

var dbtools = require(__dirname + '/lib/dbtools.js');

const ETAT_DELETED  = 0;
const ETAT_LATEST   = 1;
const ETAT_MODIFIED = 2;

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
                    resolve(null);
                }
            } else {
                resolve(directories);
            }
        }, function(err) {
            reject(err);
        });
    });
}


function myDestroy(instance, date) {
    instance.deletedAt=date;
    instance.setDataValue('deletedAt', date);
    return instance.save({
        paranoid: false,
    });
}

function import_users() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des users ...");
        console.log("#########");
        resolve();
    });

    // import des users
    p = p.then(function() {
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
                    account_type: row.user_account_type == 2 ? 'admin' : 'agent',
                    rememberme_token: row.user_rememberme_token ? row.user_rememberme_token : '',
                    createdAt: row.user_creation_timestamp ? row.user_creation_timestamp : "1975-02-06",
                }).then(function() {
                    process.stdout.write('.');
                    //console.log("user "+row.user_name+" imported.");
                }, function(err) {
                    console.log("\nuser "+row.user_name+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("\nusers imported ok");
    }, function(err) {
        console.error("\ncan't import users: ", err);
    });

    return p;
}

var themes_identifiants = {};
var rubriques_identifiants = {};
var questions_identifiants = {};
var choices_identifiants = {};
var etablissements_ids = {};
var audits_identifiants = {};
function import_etablissements() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des etablissements ...");
        console.log("#########");
        resolve();
    });

    // import des etablissements
    p = p.then(function() {
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
                }).then(function(establishment) {
                    etablissements_ids[row.dataValues.id]=establishment.dataValues.id;
                    process.stdout.write('.');
                    //console.log("establishment "+row.nom+" imported.");
                }, function(err) {
                    console.log("\nestablishment "+row.nom+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("\nestablishment imported ok");
    }, function(err) {
        console.error("\ncan't import establishment: ", err);
    });

    return p;
}


function import_themes() {
    // import des themes
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des themes ...");
        console.log("#########");
        resolve();
    });

    p = p.then(function() {
        return models_import.theme.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                /*
                etat: {
                    $ne: ETAT_DELETED,
                }
                */
            }
        });
    });
    p = p.then(function(themes) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        themes.forEach(function(theme, theme_i) {
            var theme_next = themes[theme_i+1];
            var node_theme;
            var node_theme_hist;
            p2=p2.then(function() {
                if (theme.dataValues.identifiant in themes_identifiants) {
                    return models.node.findOne({
                        where: {
                            id: themes_identifiants[theme.dataValues.identifiant],
                        }
                    });
                } else {
                    return models.node.create({
                        createdAt: theme.horodatage,
                        updatedAt: theme.horodatage,
                    });
                }
            });
            p2=p2.then(function(_node_theme) {
                node_theme=_node_theme;
                if (theme.etat == ETAT_DELETED && (!theme_next || theme_next.identifiant != theme.identifiant)) {
                    process.stdout.write('d');
                    return myDestroy(_node_theme, theme.horodatage);
                } else {
                    return models.node_hist.create({
                        id_node: node_theme.dataValues.id,
                        type: 'directory',
                        title: theme.intitule ? theme.intitule : '',
                        description: theme.description ? theme.description : '',
                        family: "environnementales",
                        position: theme.position ? theme.position : 0,
                        color: theme.couleur ? theme.couleur : "",
                        createdAt: theme.horodatage,
                        updatedAt: theme.horodatage,
                    }).then(function(_node_theme_hist) {
                        node_theme_hist = _node_theme_hist;
                        process.stdout.write('.');
                        //console.log("theme "+theme.intitule+" imported.");
                    }, function(err) {
                        console.error("error create theme : ", err);
                    });
                }
            });

            p2=p2.then(function() {
                if (!(theme.dataValues.identifiant in themes_identifiants))
                    return import_rubriques(theme, node_theme);
            });

            p2=p2.then(function() {
                themes_identifiants[theme.dataValues.identifiant] = node_theme.dataValues.id;
            });

        }); // /import des rubriques
        return p2;
    }).then(function() {
        console.log("\nthemes imported ok");
    }, function(err) {
        console.error("\n@@@@@@@@ can't import themes: ", err);
    });

    return p;
}

function import_rubriques(theme, node_theme) {
    // import des rubriques
    var p2 = new Promise(function (resolve, reject) {
        //console.log("#########");
        console.log("  ######### import des rubriques ...");
        //console.log("#########");
        resolve();
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
                /*
                etat: {
                    $ne: ETAT_DELETED,
                }
                */
            }
        });
    });
    p2=p2.then(function(rubriques) {
        var p3 = new Promise(function (resolve, reject) {
            resolve();
        });
        rubriques.forEach(function(rubrique, rubrique_i) {
            var rubrique_next = rubriques[rubrique_i+1];
            var node_rubrique;
            var node_rubrique_hist;
            p3=p3.then(function() {
                if (rubrique.dataValues.identifiant in rubriques_identifiants) {
                    return models.node.findOne({
                        where: {
                            id: rubriques_identifiants[rubrique.dataValues.identifiant],
                        }
                    });
                } else {
                    return models.node.create({
                        id_node_parent: node_theme.dataValues.id,
                        createdAt: rubrique.horodatage,
                        updatedAt: rubrique.horodatage,
                    });
                }
            });
            p3=p3.then(function(_node_rubrique) {
                node_rubrique = _node_rubrique;
                if (rubrique.etat == ETAT_DELETED && (!rubrique_next || rubrique_next.identifiant != rubrique.identifiant)) {
                    // delete
                    //console.log("delete rubrique identifiant: ", rubrique.identifiant, " id_node: ", _node_rubrique.get('id'));
                    process.stdout.write('d');
                    return myDestroy(_node_rubrique, rubrique.horodatage);
                } else {
                    return models.node_hist.create({
                        id_node: node_rubrique.dataValues.id,
                        type: 'directory',
                        title: rubrique.intitule ? rubrique.intitule : '',
                        description: rubrique.description ? rubrique.description : '',
                        position: rubrique.position ? rubrique.position : 0,
                        color: "", // no color in original rubrique
                        createdAt: rubrique.horodatage,
                        updatedAt: rubrique.horodatage,
                    }).then(function(_node_rubrique_hist) {
                        node_rubrique_hist = _node_rubrique_hist;
                        process.stdout.write('.');
                        //console.log("  rubrique "+rubrique.intitule+" imported identifiant:", rubrique.identifiant);
                    }, function(err) {
                        console.log("\n  rubrique "+rubrique.intitule+" error: ", err);
                    });
                }
            });
            p3=p3.then(function() {
                if (!(rubrique.dataValues.identifiant in rubriques_identifiants))
                    return import_questions(rubrique, node_rubrique);
            });
            p3=p3.then(function() {
                rubriques_identifiants[rubrique.dataValues.identifiant] = node_rubrique.dataValues.id;
            });
        });
        return p3;
    });

    return p2;
}

function import_questions(rubrique, node_rubrique) {
    // import des questions
    var p2 = new Promise(function (resolve, reject) {
        //console.log("#########");
        console.log("    ######### import des questions ...");
        //console.log("#########");
        resolve();
    });

    // import des questions
    p2 = p2.then(function() {
        return models_import.question.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                rubrique: rubrique.identifiant,
                /*
                etat: {
                    $ne: ETAT_DELETED,
                }
                */
            }
        });
    });
    p2=p2.then(function(questions) {
        var p3 = new Promise(function (resolve, reject) {
            resolve();
        });
        questions.forEach(function(question, question_i) {
            var question_next = questions[question_i+1];
            var node_question;
            var node_question_hist;
            p3=p3.then(function() {
                if (question.dataValues.identifiant in questions_identifiants) {
                    return models.node.findOne({
                        where: {
                            id: questions_identifiants[question.dataValues.identifiant],
                        }
                    });
                } else {
                    return models.node.create({
                        id_node_parent: node_rubrique.dataValues.id,
                        createdAt: question.horodatage,
                        updatedAt: question.horodatage,
                    });
                }
            });
            p3=p3.then(function(_node_question) {
                node_question = _node_question;
                if (question.etat == ETAT_DELETED && (!question_next || question_next.identifiant != question.identifiant)) {
                    // delete
                    //console.log("delete question identifiant: ", question.identifiant, " id_node: ", _node_question.get('id'));
                    process.stdout.write('d');
                    return myDestroy(_node_question, question.horodatage);
                } else {
                    return models.node_hist.create({
                        id_node: node_question.dataValues.id,
                        type: 'directory',
                        title: question.intitule ? question.intitule : '',
                        type: ['q_radio','q_checkbox','q_percents','q_text','q_numeric'][question.type],
                        description: question.commentaire ? question.commentaire : '',
                        position: question.position ? question.position : 0,
                        color: "", // no color in original question
                        createdAt: question.horodatage,
                        updatedAt: question.horodatage,
                    }).then(function(_node_question_hist) {
                        node_question_hist = _node_question_hist;
                        process.stdout.write('.');
                        //console.log("    question "+question.intitule+" imported.");
                    }, function(err) {
                        console.log("\n    question "+question.intitule+" error: ", err);
                    });

                }
            });
            p3=p3.then(function() {
                if (!(question.dataValues.identifiant in questions_identifiants))
                    return import_choices(question, node_question);
            });
            p3=p3.then(function() {
                questions_identifiants[question.dataValues.identifiant] = node_question.dataValues.id;
            });
        });
        return p3;
    });

    return p2;
}

function import_choices(question, node_question) {
    // import des choices
    var p2 = new Promise(function (resolve, reject) {
        //console.log("#########");
        console.log("    ######### import des choix ...");
        //console.log("#########");
        resolve();
    });

    // import des choices
    p2 = p2.then(function() {
        return models_import.choix.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                question: question.identifiant,
                /*
                etat: {
                    $ne: ETAT_DELETED,
                }
                */
            }
        });
    });
    p2=p2.then(function(choix) {
        var p3 = new Promise(function (resolve, reject) {
            resolve();
        });
        choix.forEach(function(choi, choi_i) {
            var choi_next = choix[choi_i+1];
            var node_choice;
            var node_choice_hist;
            p3=p3.then(function() {
                if (choi.dataValues.identifiant in choices_identifiants) {
                    return models.choice.findOne({
                        where: {
                            id: choices_identifiants[choi.dataValues.identifiant],
                        }
                    });
                } else {
                    return models.choice.create({
                        id_node: node_question.dataValues.id,
                        createdAt: choi.horodatage,
                        updatedAt: choi.horodatage,
                    });
                }
            });
            p3=p3.then(function(_node_choice) {
                node_choice = _node_choice;
                choices_identifiants[choi.dataValues.identifiant] = node_choice.dataValues.id;
                if (choi.etat == ETAT_DELETED && (!choi_next || choi_next.identifiant != choi.identifiant)) {
                    // delete
                    //console.log("delete choi identifiant: ", choi.identifiant, " id_node: ", _node_choi.get('id'));
                    process.stdout.write('d');
                    return myDestroy(_node_choice, choi.horodatage);
                } else {
                    return models.choice_hist.create({
                        id_choice: node_choice.dataValues.id,
                        type: 'directory',
                        title: choi.intitule ? choi.intitule : '',
                        comment: choi.commentaire ? choi.commentaire : '',
                        position: choi.position ? choi.position : 0,
                        impact: [1, 2, 3, 4, 5, 0][choi.impact == null ? 5 : choi.impact],
                        createdAt: choi.horodatage,
                        updatedAt: choi.horodatage,
                    }).then(function(_node_choice_hist) {
                        node_choice_hist = _node_choice_hist;
                        process.stdout.write('.');
                        //console.log("    choice "+choi.intitule+" imported.");
                    }, function(err) {
                        console.log("\n    choice "+choi.intitule+" error: ", err);
                    });
                }
            });
        });
        return p3;
    });

    return p2;
}

function import_themes_deleted() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des themes deleted ...");
        console.log("#########");
        resolve();
    });

    p = p.then(function() {
        return models_import.theme.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: ETAT_DELETED,
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
                if (_node_hist) {
                    process.stdout.write('.');
                    //console.log("  delete "+_node_hist.title);
                    return _node_hist.destroy();
                }
            });
        });

        return p2;
    });

    return p;
}

function import_rubriques_deleted() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des rubriques deleted");
        console.log("#########");
        resolve();
    });

    p = p.then(function() {
        return models_import.rubrique.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: ETAT_DELETED,
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
                if (_node_hist) {
                    process.stdout.write('.');
                    //console.log("  delete "+_node_hist.title);
                    return _node_hist.destroy();
                }
            });
        });

        return p2;
    });

    return p;
}

function import_questions_deleted() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des questions deleted");
        console.log("#########");
        resolve();
    });

    p = p.then(function() {
        return models_import.question.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: ETAT_DELETED,
                }
            }
        });
    });
    p = p.then(function(questions) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        questions.forEach(function(question) {
            var node_question;
            var node_question_hist;
            p2=p2.then(function() {
                return models.node.findOne({
                    where: {
                        id: questions_identifiants[question.dataValues.identifiant],
                    }
                });
            });
            p2=p2.then(function(_node_question) {
                node_question=_node_question;
                return getLatestNodeHist({
                    id_node: node_question.dataValues.id,
                })
            });
            p2=p2.then(function(_node_directory) {
                if (_node_directory)
                    return models.node_hist.findById(_node_directory.id);
            });
            p2=p2.then(function(_node_hist) {
                if (_node_hist) {
                    process.stdout.write('.');
                    //console.log("  delete "+_node_hist.title);
                    return _node_hist.destroy();
                } else {
                    console.log("\n  delete "+question.intitule+" ignored");
                }
            });
        });

        return p2;
    });

    return p;
}

function import_choices_deleted() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des choices deleted");
        console.log("#########");
        resolve();
    });

    p = p.then(function() {
        return models_import.choix.findAll({
            order: [
                ['identifiant', 'ASC'],
                ['version', 'ASC'],
            ],
            where: {
                etat: {
                    $eq: ETAT_DELETED,
                }
            }
        });
    });
    p = p.then(function(choix) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        choix.forEach(function(choi) {
            var node_choice;
            var node_choice_hist;
            p2=p2.then(function() {
                //console.log("search choice id : ", choi.dataValues.identifiant, choices_identifiants[choi.dataValues.identifiant]);
                return models.choice.findOne({
                    where: {
                        id: choices_identifiants[choi.dataValues.identifiant],
                    }
                });
            });
            p2=p2.then(function(_node_choice) {
                node_choice=_node_choice;
                if (!node_choice) return;
                return dbtools.getLatestChoiceHist(models, {
                    id_choice: node_choice.dataValues.id,
                });
            });
            p2=p2.then(function(_node_directory) {
                if (!_node_directory) return;
                return models.choice_hist.findById(_node_directory.id);
            });
            p2=p2.then(function(_node_hist) {
                if (_node_hist) {
                    process.stdout.write('.');
                    //console.log("  delete "+_node_hist.title);
                    return _node_hist.destroy();
                } else {
                    console.log("\n  ignore delete of "+choi.intitule);
                }
            });
        });

        return p2;
    });

    return p;
}

function import_audits() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des audits ...");
        console.log("#########");
        resolve();
    });

    // import des audits
    p = p.then(function() {
        return models_import.audit.findAll();
    });
    p = p.then(function(rows) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        rows.forEach(function(row) {
            p2=p2.then(function() {
                return models.audit.create({
                    id_establishment: etablissements_ids[row.get('etablissement')],
                    id_inquiryform: 1,
                    key: row.cle,
                    active: row.en_cours ? true : false,
                    synthesis: row.synthese,
                    createdAt: row.horodatage,
                    updatedAt: row.horodatage,
                }).then(function(audit) {
                    audits_identifiants[row.dataValues.identifiant]=audit.dataValues.id;
                    process.stdout.write('.');
                    //console.log("audit "+row.identifiant+" imported.");
                }, function(err) {
                    console.log("\naudit "+row.identifiant+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("\naudit imported ok");
    }, function(err) {
        console.error("\ncan't import audit: ", err);
    });

    return p;
}

function import_reponses() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### import des reponses ...");
        console.log("#########");
        resolve();
    });

    // import des reponses
    p = p.then(function() {
        return models_import.reponse.findAll();
    });

    p = p.then(function(rows) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        rows.forEach(function(row) {

            p2=p2.then(function() {
                return models_import.audit.findOne({
                    where: {
                        identifiant: row.audit,
                    }
                });
            });

            var import_audit;
            p2=p2.then(function(_import_audit) {
                import_audit = _import_audit;
                /*
                console.log("identifiant: ",
                    row.question, "node: ",
                    questions_identifiants[row.question],
                    "date: ", import_audit.horodatage
                    );
*/
                return dbtools.getLatestNodeHist(models, {
                    id_node: questions_identifiants[row.question],
                    date: import_audit.horodatage,
                    with_deleteds: true,
                });
            });

            p2=p2.then(function(node_question_hist) {

                if (row.valeur == null && row.reponseIgnoree == 0) {
                    // on integre pas les non-reponses.
                    process.stdout.write('x');
                    return;
                }

                /*
                console.log("identifiant: ",
                    row.question, "node: ",
                    questions_identifiants[row.question],
                    "date: ", import_audit.horodatage,
                    "audit: ", row.audit,
                    "found ? ", node_question_hist ? true : false
                    );
                */

                var json_value="";
                var json_res="";
                if (row.valeur != null) {
                    try {
                        json_value=JSON.parse(row.valeur);
                    } catch (err) {
                        console.log("### import de reponse ", row.identifiant, "json foireux. ###");
                    }
                }
                switch(node_question_hist.type) {
                    case 'q_radio': // exemple valeur: "1626"
                        json_res = choices_identifiants[parseInt(json_value)];
                    break;
                    case 'q_checkbox': // exemple valeur: {"1612":"100","1613":"100","1614":"100"}
                    json_res = {};
                    for (id_choi in json_value) {
                        json_res[choices_identifiants[parseInt(id_choi)]]=parseInt(json_value[id_choi]);
                    }
                    break;
                    case 'q_percents': // exemple valeur: {"1208":"50","1209":"50"}
                    json_res = {};
                    for (id_choi in json_value) {
                        json_res[choices_identifiants[parseInt(id_choi)]]=parseInt(json_value[id_choi]);
                    }
                    break;
                    case 'q_text': // exemple valeur: "FL44\/ manger bio\/ aria 85"
                    json_res=""+json_value;
                    break;
                    case 'q_numeric': // exemple valeur: "273"
                    json_res=parseFloat(json_value);
                    break;
                }

                var r = JSON.stringify(json_res);
                if (r == undefined) {
                    r="";
                }

                return models.answer.create({
                    id_audit: audits_identifiants[row.audit],
                    id_node: questions_identifiants[row.question],
                    ignored: row.reponseIgnoree ? true : false,
                    value: r,
                    createdAt: row.horodatage,
                    updatedAt: row.horodatage,
                }).then(function(answer) {
                    //answers_identifiants[row.dataValues.identifiant]=reponse.dataValues.id;
                    process.stdout.write('.');
                    //console.log("reponse "+row.identifiant+" imported.");
                }, function(err) {
                    console.log("\nreponse "+row.identifiant+" error: ", err);
                });
            });
        });
        return p2;
    }).then(function() {
        console.log("\nreponses imported ok");
    }, function(err) {
        console.error("\ncan't import reponse: ", err);
    });

    return p;
}

function update_audit_cached_complete() {
    var p = new Promise(function (resolve, reject) {
        console.log("#########");
        console.log("######### update_audit_cached_complete ...");
        console.log("#########");
        resolve();
    });

    // import des audits
    p = p.then(function() {
        return models.audit.findAll();
    });
    p = p.then(function(audits) {
        var p2 = new Promise(function (resolve, reject) {
            resolve();
        });
        audits.forEach(function(audit) {
            p2=p2.then(function(answer_counts) {
                process.stdout.write('.');
                return dbtools.update_audit_cached_complete(models, audit.id);
            });
        });
        return p2;
    }).then(function() {
        console.log("\naudit update_audit_cached_complete ok");
    }, function(err) {
        console.error("\ncan't update_audit_cached_complete audit: ", err);
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
    p = p.then(function() {
        return models.inquiryform.create({}).then(function(inquiryform) {
            return models.inquiryform_hist.create({
                id_inquiryform: inquiryform.dataValues.id,
                title: "Questionnaire original",
                description: "Le questionnaire tel qu'il existait dans l'ancienne version",
            });
        }).then(function() {
            console.log("questionnaire created.");
        }, function(err) {
            console.log("questionnaire creation error: ", err);
        })
    });

    // import des themes
    p = p.then(function() {
        return import_themes();
    });

    // import des audits
    p = p.then(function() {
        return import_audits();
    });

    // import des reponses
    p = p.then(function() {
        return import_reponses();
    });

    // cache des % complete d'audits
    p = p.then(function() {
        return update_audit_cached_complete();
    });

    // end
    p = p.then(function() {
        console.log("THE END");
        console.log("Maintenant, va selectionner tout les nodes dans le 'Questionnaire Orignal', puis :");
        console.log(`update inquiryform_hist set createdAt='1975-06-02', updatedAt='1975-06-02'; update inquiryform_hist set createdAt=createdAt+id, updatedAt=updatedAt+id; UPDATE node_hist SET family = 'sociales' WHERE title IN ('Accueil - Qualité de vie','Communication','Formation','Gouvernance','Projet éducatif','Respect des diversités','Santé');`);
    });
    return p;

}, function(err) {
    console.error("can't sync db ", err);
});
