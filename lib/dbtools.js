var Promise = require("bluebird");

module.exports = {
    getLatestNodeHist: function(models, params) {
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

};
