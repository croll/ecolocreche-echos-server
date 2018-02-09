var restify = require('restify');
var dbtools = require(__dirname + '/../lib/dbtools.js');

module.exports = function(server, epilogue, models, permchecks) {


    /*
     * list inquiryforms at moment
     *
     * optional params :
     *  - date: <date string> : return inquiryforms has they where on this date, '2222-12-22' by default
     */
    server.get('/rest/hist/inquiryforms',
        //permchecks.haveAgent,
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
        //permchecks.haveAgent,
        function (req, res, next) {
            return dbtools.getLatestInquiryformHist(models, req.params).then(function(dir_hist) {
                if (!dir_hist) {
                    return next(new restify.NotFoundError("Not found"));
                } else {
                    res.send(dir_hist);
                }
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
            return models.inquiryform.create(req.params, {
                fields: ['inquiry_type', 'mail_from', 'mail_subject', 'mail_body', 'audit_report_header'],
            }).then(function(inquiryform) {
                req.params.id_inquiryform = inquiryform.get('id');
                return models.inquiryform_hist.create(req.params, {
                    fields: ['id_inquiryform', 'title', 'description', 'comment', 'nodeslist', 'position']
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
                return models.inquiryform.update(req.params, {
                    where: {
                        id: dir_hist.id_inquiryform,
                    },
                    fields: ['mail_from', 'mail_subject', 'mail_body', 'audit_report_header'],
                });
            }).then(function(new_inquiryform) {
                return models.inquiryform_hist.create(req.params, {
                    fields: ['id_inquiryform', 'title', 'description', 'comment', 'nodeslist', 'position']
                });
            }).then(function(new_inquiryform_hist) {
                return dbtools.getLatestInquiryformHist(models, {
                    id_inquiryform: req.params.id_inquiryform,
                });
            }).then(function(new_dir_hist) {
                    res.send(new_dir_hist);
            }, function(err) {
                throw new epilogue.Errors.EpilogueError(500, err);
            });
        }
    );

    server.del('/rest/hist/inquiryforms/:id_inquiryform',
        permchecks.haveAdmin,
        function (req, res, next) {
            return models.inquiryform.findOne({
                where: {
                    id: req.params.id_inquiryform,
                }
            }).then(function(inquiryform) {
                if (inquiryform) {
                    return inquiryform.destroy();
                } else {
                    return false;
                }
            }).then(function(res) {
                return dbtools.getLatestNodeHist(models, {
                    id_inquiryform: req.params.id_inquiryform,
                });
            }).then(function(dir_hist) {
                res.send(dir_hist);
            }, function(err) {
                console.error(err);
                return next(new restify.InternalServerError(err));
            });
        }
    );
}
