var Promise = require("bluebird");

module.exports = {

    getLatestNodeHist: function(models, params) {
        return this.getLatestHist(models, 'node', params);
    },

    getLatestChoiceHist: function(models, params) {
        return this.getLatestHist(models, 'choice', params);
    },

    getLatestHist: function(models, tbl, params) {
        return new Promise(function(resolve, reject) {
            console.log("params: ", params);
            var date = '2222-12-22';

            if ('date' in params) {
                date = params.date;
            }

            var query = `
                select
                 `+(tbl == 'choice' ? `choice.id_node` : `${tbl}.id_${tbl}_parent`)+`,
                 nh1.*
                from ${tbl}
                left join ${tbl}_hist nh1 ON nh1.id_${tbl} = ${tbl}.id
                where nh1.createdAt=(
                 select max(createdAt)
                 from ${tbl}_hist nh2
                 where nh1.id_${tbl} = nh2.id_${tbl}
                 and createdAt <= ?
             ) `;

             if (!('with_deleteds' in params) || !params.with_deleteds) {
                query+=`and deletedAt IS NULL`;
             }

            var replacements = [ date ];


            if (tbl == 'choice') {
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
                    resolve(directories);
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
        console.log("getNodePath: ", id_node, path);
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
