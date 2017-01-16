var USE_RESTIFY = true;

var Sequelize = require('sequelize'),
    epilogue = require('epilogue'),
    http = require('http');

var restify = require('restify'),
    sessions = require('client-sessions');

var config    = require(__dirname + '/config/config.json');

var models = require(__dirname + '/models_import');

// Define your models
var database = new Sequelize(config.sql.database, config.sql.username, config.sql.password);
var User = database.define('User', {
  username: Sequelize.STRING,
  birthday: Sequelize.DATE
});

// Initialize server
var server, app;
if (USE_RESTIFY) {
  var restify = require('restify');

  app = server = restify.createServer()
  app.use(restify.queryParser());
  app.use(restify.bodyParser());

  // sessions
  server.use(sessions({
      // cookie name dictates the key name added to the request object
      cookieName: 'session',
      // should be a large unguessable string
      secret: config.httpd.secret,
      // how long the session will stay valid in ms
      duration: 365 * 24 * 60 * 60 * 1000
  }));

  // Initialize http
  server.get(/^((?!\/rest\/).)*$/, restify.serveStatic({
          directory: './public_html/',
          default: 'index.html'
      }
  ));
} else {
  var express = require('express'),
      bodyParser = require('body-parser');

  var app = express();
  //app.use(bodyParser.json());
  //app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static('public_html'));
  server = http.createServer(app);
}

// Initialize epilogue
epilogue.initialize({
  app: app,
  sequelize: database
});

// Create REST resource
var auditResource = epilogue.resource({
  model: models.audit,
  endpoints: ['/rest/audits', '/rest/audits/:identifiant']
});

var themeResource = epilogue.resource({
  model: models.theme,
  endpoints: ['/rest/themes', '/rest/themes/:identifiant']
});

var rubriqueResource = epilogue.resource({
  model: models.rubrique,
  endpoints: ['/rest/rubriques', '/rest/rubriques/:identifiant']
});

var questionResource = epilogue.resource({
  model: models.question,
  endpoints: ['/rest/questions', '/rest/questions/:identifiant']
});

var reponseResource = epilogue.resource({
  model: models.reponse,
  endpoints: ['/rest/reponses', '/rest/reponses/:identifiant']
});

var choixResource = epilogue.resource({
  model: models.choix,
  endpoints: ['/rest/choix', '/rest/choix/:identifiant']
});

var etablissementResource = epilogue.resource({
  model: models.etablissement,
  endpoints: ['/rest/etablissements', '/rest/etablissements/:id']
});

var userResource = epilogue.resource({
  model: models.users,
  endpoints: ['/rest/users', '/rest/users/:user_id']
});

userResource.list.auth(function(req, res, context) {
    throw new epilogue.Errors.ForbiddenError("you are not authized to list users !");
});


// Create database and listen
database
  .sync({ force: true })
  .then(function() {
    server.listen(1242, function() {
      var host = server.address().address,
          port = server.address().port;

      console.log('listening at http://%s:%s', host, port);
    });
  });
