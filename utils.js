var request = require("request");

var config = require("./config");

module.exports = {

    /**
     * Generic Method to transform and send the transformed version of the SPARL Query (url)
     */
    GetJSON(url) {
        var options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-results+json',
                'Accept': 'application/json',
            }
        };

        return request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return error;
            } else {
                return JSON.parse(body).results.bindings;
            }
        });
    },




    /**
     * @param {string}   url         a string URL to populate the options field of request
     */
    prepare(url) {
        //        console.log("config: ", config);
        var options = {
            uri: config.rdfStore + url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-results+json',
                'Accept': 'application/json',
            }
        };
        return options;
    },


    addCORS(res) {
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token");
        res.setHeader("Access-Control-Allow-Methods", "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT");
        res.setHeader("Access-Control-Allow-Origin", "*");
    },

    /**
     * @param {json}   data         json retrieved from triples
     * @param {Array}  keysArray    the keys that must be taken as [string] and not string
     */
    transform(data, keysArray) {
        var transformed = {};
        Object.keys(data).forEach(key => {
            if (keysArray && keysArray.includes(key)) {
                transformed[key] = this.splitTrim(data[key].value, config.separator);
            } else {
                transformed[key] = data[key].value.trim();
            }
        });
        return transformed;
    },

    /**
     * @param {json}   data         json retrieved from triples
     * @param {Array}  keysArray    the keys that must be taken as [string] and not string
     */
    transformArray(data, keysArray) {
        return data.map(elt => {
            return this.transform(elt, keysArray);
        });
    },



    getOrcid(orcid) {
        var re = /[\d]+[-][\d]+/;

        var modOrcid = orcid;
        if (re.test(orcid)) {
            modOrcid = "http://orcid.org/" + orcid;
        }
        modOrcid = "\"" + modOrcid + "\"^^xsd:string";
        return modOrcid;
    },

    /* Split the string argument, and if defined, add a prefix & suffix to each splitted string */
    splitTrim(string, split, prefix, suffix) {
        if (!prefix)
            prefix = "";
        if (!suffix)
            suffix = "";

        var array = string.split(split);
        return array.map(item => {
            return prefix + item.trim() + suffix;
        });
    },


    concat(a, b) {
        return a + " " + b;
    },



    fetchAndSend(expressResponse, sparqlURLQuery, sendOnlyFirst = false, keysArray) {
        var options = {
            uri: config.rdfStore + sparqlURLQuery,
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-results+json',
                'Accept': 'application/json',
            }
        };


        ut = this;
        ut.addCORS(expressResponse);
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let data = JSON.parse(body).results.bindings;

                if (Array.isArray(data)) {
                    data = ut.transformArray(data, keysArray);
                    if (sendOnlyFirst)
                        data = data[0];
                } else {
                    data = ut.transform(data, keysArray)
                }

                expressResponse.json(data);
            }
        });
    },




    /**
     * 
     * @param {*} sparqlURLQuery the URL formatted sparql Query
     * @param {*} keysArray 
     * @param {*} callback 
     */
    fetchData(sparqlURLQuery, keysArray, callback) {
        var options = {
            uri: config.rdfStore + sparqlURLQuery,
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-results+json',
                'Accept': 'application/json',
            }
        };

        ut = this;
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                callback({ "error" : error });
            } else {

                let data = JSON.parse(body).results.bindings;

                if (Array.isArray(data)) {
                    data = ut.transformArray(data, keysArray);
                } else {
                    data = ut.transform(data, keysArray)
                }

                callback(null, data);
            }
        });
    },    


    /**
     * 
     * @param {*} jsonArray should have the exact same fields for each element of the array
     * @param {*} field json field on which the json objects will be merged
     */
    mergeResults(jsonArray, field) {
        let mapping = new Map();
        let array;

        jsonArray.forEach(elt => {
            if(mapping.has(elt[field])) {
                array = mapping.get(elt[field]);
            } else {
                array = [];
                mapping.set(elt[field], array);
            }
            delete elt[field];
            array.push(elt);
        });

        newJson = [];
        let obj = {};
        for(var [key, value] of mapping.entries()) {
            obj = { };
            obj[field] = key;

            let keys = Object.keys(array[0]);
            keys.forEach(key => {
                sub = [];
                value.forEach(elt => {
                    // by definition, each array contains only 1 element, hence this merging
                    sub.push(elt[key][0]);
                });
                obj[key] = sub;
            });
            newJson.push(obj);
        }

        return newJson;
    },


    fetchAndSendGOlr(expressResponse, url, sendOnlyFirst = false) {
        var options = {
            uri: url,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };

        ut = this;
        ut.addCORS(expressResponse);
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let data = JSON.parse(body).response.docs;
                if (sendOnlyFirst)
                    data = data[0];
                expressResponse.json(data);
            }
        });
    },


    golrSubclass(expressResponse, subject, object) {
        ut = this;
        ut.addCORS(expressResponse);
        
        let golrSubject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + subject + "%22&fl=isa_partof_closure,isa_partof_closure_label&wt=json";
    
        var options = {
            uri: golrSubject,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let found = false;
                let data = JSON.parse(body).response.docs[0];
                data["isa_partof_closure"].forEach(elt => {
                    if(elt == object) {
                        found = true;
                    }
                });

                // if not found, also search in label
                if(!found) {
                    data["isa_partof_closure_label"].forEach(elt => {
                        if(elt == object) {
                            found = true;
                        }
                    });
                }       
                expressResponse.send({ "result": found });

            }
        });
    },

    golrSharedClass(expressResponse, subject, object) {
        ut = this;
        ut.addCORS(expressResponse);
        
        let golrSubject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + subject + "%22&fl=isa_partof_closure,isa_partof_closure_label&wt=json";
        let golrObject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + object + "%22&fl=isa_partof_closure,isa_partof_closure_label&wt=json";
    
        var options = {
            uri: golrSubject,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let data = JSON.parse(body).response.docs[0];

                var options2 = {
                    uri: golrObject,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    }
                };
        
                request(options2, function (error, response, body) {
                    if (error || response.statusCode != 200) {
                        expressResponse.send({ "error" : error });
                    } else {
        
                        let data2 = JSON.parse(body).response.docs[0];
                        // console.log("\n****\nsubject: (" + subject + "): ", data["isa_partof_closure"]);
                        // console.log("\n****\nobject: (" + object + "): ", data2["isa_partof_closure"]);

                        let shared = [];
                        let sharedLabels = [];
                        let found;

                        let list1 = data["isa_partof_closure"];
                        let list2 = data2["isa_partof_closure"];
                        for(let i = 0; i < list1.length; i++) {
                            found = false;
                            for(let j = 0; j < list2.length; j++) {
                                if(list1[i] == list2[j]) {
                                    found = true;
                                }
                            }
                            if(found) {
                                shared.push(list1[i]);
                                sharedLabels.push(data["isa_partof_closure_label"][i]);
                            }
                        }

                        let result = {
                            "shared": shared,
                            "shared_labels": sharedLabels
                        }

                        expressResponse.json(result);
                        
                    }
                });

            }
        });
    
    },

    golrClosestCommonClass(expressResponse, subject, object, relation) {
        ut = this;
        ut.addCORS(expressResponse);
        
        let golrSubject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + subject + "%22&fl=neighborhood_graph_json&wt=json";
        let golrObject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + object + "%22&fl=neighborhood_graph_json&wt=json";
    
        var options = {
            uri: golrSubject,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let data = JSON.parse(body).response.docs[0];
                let graph = JSON.parse(data['neighborhood_graph_json']);

                let isaSet = new Set();
                let partOfSet = new Set();
                graph.edges.forEach(edge => {
                    if(edge.sub == subject) {
                        if(edge.pred == "is_a") {
                            isaSet.add(edge.obj);
                        } else if(edge.pred == "BFO:0000050") {
                            partOfSet.add(edge.obj);
                        }
                    } else if(edge.obj == subject) {
                        if(edge.pred == "is_a") {
                            isaSet.add(edge.sub);
                        } else if(edge.pred == "BFO:0000050") {
                            partOfSet.add(edge.sub);
                        }
                    }
                });

                // console.log("isaSet: ", isaSet);
                // console.log("partOfSet: ", partOfSet);


                var options2 = {
                    uri: golrObject,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    }
                };
        
                request(options2, function (error, response, body) {
                    if (error || response.statusCode != 200) {
                        expressResponse.send({ "error" : error });
                    } else {
        
                        let data2 = JSON.parse(body).response.docs[0];
                        let graph2 = JSON.parse(data2['neighborhood_graph_json']);

                        let isaSet2 = new Set();
                        let partOfSet2 = new Set();
                        graph2.edges.forEach(edge => {
                            if(edge.sub == object) {
                                if(edge.pred == "is_a") {
                                    isaSet2.add(edge.obj);
                                } else if(edge.pred == "BFO:0000050") {
                                    partOfSet2.add(edge.obj);
                                }
                            } else if(edge.obj == object) {
                                if(edge.pred == "is_a") {
                                    isaSet2.add(edge.sub);
                                } else if(edge.pred == "BFO:0000050") {
                                    partOfSet2.add(edge.sub);
                                }
                            }
                        });            
                        

//                        isaSet2.add(isaSet.keys().next().value.trim());
                        let sharedIsA = [];
                        for (let isa of isaSet) {
                            if(isaSet2.has(isa)) {
                                sharedIsA.push(isa);
//                                console.log("adding ", isa);
                            }
                        }

                        partOfSet2.add(partOfSet.keys().next().value.trim());
                        let sharedPartOf = [];
                        for (let partOf of partOfSet) {
                            if(partOfSet2.has(partOf)) {
                                sharedPartOf.push(partOf);
                            }
                        }

                        
                        let result = {
                            "sharedIsA": sharedIsA,
                            "sharedPartOf": sharedPartOf
                        }

                        expressResponse.json(result);
                        
                    }
                });

            }
        });
    
    },




    golrAssociation(expressResponse, subject, object, relation) {
        ut = this;
        ut.addCORS(expressResponse);
        
        let associationField;
        let golrSubject = "http://golr-aux.geneontology.io/solr/select?fq=document_category:%22ontology_class%22&q=*:*&fq=id:%22" + subject + "%22&wt=json"

        switch(relation) {
            case "isa":
                golrSubject += "&fl=isa_closure,isa_closure_label";
                associationField = "isa_closure";
                break;
            case "isa_partof":
                golrSubject += "&fl=isa_partof_closure,isa_partof_closure_label";
                associationField = "isa_partof_closure";
                break;
            case "regulates":
                golrSubject += "&fl=regulates_closure,regulates_closure_label";
                associationField = "regulates_closure";
                break;
            default:
                golrSubject += "&fl=isa_partof_closure,isa_partof_closure_label";
                associationField = "isa_partof_closure";
                break;
        }
    
        var options = {
            uri: golrSubject,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                expressResponse.send({ "error" : error });
            } else {

                let found = false;
                let data = JSON.parse(body).response.docs[0];
                data[associationField].forEach(elt => {
                    if(elt == object) {
                        found = true;
                    }
                });

                // if not found, also search in label
                if(!found) {
                    data[associationField + "_label"].forEach(elt => {
                        if(elt == object) {
                            found = true;
                        }
                    });
                }       
                expressResponse.send({ "result": found });

            }
        });
    }
    

}
