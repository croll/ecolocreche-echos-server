var dbtools = require(__dirname + '/../lib/dbtools.js');

module.exports = function(server, epilogue, models, permchecks) {


    /*
     * list inquiryforms at moment
     *
     * optional params :
     *  - date: <date string> : return inquiryforms has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/inquiryforms',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestInquiryformHist(models, req.params).then(function(dirs) {
                res.send(dirs);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * get inquiryform at moment
     *
     * optional params :
     *  - date: <date string> : return inquiryforms has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/inquiryforms/:id_inquiryform',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestInquiryformHist(models, req.params).then(function(dir_hist) {
                res.send(dir_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * add a new inquiryform
     */
    server.post('/rest/hist/inquiryforms',
        permchecks.haveAdmin,
        function (req, res, next) {
            return models.inquiryform.create({
            }).then(function(inquiryform) {
                return models.inquiryform_hist.create({
                    id_inquiryform: inquiryform.get('id'),
                    title: req.params.title,
                    description: req.params.description,
                    nodeslist: req.params.nodeslist,
                    position: req.params.position,
                });
            }).then(function(inquiryform_hist) {
                res.send(inquiryform_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    /*
     * edit a inquiryform
     */
    server.put('/rest/hist/inquiryforms/:id_inquiryform',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestInquiryformHist(models, {
                id_inquiryform: req.params.id_inquiryform,
            }).then(function(dir_hist) {
                return models.inquiryform_hist.findOne({
                    where: {
                        id: dir_hist.id,
                    }
                });
            }).then(function(inquiryform_hist) {
                return inquiryform_hist.update(req.params, {
                    fields: [
                        'title', 'description', 'position', 'nodeslist'
                    ],
                })
            }).then(function(inquiryform_hist) {
                    res.send(inquiryform_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    server.del('/rest/hist/inquiryforms/:id_inquiryform',
        permchecks.haveAdmin,
        function (req, res, next) {
            return dbtools.getLatestInquiryformHist(models, {
                id_inquiryform: req.params.id_inquiryform,
            }).then(function(dir_hist) {
                return models.inquiryform_hist.findOne({
                    where: {
                        id: dir_hist.dataValues.id,
                    }
                });
            }).then(function(inquiryform_hist) {
                return inquiryform_hist.destroy();
            }).then(function(inquiryform_hist) {
                res.send(inquiryform_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );
}
