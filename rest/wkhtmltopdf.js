var wkhtmltopdf = require('wkhtmltopdf');
var fs = require('fs');

module.exports = function(server, epilogue, models, permchecks) {

 //     var doc = new jsPDF();
//    var specialElementHandlers = {
  //              '#bypassme': function (element, renderer) {
   //                 return true;
    //            }
     //       };
    //        doc.fromHTML(source, 0.5, 0.5, {
    //            'width': 75,'elementHandlers': specialElementHandlers
     //       });


    // server.post('/rest/pdf',
    //     //permchecks.haveAgent,
    //     function (req, res, next) {
    //       // wkhtmltopdf(req.body).pipe(res);
    //       console.log(req.body);
    //       // wkhtmltopdf(req.body, {output: 'out.pdf'});
    //       wkhtmltopdf('http://localhost:1242/audit/205/rapport', {javascriptDelay: 10000, enableJavascript: true, noStopSlowScripts: true}).pipe(fs.createWriteStream('out.pdf'));
    //     }
    // );

}
