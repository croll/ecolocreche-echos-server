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
                 ${tbl}.id_${tbl}_parent,
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


            if (`id_${tbl}_parent` in params) {
                if (params[`id_${tbl}_parent`] === null
                    || params[`id_${tbl}_parent`] == "null") {
                    query+=` and ${tbl}.id_${tbl}_parent IS NULL`;
                } else {
                    query+=` and ${tbl}.id_${tbl}_parent = ?`;
                    replacements.push(params[`id_${tbl}_parent`]);
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
                        reject(`latest ${tbl}_hist not found !`);
                    }
                } else {
                    resolve(directories);
                }
            }, function(err) {
                reject(err);
            });
        });
    }

};
