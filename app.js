var express = require('express'),
    app = express(),
    request = require('request');

var sparqlModels = require('./queries/sparql-models'),
    sparqlGPs = require('./queries/sparql-gp'),
    sparqlGOs = require('./queries/sparql-go'),
    sparqlPMIDs = require('./queries/sparql-pmids'),
    sparqlGroups = require('./queries/sparql-groups'),
    sparqlUsers = require('./queries/sparql-users'),
    sparqlSpecies = require('./queries/sparql-species');

var utils = require('./utils');



// app.get('/', function(req, res) {
//   res.send( { "message": "Welcome to api.geneontology.cloud" } );
// });






// ================================================================================
//
//                           ROUTES: /models
//
// ================================================================================

keysArrayModels = ["orcids", "names", "groupids", "groupnames"];
app.get('/models', function(req, res) {
  // send a range of models (start, start + size)
  if(req.query.start && req.query.size) {
    utils.fetchAndSend(res, sparqlModels.ModelList(req.query.start, req.query.size), false, keysArrayModels);
  // send the <last> models
  } else if(req.query.last) {
    utils.fetchAndSend(res, sparqlModels.ModelList(0, req.query.last), false, keysArrayModels);
  // send the <group> models
  } else if(req.query.group) {
    utils.fetchAndSend(res, sparqlGroups.GroupModelList(req.query.group), false, keysArrayModels);
  // send the <user> models
  } else if(req.query.user) {
    utils.fetchAndSend(res, sparqlUsers.UserModelList(req.query.user), false, keysArrayModels);
  // send the <pmid> models
  } else if(req.query.pmid) {
    utils.fetchAndSend(res, sparqlPMIDs.PMIDModelList(req.query.pmid), false, keysArrayModels);
  
  // send all models
  } else {
    utils.fetchAndSend(res, sparqlModels.ModelList(), false, keysArrayModels);
  }
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





app.get('/taxon/:taxon/models', function(req, res) {
  utils.fetchAndSend(res, sparqlSpecies.getSpeciesModels(req.params.taxon), false);
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

keysArrayUserModels = ["bpids", "bpnames", "gpids", "gpnames"];
app.get('/users/:orcid/models', function(req, res) {
  utils.fetchAndSend(res, sparqlUsers.UserModels(req.params.orcid), false, keysArrayUserModels);
});

keysArrayUserGPs = ["gocams", "dates", "titles"];
app.get('/users/:orcid/gp', function(req, res) {
  utils.fetchAndSend(res, sparqlUsers.UserGPs(req.params.orcid), false, keysArrayUserGPs);
});






// ================================================================================
//
//                           ROUTES: /groups
//
// ================================================================================

app.get('/groups', function(req, res) {  
  utils.fetchAndSend(res, sparqlGroups.GroupList());
});

// keysArrayGroups = ["membersOrcid", "membersName", "modelsList", "titlesList"]
// app.get('/groups/details', function(req, res) {
//   utils.fetchAndSend(res, sparqlGroups.GroupListDetails(), false, keysArrayGroups);
// });

app.get('/groups/:name', function(req, res) {
  utils.fetchAndSend(res, sparqlGroups.GroupMeta(req.params.name));
});






// ================================================================================
//
//                           ROUTES: /go
//
// ================================================================================

keysArrayGO = ["synonyms", "relatedSynonyms", "alternativeIds", "xrefs", "subsets"]
app.get('/go/:id', function(req, res) {
  utils.fetchAndSend(res, sparqlGOs.getSummary(req.params.id), true, keysArrayGO);
});

app.get('/go/:id/models', function(req, res) {
  utils.fetchAndSend(res, sparqlGOs.getGOModels(req.params.id));
});

app.get('/go/:id/hierarchy', function(req, res) {
  utils.fetchAndSend(res, sparqlGOs.getHierarchy(req.params.id));
});




app.get('/association/between/:subject/:object', function(req, res) {
  if(req.query.relation == "shared") {
    utils.golrSharedClass(res, req.params.subject, req.params.object);
  } else if(req.query.relation = "closest") {
    utils.golrClosestCommonClass(res, req.params.subject, req.params.object);    
  } else {
    utils.golrAssociation(res, req.params.subject, req.params.object, req.query.relation);
  }
});



// ================================================================================
//
//                           ROUTES: /gp
//
// ================================================================================

app.get('/gp/:id/models', function(req, res) {
  utils.fetchAndSend(res, sparqlGPs.getGPModels(req.params.id));
});






// ================================================================================
//
//                           ROUTES: /pmid
//
// ================================================================================

app.get('/pmid/:id/models', function(req, res) {
  utils.fetchAndSend(res, sparqlPMIDs.getPMIDModels(req.params.id));
});



// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
