var USE_RESTIFY = true;

var Sequelize = require('sequelize'),
    epilogue = require('epilogue'),
    http = require('http');

var restify = require('restify'),
    sessions = require('client-sessions');

var config    = require(__dirname + '/config/config.json');

var models = require(__dirname + '/models');

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
  sequelize: models.sequelize
});

// Create REST resource
var auditResource = epilogue.resource({
  model: models.audit,
  endpoints: ['/rest/audits', '/rest/audits/:id']
});

var inqueryformResource = epilogue.resource({
  model: models.inqueryform,
  endpoints: ['/rest/inqueryforms', '/rest/inqueryforms/:id']
});

var inqueryform_nodeResource = epilogue.resource({
  model: models.inqueryform_node,
  endpoints: ['/rest/inqueryforms_nodes', '/rest/inqueryforms_nodes/:id_inqueryform']
});

var nodeResource = epilogue.resource({
  model: models.node,
  endpoints: ['/rest/nodes', '/rest/nodes/:id']
});

var node_histResource = epilogue.resource({
  model: models.node_hist,
  endpoints: ['/rest/nodes_hists', '/rest/nodes_hists/:id']
});

var choiceResource = epilogue.resource({
  model: models.choice,
  endpoints: ['/rest/choices', '/rest/choices/:id']
});

var choice_histResource = epilogue.resource({
  model: models.choice_hist,
  endpoints: ['/rest/choices_hists', '/rest/choices_hists/:id']
});

var answerResource = epilogue.resource({
  model: models.answer,
  endpoints: ['/rest/answers', '/rest/answers/:id_audit/:id_node']
});

var establishmentResource = epilogue.resource({
  model: models.establishment,
  endpoints: ['/rest/establishments', '/rest/establishments/:id']
});

var userResource = epilogue.resource({
  model: models.users,
  endpoints: ['/rest/users', '/rest/users/:id']
});

/*
userResource.list.auth(function(req, res, context) {
    throw new epilogue.Errors.ForbiddenError("you are not authized to list users !");
});
*/

// Create database and listen
models.sequelize
  .sync({ force: false })
  .then(function() {
    server.listen(1242, function() {
      var host = server.address().address,
          port = server.address().port;

      console.log('listening at http://%s:%s', host, port);
    });
  });
