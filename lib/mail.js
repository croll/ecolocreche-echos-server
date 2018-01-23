const nodemailer = require('nodemailer');
const config    = require(__dirname + '/../config/config.json');
const stringInject = require('stringinject').default;

module.exports = {

    /*
     * send an email
     * default is to use a "from" from config file
     * options is an object which can contain essentially from, to, subject, text, html, ...
     */
    send: function(options) {
        return new Promise(function(resolve, reject) {
            console.log("sending email...");

            options = Object.assign({
                from: config.email.from,
            }, options);

            try {
                var transporter = nodemailer.createTransport(config.email.transport);
                transporter.sendMail(options, (err, info) => {
                    if (err) {
                        console.error("error while sending mail : ", err);
                        reject(err);
                    } else {
                        //console.log(info.envelope);
                        //console.log(info.messageId);
                        resolve(info);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    },


    tplsend: function(options) {
        options.subject = stringInject(options.subject, options.replaces);
        options.text = stringInject(options.text, options.replaces);
        return this.send(options);
    }
}
