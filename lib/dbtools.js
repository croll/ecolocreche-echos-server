var Promise = require("bluebird");

module.exports = {

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
                 `+(tbl == 'choice' ? `choice.id_node,` : '')+`
                 `+(tbl == 'node' ? `node.id_node_parent,` : '')+`
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

            if (`id_${tbl}` in params
                && params[`id_${tbl}`] !== null
                && params[`id_${tbl}`] !== "null") {
                query+=` and ${tbl}.id = ?`;
                replacements.push(params[`id_${tbl}`]);
            }

            // finaly, order this by position
            if (tbl != 'inquiryform')
                query+=` order by position`;
            else {
                query+=` order by createdAt`;
            }

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
                    if (params.recurse && tbl == 'node') {
                        var p = new Promise(function (resolve, reject) {
                            resolve();
                        });

                        directories.forEach(function(row) {
                            p=p.then(function() {
                                var params2 = {};
                                Object.assign(params2, params);
                                params2[`id_${tbl}_parent`]=row.id_node;
                                return self.getLatestHist(models, tbl, params2).then(function(subrow) {
                                    row.childs = subrow;
                                })
                            });
                        });

                        p=p.then(function() {
                            resolve(directories);
                        });
                    } else {
                        resolve(directories);
                    }
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

};
