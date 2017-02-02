var dbtools = require(__dirname + '/../lib/dbtools.js');

module.exports = function(server, epilogue, models) {


    /*
     * list inquiryforms at moment
     *
     * optional params :
     *  - date: <date string> : return inquiryforms has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/inquiryforms', function (req, res, next) {
        return dbtools.getLatestInquiryformHist(models, req.params).then(function(dirs) {
            res.send(dirs);
        }, function(err) {
            throw new epilogue.Errors.EpilogueError(500, err);
        });
    });

    /*
     * get inquiryform at moment
     *
     * optional params :
     *  - date: <date string> : return inquiryforms has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/inquiryforms/:id_inquiryform', function (req, res, next) {
        return dbtools.getLatestInquiryformHist(models, req.params).then(function(dir_hist) {
            res.send(dir_hist);
        }, function(err) {
            throw new epilogue.Errors.EpilogueError(500, err);
        });
    });

    /*
     * add a new inquiryform
     */
    server.post('/rest/hist/inquiryforms', function (req, res, next) {
        return models.inquiryform.create({
        }).then(function(inquiryform) {
            return models.inquiryform_hist.create({
                id_inquiryform: req.params.id_inquiryform,
                type: req.params.type,
                title: req.params.title,
                description: req.params.description,
                position: req.params.position,
                color: req.params.color
            });
        }).then(function(inquiryform_hist) {
            res.send(inquiryform_hist);
        }, function(err) {
            throw new epilogue.Errors.EpilogueError(500, err);
        });
    });

    /*
     * edit a inquiryform
     */
    server.put('/rest/hist/inquiryforms/:id_inquiryform', function (req, res, next) {
        return dbtools.getLatestInquiryformHist(models, {
            id_inquiryform: req.params.id_inquiryform,
        }).then(function(dir_hist) {
            return models.inquiryform_hist.findOne({
                where: {
                    id: dir_hist.dataValues.id,
                }
            });
        }).then(function(inquiryform_hist) {
            return inquiryform_hist.update(req.params, {
                fields: [
                    'type', 'title', 'description', 'position', 'color'
                ],
            })
        }).then(function(inquiryform_hist) {
                res.send(inquiryform_hist);
        }, function(err) {
            throw new epilogue.Errors.EpilogueError(500, err);
        });
    });

    server.del('/rest/hist/inquiryforms/:id_inquiryform', function (req, res, next) {
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
    });
}
