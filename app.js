var express = require('express'),
    app = express(),
    request = require('request');

var sparqlModels = require('./queries/sparql-models'),
    sparqlGOs = require('./queries/sparql-go'),
    sparqlGroups = require('./queries/sparql-groups'),
    sparqlUsers = require('./queries/sparql-users');

var utils = require('./utils');



app.get('/', function(req, res) {
  res.send( { "message": "Welcome to api.geneontology.cloud" } );
});




// ================================================================================
//
//                           ROUTES: /models
//
// ================================================================================

keysArrayModels = ["orcids", "names", "groupids", "groupnames"];
app.get('/models', function(req, res) {
  if(req.query.start && req.query.size) {
    utils.fetchAndSend(res, sparqlModels.ModelListRange(req.query.start, req.query.size), false, keysArrayModels);
  } else {
    utils.fetchAndSend(res, sparqlModels.ModelList(), false, keysArrayModels);
  }
});

app.get('/models/last/:nb', function(req, res) {
  utils.fetchAndSend(res, sparqlModels.LastModels(req.params.nb), false, keysArrayModels);
});

// Must combine the results per gocam
keysArrayGOs = ["goclasses", "goids", "gonames", "definitions"]
app.get('/models/go', function(req, res) {
  let gocams = req.query.gocams;
  if(gocams) {
    gocams = utils.splitTrim(gocams, ",", "<http://model.geneontology.org/", ">");
    utils.fetchData(sparqlModels.ModelsGOs(gocams), keysArrayGOs, (error, data) => {
      utils.addCORS(res);
      res.send(utils.mergeResults(data, "gocam"));
    });
  } else {
    utils.fetchData(sparqlModels.AllModelsGOs(gocams), keysArrayGOs, (error, data) => {
      utils.addCORS(res);
      res.send(utils.mergeResults(data, "gocam"));
    });
  }
});

keysArrayGPs = ["gpnames", "gpids"]
app.get('/models/gp', function(req, res) {
  let gocams = req.query.gocams;
  if(gocams) {
    gocams = utils.splitTrim(gocams, ",", "<http://model.geneontology.org/", ">");
    utils.fetchAndSend(res, sparqlModels.ModelsGPs(gocams), false, keysArrayGPs);
  } else {
    utils.fetchAndSend(res, sparqlModels.AllModelsGPs(), false, keysArrayGPs);
  }
});

keysArrayPMIDs = ["sources"]
app.get('/models/pmid', function(req, res) {
  let gocams = req.query.gocams;
  if(gocams) {
    gocams = utils.splitTrim(gocams, ",", "<http://model.geneontology.org/", ">");
    utils.fetchAndSend(res, sparqlModels.ModelsPMIDs(gocams), false, keysArrayPMIDs);
  } else {
    utils.fetchAndSend(res, sparqlModels.AllModelsPMIDs(), false, keysArrayPMIDs);
  }
});

// must be place at the end (route priority)
app.get('/models/:id', function(req, res) {
  utils.fetchAndSend(res, sparqlModels.Model(req.params.id), false);
});




// ================================================================================
//
//                           ROUTES: /users
//
// ================================================================================

keysArrayUsers = ["organizations", "affiliations"];
app.get('/users', function(req, res) {
  utils.fetchAndSend(res, sparqlUsers.UserList(), false, keysArrayUsers);
});

keysArrayUser = ["organizations", "affiliations", "affiliationsIRI", "gocams", "gocamsDate", "gocamsTitle", "gpnames", "gpids", "bpnames", "bpids"];
app.get('/users/:orcid', function(req, res) {
  utils.fetchAndSend(res, sparqlUsers.UserMeta(req.params.orcid), true, keysArrayUser);
});




// ================================================================================
//
//                           ROUTES: /groups
//
// ================================================================================

app.get('/groups', function(req, res) {
  utils.fetchAndSend(res, sparqlGroups.GroupList(), false);
});

app.get('/groups/:name', function(req, res) {
  utils.fetchAndSend(res, sparqlGroups.GroupMeta(req.params.name), true);
});



// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
