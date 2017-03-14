var wkhtmltopdf = require('wkhtmltopdf-selfcontained');
var fs = require('fs');

module.exports = function(server, epilogue, models, permchecks) {

    server.post('/rest/pdf',
      permchecks.haveAgent,
      function (req, res, next) {
        try {
            // for debug, save html file in /tmp
            fs.writeFile("/tmp/test.html", req.body, function(err) {
                if(err) {
                    return console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });

            var stream = wkhtmltopdf(req.body, {
                marginTop: 20,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
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
