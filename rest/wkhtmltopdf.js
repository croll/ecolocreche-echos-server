var wkhtmltopdf = require('wkhtmltopdf');
var fs = require('fs');

module.exports = function(server, epilogue, models, permchecks) {

    server.post('/rest/pdf',
      permchecks.haveAgent,
      function (req, res, next) {
        try {
            var stream = wkhtmltopdf(req.body, {
                //javascriptDelay: 10000,
                //enableJavascript: true,
                //noStopSlowScripts: true,
            });

            res.setHeader('content-type', 'application/pdf');
            stream.pipe(res);
        } catch (err) {
            console.error(err);
        }
      }
    );

}
