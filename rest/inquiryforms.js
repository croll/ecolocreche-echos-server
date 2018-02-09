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
            return models.inquiryform.create({
                inquiry_type: req.params.inquiry_type,
            }).then(function(inquiryform) {
                return models.inquiryform_hist.create({
                    id_inquiryform: inquiryform.get('id'),
                    title: req.params.title,
                    description: req.params.description,
                    comment: req.params.comment,
                    nodeslist: req.params.nodeslist,
                    position: req.params.position,
                    mail_from: req.params.mail_from,
                    mail_title: req.params.mail_title,
                    mail_body: req.params.mail_body,
                    audit_report_header: req.params.audit_report_header,
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
                return models.inquiryform_hist.create({
                    id_inquiryform: dir_hist.id_inquiryform,
                    title: req.params.title,
                    description: req.params.description,
                    comment: req.params.comment,
                    nodeslist: req.params.nodeslist,
                    position: req.params.position,
                    mail_from: req.params.mail_from,
                    mail_title: req.params.mail_title,
                    mail_body: req.params.mail_body,
                    audit_report_header: req.params.audit_report_header,
                });
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
