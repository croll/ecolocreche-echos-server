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
  server.get(/^((?!\/rest\/).)*$/, function(req, res, next) {
      if (req.url.indexOf(".") !== -1) {
          return restify.serveStatic({
              directory: './public_html/',
              default: 'index.html'
          })(req, res, next);
      } else {
          return restify.serveStatic({
              directory: './public_html/',
              file: 'index.html'
          })(req, res, next);
      }
    }
  );
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

permchecks = {};

permchecks.haveAdmin = function(req, res, context) {
    if ('user' in req.session && req.session.user
        && req.session.user.account_type == 'admin') {
        // ok
        if (context instanceof Function) // context is next()
            context();
        else // context is really context of epilogue
            return context.continue;
    } else {
        // not ok
        throw new epilogue.Errors.ForbiddenError("you are not allowed to do this");
    }
}

permchecks.haveSuperAgent = function(req, res, context) {
    if ('user' in req.session && req.session.user
        && (req.session.user.account_type == 'superagent'
            || req.session.user.account_type == 'admin')) {
        // ok
        if (context instanceof Function) // context is next()
            context();
        else // context is really context of epilogue
            return context.continue;
    } else {
        // not ok
        throw new epilogue.Errors.ForbiddenError("you are not allowed to do this");
    }
}

permchecks.haveAgent = function(req, res, context) {
    if ('user' in req.session && req.session.user
        && (req.session.user.account_type == 'agent'
            || req.session.user.account_type == 'superagent'
            || req.session.user.account_type == 'admin')) {
        // ok
        if (context instanceof Function) // context is next()
            context();
        else // context is really context of epilogue
            return context.continue;
    } else {
        // not ok
        throw new epilogue.Errors.ForbiddenError("you are not allowed to do this");
    }
}

// default permissions
permchecks.default_permissions = {
    create: {
      auth: permchecks.haveAdmin,
    },
    list: {
      auth: permchecks.haveAdmin,
    },
    read: {
      auth: permchecks.haveAdmin,
    },
    update: {
      auth: permchecks.haveAdmin,
    },
    delete: {
      auth: permchecks.haveAdmin,
    },
};

require(__dirname+'/rest/users')(server, epilogue, models, permchecks);
require(__dirname+'/rest/nodes')(server, epilogue, models, permchecks);
require(__dirname+'/rest/choices')(server, epilogue, models, permchecks);
require(__dirname+'/rest/inquiryforms')(server, epilogue, models, permchecks);
require(__dirname+'/rest/audits')(server, epilogue, models, permchecks);

// Create REST resource
var inqueryformResource = epilogue.resource({
  model: models.inquiryform,
  endpoints: ['/rest/inquiryforms', '/rest/inquiryforms/:id']
});
inqueryformResource.use(permchecks.default_permissions);

var nodeResource = epilogue.resource({
  model: models.node,
  endpoints: ['/rest/nodes', '/rest/nodes/:id']
});
nodeResource.use(permchecks.default_permissions);

var node_histResource = epilogue.resource({
  model: models.node_hist,
  endpoints: ['/rest/nodes_hists', '/rest/nodes_hists/:id']
});
node_histResource.use(permchecks.default_permissions);

var choiceResource = epilogue.resource({
  model: models.choice,
  endpoints: ['/rest/choices', '/rest/choices/:id']
});
choiceResource.use(permchecks.default_permissions);

var choice_histResource = epilogue.resource({
  model: models.choice_hist,
  endpoints: ['/rest/choices_hists', '/rest/choices_hists/:id']
});
choice_histResource.use(permchecks.default_permissions);

var answerResource = epilogue.resource({
  model: models.answer,
  endpoints: ['/rest/answers', '/rest/answers/:id_audit/:id_node']
});
answerResource.use(permchecks.default_permissions);

var establishmentResource = epilogue.resource({
  model: models.establishment,
  endpoints: ['/rest/establishments', '/rest/establishments/:id']
});
establishmentResource.use(permchecks.default_permissions);



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
