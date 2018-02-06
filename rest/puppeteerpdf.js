const puppeteer = require('puppeteer');
var fs = require('fs');
var tmpfs = require('tmp-promise');




module.exports = function(server, epilogue, models, permchecks) {

    const timeout = ms => new Promise(res => setTimeout(res, ms));

    server.post('/rest/pdf',
      permchecks.haveAgent,
      function (req, res, next) {
          //console.log('Cookies: ', req.cookies);
        try {
            var url="";
            var domain="localhost";
            var homeurl="http://"+domain+":1242";
            if ((req.body.what == 'audit') && (parseInt(req.body.id) > 0)) {
                url="/audit/"+parseInt(req.body.id)+"/rapport";
            } else if ((req.body.what == 'recapaction') && (parseInt(req.body.id) > 0)) {
                url="/recap_actions/"+parseInt(req.body.id);
            }

            if (url.length > 0) {
                url=homeurl+url;
            } else {
                throw new Error('bad request');
            }

            (async () => {
                //const browser = await puppeteer.launch();
                const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
                const page = await browser.newPage();
                await page.setCookie({
                    name: "session",
                    value: req.cookies.session,
                    url: url,
                    domain: domain,
                    path: '/',
                    //expires: new Date() / 1000 + 20, // 20 secondes to do the job ;)
                    httpOnly: false,
                    secure: false,
                    sameSite: "Lax",
                });
                await page.goto(url, {waitUntil: 'networkidle2'});
                await timeout(5000);
                var tmpfile = await tmpfs.file();
                await page.pdf({path: tmpfile.path, format: 'A4', printBackground: true});

                await browser.close();

                var readStream = fs.createReadStream(tmpfile.path);
                // We replaced all the event handlers with a simple call to readStream.pipe()
                res.setHeader('content-type', 'application/pdf');
                readStream.pipe(res);
                tmpfile.cleanup();
            })();

            /*
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
            */
        } catch (err) {
            console.error(err);
        }
      }
    );

}
