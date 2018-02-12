var Promise = require("bluebird");

var dbtools = module.exports = {

    getLatestNodeHist: function(models, params) {
        return this.getLatestHist(models, 'node', params ? params : {});
    },

    getLatestChoiceHist: function(models, params) {
        return this.getLatestHist(models, 'choice', params ? params : {});
    },

    getLatestInquiryformHist: function(models, params) {
        return this.getLatestHist(models, 'inquiryform', params ? params : {});
    },

    getLatestHist: function(models, tbl, params) {
        var self=this;
        return new Promise(function(resolve, reject) {
            var date = '2222-12-22';

            if ('date' in params) {
                date = params.date;
            }

            var query = `
                select
                 deletedAt,
                 `+(tbl == 'inquiryform' ? `inquiryform.inquiry_type, inquiryform.mail_from, inquiryform.mail_subject, inquiryform.mail_body, inquiryform.audit_report_header,` : '')+`
                 `+(tbl == 'choice' ? `choice.id_node,` : '')+`
                 `+(tbl == 'node' ? `node.id_node_parent,node.inquiry_type,` : '')+`
                 nh1.*
                from ${tbl}
                left join ${tbl}_hist nh1 ON nh1.id_${tbl} = ${tbl}.id
                where nh1.createdAt=(
                 select max(nh2.createdAt)
                 from ${tbl}_hist nh2
                 where nh1.id_${tbl} = nh2.id_${tbl}
                 and nh2.createdAt <= ?
                ) `;

            var replacements = [ date ];

             if (!('with_deleteds' in params) || !params.with_deleteds) {
                query+=`and (deletedAt IS NULL or deletedAt > ?)`;
                replacements.push(date);
             }


            if (tbl == 'inquiryform') {
                if (`id_inquiryform` in params) {
                    query+=` and id_inquiryform = ?`;
                    replacements.push(params.id_inquiryform);
                }
            } else if (tbl == 'choice') {
                if (`id_node` in params) {
                    query+=` and id_node = ?`;
                    replacements.push(params.id_node);
                }
            } else {
                if (`id_${tbl}_parent` in params) {
                    if (params[`id_${tbl}_parent`] === null
                        || params[`id_${tbl}_parent`] == "null") {
                        query+=` and ${tbl}.id_${tbl}_parent IS NULL`;
                    } else {
                        query+=` and ${tbl}.id_${tbl}_parent = ?`;
                        replacements.push(params[`id_${tbl}_parent`]);
                    }
                }
            }

            if (tbl == 'inquiryform' || tbl == 'node') {
                if (`inquiry_type` in params) {
                    query+=` and inquiry_type = ?`;
                    replacements.push(params.inquiry_type);
                }
            }

            if (`id_${tbl}` in params
                && params[`id_${tbl}`] !== null
                && params[`id_${tbl}`] !== "null") {
                query+=` and ${tbl}.id = ?`;
                replacements.push(params[`id_${tbl}`]);
            }

            if (tbl == "node" && 'nodeslist' in params && Array.isArray(params.nodeslist)) {
                if (params.nodeslist.length == 0) {
                    query+=` and 1=0`;
                } else {
                    query+=` and ${tbl}.id IN (?)`;
                    replacements.push(params[`nodeslist`]);
                }
            }

            // finaly, order this by position
            if (tbl != 'inquiryform')
                query+=` order by position`;
            else {
                query+=` order by createdAt`;
            }

            //console.log("query: ", query);
            //console.log("replacements: ", replacements);
            return models.sequelize.query(query, {
                    replacements: replacements,
                    type: models.sequelize.QueryTypes.SELECT
                }
            ).then(function(directories) {
                if (`id_${tbl}` in params) {
                    if (directories.length == 1) {
                        resolve(directories[0]);
                    } else {
                        resolve();
                    }
                } else {

                    var p = new Promise(function (resolve, reject) {
                        resolve();
                    });

                    directories.forEach(function(row) {
                        // recurse
                        if (params.recurse && tbl == 'node' && row.type=='directory') {
                            p=p.then(function() {
                                var params2 = {};
                                Object.assign(params2, params);
                                params2[`id_${tbl}_parent`]=row.id_node;
                                return self.getLatestHist(models, tbl, params2).then(function(subrow) {
                                    row.childs = subrow;
                                })
                            });

                            // with answers if id_audit is set
                        } else if (params.id_audit && tbl == 'node' && row.type.startsWith('q_')) {
                            p=p.then(function() {
                                return models.answer.findOne({
                                    where: {
                                        id_audit: params.id_audit,
                                        id_node: row.id_node,
                                    },
                                }).then(function(answer) {
                                    row.answer = answer;
                                    // and choices, puisqu'on y est..
                                    return dbtools.getLatestChoiceHist(models, Object.assign(params, {
                                        id_node: row.id_node,
                                    }));
                                }).then(function(choices_hist) {
                                    row.choices = choices_hist;
                                }).then(function() {
                                    return directories;
                                })
                            });
                        }
                    });

                    p=p.then(function() {
                        resolve(directories);
                    });

                }
            }, function(err) {
                reject(err);
            });
        });
    },

    /*
     * return a promise of a path array of node_hist
     *
     * Do not path anything to path argument
     *
     */
    getNodePath(models, id_node, path) {
        //console.log("getNodePath: ", id_node, path);
        var self=this;

        if (path === undefined) {
            path=[];
        }

        return self.getLatestNodeHist(models, {
            id_node: id_node,
        }).then(function(hist) {
            if (hist) {
                path.unshift(hist);
            }
            if (hist && hist.id_node_parent) {
                return self.getNodePath(models, hist.id_node_parent, path);
            } else {
                return path;
            }
        })
    },

    /*
     * update the audit complete percent cache
     *
     * parameters:
     * models: the db models
     * id_audit: the id of the audit to update
     */

     update_audit_cached_complete(models, id_audit) {

         function count_questions(dir, nodeslist) {
             var r = {
                 question_count: 0,
                 answer_count: 0,
                 ignored_count: 0,
             };
             dir.forEach(function(row) {
                 if (row.type.startsWith('q_') && nodeslist.indexOf(row.id_node) !== -1) {
                     r.question_count++;
                     if (row.answer && row.answer.status == "saved") {
                         r.answer_count++;
                         if (row.answer.ignored)
                            r.ignored_count++;
                     }
                 }
                 else if (row.type == 'directory') {
                     var _r=count_questions(row.childs, nodeslist);
                     r.question_count += _r.question_count;
                     r.answer_count += _r.answer_count;
                     r.ignored_count += _r.ignored_count;
                 }
             });
             return r;
         }

         var audit=null;
         return models.audit.findOne({
             where: {
                 id: id_audit,
             }
         }).then(function(_audit) {
             audit=_audit;
             return dbtools.getLatestInquiryformHist(models, {
                 id_inquiryform: audit.id_inquiryform,
                 date: audit.createdAt,
             });
         }).then(function(inquiryform) {
             var nodeslist;
             try {
                 nodeslist = JSON.parse(inquiryform.nodeslist);
             } catch (err) {
                 nodeslist=[];
             }

             return dbtools.getLatestNodeHist(models, {
                 id_node_parent: null,
                 date: audit.createdAt,
                 id_audit: audit.id,
                 recurse: 1,
             }).then(function(tout) {
                 var r=count_questions(tout, nodeslist);
                 var percent = r.answer_count / r.question_count;
                 audit.cached_percent_complete = percent;
                 percent = r.ignored_count / r.question_count;
                 audit.cached_percent_ignored = percent;
                 return audit.save();
             });
         });
     },

};
