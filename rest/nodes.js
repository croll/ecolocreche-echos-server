var dbtools = require(__dirname + '/../lib/dbtools.js');
var restify = require('restify');
var Promise = require("bluebird");
var XLSX = require('xlsx');

module.exports = function(server, epilogue, models, permchecks) {


    /*
     * list any directories
     */
    var nodeResource = epilogue.resource({
        endpoints: ['/rest/directories', '/rest/directories/:id'],
        model: models.node,
        include: [{
            model: models.node_hist
        }],
    });
    nodeResource.use(permchecks.default_permissions);

    /*
     * list nodes at moment
     *
     * optional params :
     *  - date: <date string> : return nodes has they where on this date, '2222-12-22' by default
     *  - id_node_parent : null by default
     */
    server.get('/rest/hist/nodes',
        function(req, res, next) {
            if (permchecks._haveSuperAgent(req, res, next)) {
                return permchecks._ret(false, req, res, next);
            }
            if (req.params.id_audit && req.params.audit_key) {
                var where = {
                    id: req.params.id_audit,
                    key: req.params.audit_key,
                };
                if (!permchecks._haveSuperAgent(req, res, next)) {
                    where.active = true;
                }
                models.audit.findOne({
                    where: where
                }).then(function(audit) {
                    if (audit) {
                        req.audit = audit;
                        return next();
                    } else {
                        return permchecks._ret(true, req, res, next);
                    }
                });
            } else {
                return permchecks._ret(true, req, res, next); // return perm denied
            }
        },
        function (req, res, next) {
            if (req.audit) {
                req.params.date = req.audit.createdAt;
            }
            if (!('id_node_parent' in req.params)) {
                req.params.id_node_parent="null";
            }
            var p;
            if ('id_inquiryform' in req.params) {
                var inquiryform_params={
                    id_inquiryform: req.params.id_inquiryform,
                };
                if ('date' in req.params) {
                    inquiryform_params.date = req.params.date;
                }
                p=dbtools.getLatestInquiryformHist(models, inquiryform_params);
                p=p.then(function(inquiryform) {
                    if (!inquiryform) {
                        return null;
                    }
                    var nodeslist;
                    try {
                        nodeslist=JSON.parse(inquiryform.nodeslist);
                    } catch(err) {
                        nodeslist=[];
                    }
                    req.params.nodeslist = nodeslist;
                    return dbtools.getLatestNodeHist(models, req.params);
                });
            } else {
                p=dbtools.getLatestNodeHist(models, req.params);
            }

            return p.then(function(dirs) {
                if (dirs)
                    res.send(dirs);
                else
                    return next(new restify.NotFoundError("Not found"));
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

    /*
     * get node at moment
     *
     * optional params :
     *  - date: <date string> : return nodes has they where on this date, '2222-12-22' by default
     *  - id_node_parent : not very usefull here
     */
    server.get('/rest/hist/nodes/:id_node',
        permchecks.haveSuperAgent,
        function (req, res, next) {
            return dbtools.getLatestNodeHist(models, req.params).then(function(dir_hist) {
                if (dir_hist === undefined) {
                    next(new restify.NotFoundError("node does not exists"));
                } else {
                    return dir_hist;
                }
            }).then(function(dir_hist) {
                if (dir_hist) {
                    return dbtools.getNodePath(models, dir_hist.id_node).then(function(path) {
                        dir_hist.nodepath = path;
                        return dir_hist;
                    });
                }
            }).then(function(dir_hist) {
                if (dir_hist) {
                    if (dir_hist.type != 'directory') { // this is a question, so also take the choices of it
                        return dbtools.getLatestChoiceHist(models, req.params).then(function(choices_hist) {
                            dir_hist.choices = choices_hist;
                            if (req.params.id_audit) { // this is an audit, so also take the answer of the question
                                models.answer.findOne({
                                    where: {
                                        id_audit: req.params.id_audit,
                                        id_node: dir_hist.id_node,
                                    },
                                }).then(function(answer) {
                                    dir_hist.answer = answer;
                                    res.send(dir_hist);
                                })
                            } else {
                                res.send(dir_hist);
                            }
                        });
                    } else {
                        res.send(dir_hist);
                    }
                }
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

    /*
     * add a new node
     *
     * required params :
     *  - inquiry_type : 'audit' or 'recapaction'
     *
     * optional params :
     *  - id_node_parent : null by default
     */
    server.post('/rest/hist/nodes',
        permchecks.haveAdmin,
        function (req, res, next) {

            // calculate end position
            var position=0;
            var query = `
                select
                 max(position)+1 as pos
                from node
                left join node_hist
                 on node_hist.id_node=node.id `;
            var options = {
                type: models.sequelize.QueryTypes.SELECT,
            };
            if (req.params.id_node_parent) {
                query+="where id_node_parent = :id_node_parent";
                options.replacements = {
                    id_node_parent: req.params.id_node_parent,
                };
            } else {
                query+="where id_node_parent is null";
            }
            return models.sequelize.query(query, options).then(function(_position) {
                if (_position && _position[0] && _position[0].pos)
                    position=_position[0].pos;

                // end of calculate end position ...

                return models.node.create({
                    id_node_parent: 'id_node_parent' in req.params && req.params.id_node_parent ? req.params.id_node_parent : null,
                    inquiry_type: req.params.inquiry_type,
                });
            }).then(function(node) {
                return models.node_hist.create({
                    id_node: node.get('id'),
                    type: req.params.type,
                    title: req.params.title,
                    description: req.params.description,
                    family: req.params.family,
                    privcomment: req.params.privcomment,
                    //position: req.params.position,
                    position: position,
                    color: req.params.color,
                    linked_to_node_id: 'linked_to_node_id' in req.params ? req.params.linked_to_node_id : null,
                });
            }).then(function(node_hist) {

                if (node_hist.get("type") == "directory") {

                    // pour recap actions, on ajoute 2 questions, et on update le nodeslist du inquiryform
                    if (req.params.inquiry_type == 'recapaction' && req.params.id_inquiryform) {
                        return dbtools.getLatestInquiryformHist(models, {
                            id_inquiryform: req.params.id_inquiryform,
                        }).then(function(inquiryform) {

                            var p1=models.node.create({
                                id_node_parent: node_hist.id_node,
                                inquiry_type: req.params.inquiry_type,
                            }).then(function(node_question) {
                                return models.node_hist.create({
                                    id_node: node_question.get('id'),
                                    type: 'q_wysiwyg',
                                    title: 'Actions à réaliser',
                                    description: '',
                                    family: '',
                                    privcomment: '',
                                    position: 1,
                                    color: '777777',
                                    linked_to_node_id: null,
                                });
                            });

                            var p2=models.node.create({
                                id_node_parent: node_hist.id_node,
                                inquiry_type: req.params.inquiry_type,
                            }).then(function(node_question) {
                                return models.node_hist.create({
                                    id_node: node_question.get('id'),
                                    type: 'q_wysiwyg',
                                    title: 'Actions réalisées',
                                    description: '',
                                    family: '',
                                    privcomment: '',
                                    position: 2,
                                    color: '777777',
                                    linked_to_node_id: null,
                                });
                            });

                            return Promise.all([p1,p2]).then(function(nodes) {
                                // update here inquiryform_hist with nodeslist

                                var nodeslist;
                                try {
                                    nodeslist=JSON.parse(inquiryform.nodeslist);
                                } catch(err) {
                                    nodeslist=[];
                                }

                                nodeslist.push(node_hist.id_node);
                                nodeslist.push(nodes[0].get('id_node'));
                                nodeslist.push(nodes[1].get('id_node'));

                                return models.inquiryform_hist.create({
                                    id_inquiryform: inquiryform.id_inquiryform,
                                    title: inquiryform.title,
                                    description: inquiryform.description,
                                    comment: inquiryform.comment,
                                    mail_title: inquiryform.mail_title,
                                    mail_body: inquiryform.mail_body,
                                    nodeslist: JSON.stringify(nodeslist),
                                    position: inquiryform.position,
                                });

                            }).then(function() {
                                return node_hist;
                            });

                        })

                    } else {
                        return node_hist;
                    }

                } else { // this is not a directory

                    // create choices
                    var p = new Promise(function (resolve, reject) {
                        resolve();
                    });

                    req.params.choices.forEach(function(param_choice) {
                        p=p.then(function() {
                            return models.choice.create({
                                id_node: node_hist.get("id_node"),
                            });
                        });
                        p=p.then(function(choice) {
                            return models.choice_hist.create({
                                id_choice: choice.get('id'),
                                title: param_choice.title,
                                comment: param_choice.comment,
                                position: param_choice.position,
                                impact: param_choice.impact,
                            });
                        });
                    });
                    p=p.then(function() {
                        return node_hist;
                    });
                    return p;
                }
            }).then(function(node_hist) {
                res.send(node_hist);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

    /*
     * edit a node
     */
    server.put('/rest/hist/nodes/:id_node',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestNodeHist(models, {
                id_node: req.params.id_node,
            }).then(function(dir_hist) {
                return models.node_hist.create({
                    id_node: dir_hist.id_node,
                    type: req.params.type,
                    title: req.params.title,
                    description: req.params.description,
                    family: req.params.family,
                    privcomment: req.params.privcomment,
                    position: req.params.position,
                    color: req.params.color,
                    linked_to_node_id: 'linked_to_node_id' in req.params ? req.params.linked_to_node_id : null,
                });
            }).then(function(node_hist) {
                if (node_hist.get("type") == "directory") {
                    return node_hist;
                } else {
                    if (!Array.isArray(req.params.choices)) {
                        return node_hist;
                    }

                    // update choices
                    var p = new Promise(function (resolve, reject) {
                        resolve();
                    });
                    var ids_choice=[-1]; // -1 to make sure that sequelize will work
                    req.params.choices.forEach(function(param_choice) {

                        if ('id_choice' in param_choice) {
                            p=p.then(function() {
                                return models.choice.findOne({
                                    where: {
                                        id: param_choice.id_choice,
                                        id_node: node_hist.get("id_node"),
                                    }
                                });
                            });
                        } else {
                            p=p.then(function() {
                                return models.choice.create({
                                    id_node: node_hist.get("id_node"),
                                });
                            });
                        }

                        var id_choice;
                        p=p.then(function(choice) {
                            id_choice = choice.get("id");
                            ids_choice.push(id_choice);
                            return dbtools.getLatestChoiceHist(models, {
                                id_choice: id_choice,
                            });
                        });

                        // create a new version..
                        p=p.then(function(fullchoice) {
                            if (!('id_choice' in param_choice)
                                || param_choice.title != fullchoice.title
                                || param_choice.comment != fullchoice.comment
                                || param_choice.position != fullchoice.position
                                || param_choice.impact != fullchoice.impact
                            ) {
                                return models.choice_hist.create({
                                    id_choice: id_choice,
                                    title: param_choice.title,
                                    comment: param_choice.comment,
                                    position: param_choice.position,
                                    impact: param_choice.impact,
                                });
                            }
                        });
                    });

                    // delete unused anymore choice
                    p=p.then(function() {
                        return models.choice.destroy({
                            where: {
                                id: {
                                    $notIn: ids_choice,
                                },
                                id_node: node_hist.id_node,
                            }
                        });
                    });

                    p=p.then(function() {
                        return node_hist;
                    });
                    return p;
                }
            }).then(function(node_hist) {
                res.send(node_hist);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );

    function recurse_delete_node(id_node, deleteds) {
        id_node=parseInt(id_node);

        return models.node.findAll({
            where: {
                id_node_parent: id_node,
            }
        }).then(function(nodes) {

            var p = new Promise(function (resolve, reject) {
                resolve();
            });

            nodes.forEach(function(node) {
                p = p.then(function() {
                    return recurse_delete_node(node.id, deleteds);
                });
            })

            return p.then(function() {
                return deleteds;
            });
        }).then(function() {
            return models.node.findById(id_node);
        }).then(function(node) {
            return node.destroy();
        }).then(function() {
            deleteds.push(id_node);
        }).then(function() {
            return dbtools.getLatestNodeHist(models, {
                id_node: id_node,
                with_deleteds: 1,
            });
        });
    }

    server.del('/rest/hist/nodes/:id_node',
        permchecks.haveAdmin,
        function (req, res, next) {
            var nodes_deleteds = [];
            return recurse_delete_node(req.params.id_node, nodes_deleteds).then(function(dir_hist) {

                // pour recap actions, on update le nodeslist du inquiryform
                if (dir_hist.inquiry_type == 'recapaction' && req.params.id_inquiryform) {
                    return dbtools.getLatestInquiryformHist(models, {
                        id_inquiryform: req.params.id_inquiryform,
                    }).then(function(inquiryform) {
                        var nodeslist;
                        try {
                            nodeslist=JSON.parse(inquiryform.nodeslist);
                        } catch(err) {
                            nodeslist=[];
                        }

                        nodeslist = nodeslist.filter(id => nodes_deleteds.indexOf(id) == -1);

                        return models.inquiryform_hist.create({
                            id_inquiryform: inquiryform.id_inquiryform,
                            title: inquiryform.title,
                            description: inquiryform.description,
                            comment: inquiryform.comment,
                            mail_title: inquiryform.mail_title,
                            mail_body: inquiryform.mail_body,
                            nodeslist: JSON.stringify(nodeslist),
                            position: inquiryform.position,
                        });

                    }).then(function() {
                        return dir_hist;
                    });
                } else {
                    return dir_hist;
                }
            }).then(function(dir_hist) {
                res.send(dir_hist);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );


    async function getInquiryformAOA(params) {
        if ('id_inquiryform' in params) {
            var inquiryform_params={
                id_inquiryform: params.id_inquiryform,
            };
            if ('date' in params) {
                inquiryform_params.date = params.date;
            }
            var inquiryform = await dbtools.getLatestInquiryformHist(models, inquiryform_params);
            //console.log("inquiryform : ", inquiryform);
            var nodeslist=JSON.parse(inquiryform.nodeslist);
            params.nodeslist = nodeslist;
        }

        params.recurse=1;
        params.id_node_parent=null;
        var nodes = await dbtools.getLatestNodeHist(models, params);

        //console.log(nodes);

        var data=[];

        data.push([
            "ID",
            "Type de question",
            "Chemin",
            "Titre Question",
            "Description",
            "Commentaire privé",
            "Famille",
            "Réponses possibles",
            "Impact",
            "Commentaire (de réponse possible)",
        ]);

        async function getRecurse(nodes, level, path) {
            for (var i_node in nodes) {
                var n = nodes[i_node];
                //console.log("added i_node: ", n);

                var type = 'unknown';
                if (n.type == 'directory') {
                    type = (level == 1 ? 'Thème' : 'Rubrique');
                } else {
                    if (n.type == 'q_radio') type = "Question fermée à choix unique";
                    else if (n.type == 'q_checkbox') type = "Question fermée à choix multiple";
                    else if (n.type == 'q_percents') type = "Question fermée à choix multiple pondéré";
                    else if (n.type == 'q_text') type = "Question ouverte";
                    else if (n.type == 'q_numeric') type = "Question ouverte numérique";
                    else type = n.type;
                }

                var line=[
                    n.id,
                    type,
                    path,
                    n.title,
                    n.description,
                    n.privcomment,
                    n.family,
                    'c.title',
                    'c.impact',
                    'c.comment',
                ];

                if (n.type == 'q_radio' || n.type == 'q_checkbox' || n.type == 'q_percents') {
                    var choices = await models.choice.findAll({
                        where: {
                            id_node: n.id_node,
                        },
                        raw: true,
                    });

                    var choices_hist = [];
                    for (var i_choice in choices) {
                        var choice = choices[i_choice];
                        var choice_params = {
                            id_choice: choice.id,
                        };
                        if ('date' in params) {
                            choice_params.date = params.date;
                        }
                        var choices_dir = await dbtools.getLatestChoiceHist(models, choice_params);
                        choices_hist.push(choices_dir);
                    }

                    if (choices_hist.length > 0) {
                        choices_hist.forEach(function(choice) {
                            var subline = line.slice();
                            subline[7]=choice.title;
                            subline[8]=choice.impact;
                            subline[9]=choice.comment;

                            if (choice.impact == 0) {
                                subline[8]="Aucun";
                            } else if (choice.impact == 1) {
                                subline[8]="Très faible";
                            } else if (choice.impact == 2) {
                                subline[8]="Faible";
                            } else if (choice.impact == 3) {
                                subline[8]="Neutre";
                            } else if (choice.impact == 4) {
                                subline[8]="Fort";
                            } else if (choice.impact == 5) {
                                subline[8]="Très fort";
                            }

                            data.push(subline);
                        });
                    } else { // in case no choice are available, we want to print at least one line of this node
                        var subline = line.slice();
                        subline[7]='';
                        subline[8]='';
                        subline[9]='';
                        data.push(subline);
                    }
                } else {
                    var subline = line.slice();
                    subline[7]='';
                    subline[8]='';
                    subline[9]='';
                    data.push(subline);
                }

                if (n.childs) {
                    await getRecurse(n.childs, level+1, path+'/'+n.title);
                }

            }
        }

        await getRecurse(nodes, 1, '');

        return {
            data: data,
            inquiryform: inquiryform,
        };
    }




    server.post('/rest/export/nodes',
      permchecks.haveAdmin,
      function (req, res, next) {
          var data;

          getInquiryformAOA(req.params).then(function(all) {
              /* generate workbook */
              var ws = XLSX.utils.aoa_to_sheet(all.data);

              // set col width
              ws['!cols'] = [
                {wch:4},
                {wch:32},
                {wch:40},
                {wch:40},
                {wch:40},
                {wch:12},
                {wch:12},
                {wch:32},
                {wch:12},
                {wch:40},
              ];

              var wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, all.inquiryform.title.substring(0,30));

              /* generate buffer */
              var buf;
              if (req.params.format == 'xlsx') {
                  buf = XLSX.write(wb, {type:'buffer', bookType:"xlsx"});
              } else if (req.params.format == 'csv') {
                  buf = XLSX.write(wb, {type:'buffer', bookType:"csv"});
              }

              /* send to client */
              res.setHeader('content-type', 'application/octet-stream');
              res.send(buf);

          }, function(err) {
              console.log("err: ", err);
              res.send(500);
              return;
          });

      }
    );

}
