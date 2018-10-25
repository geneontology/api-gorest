var separator = require("../config").separator;

var utils = require("../utils");

module.exports = {

    UserMeta(orcid) {
        var modOrcid = utils.getOrcid(orcid);
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX BP: <http://purl.obolibrary.org/obo/GO_0008150>
        PREFIX MF: <http://purl.obolibrary.org/obo/GO_0003674>
        PREFIX CC: <http://purl.obolibrary.org/obo/GO_0005575>
            
		SELECT  ?name  			(GROUP_CONCAT(distinct ?organization;separator="` + separator + `") AS ?organizations) 
 	                       		(GROUP_CONCAT(distinct ?affiliationIRI;separator="` + separator + `") AS ?affiliationsIRI) 
                        		(GROUP_CONCAT(distinct ?affiliation;separator="` + separator + `") AS ?affiliations) 
								(GROUP_CONCAT(distinct ?gocam;separator="` + separator + `") as ?gocams)
								(GROUP_CONCAT(distinct ?date;separator="` + separator + `") as ?gocamsDate)
								(GROUP_CONCAT(distinct ?title;separator="` + separator + `") as ?gocamsTitle)
								(GROUP_CONCAT(distinct ?goid;separator="` + separator + `") as ?bpids)
								(GROUP_CONCAT(distinct ?goname;separator="` + separator + `") as ?bpnames)
								(GROUP_CONCAT(distinct ?gpid;separator="` + separator + `") as ?gpids)
								(GROUP_CONCAT(distinct ?gpname;separator="` + separator + `") as ?gpnames)
        WHERE 
        {
            BIND(` + modOrcid + ` as ?orcid) .
            #BIND("SynGO:SynGO-pim"^^xsd:string as ?orcid) .
            #BIND("http://orcid.org/0000-0001-7476-6306"^^xsd:string as ?orcid)
            #BIND("http://orcid.org/0000-0003-1074-8103"^^xsd:string as ?orcid) .
              
            BIND(IRI(?orcid) as ?orcidIRI) .
              
              
            # Getting some information on the model
            GRAPH ?gocam 
            {
                ?gocam 	metago:graphType metago:noctuaCam ;
                        dc:date ?date ;
                        dc:title ?title ;
                        dc:contributor ?orcid .
                
                ?entity rdf:type owl:NamedIndividual .
    			?entity rdf:type ?goid .
    
                ?s enabled_by: ?gpentity .    
				?gpentity rdf:type ?gpid .
		    	FILTER(?gpid != owl:NamedIndividual) .
  			}

              
            VALUES ?GO_class { BP: } . 
            # rdf:type faster then subClassOf+ but require filter 			
            # ?goid rdfs:subClassOf+ ?GO_class .
    		?entity rdf:type ?GO_class .
  			
  			# Filtering out the root BP, MF & CC terms
			filter(?goid != MF: )
  			filter(?goid != BP: )
		  	filter(?goid != CC: )
  
  			?goid rdfs:label ?goname .
              
            # Getting some information on the contributor
            optional { ?orcidIRI rdfs:label ?name } .
            BIND(IF(bound(?name), ?name, ?orcid) as ?name) .
            optional { ?orcidIRI vcard:organization-name ?organization } .
            optional { 
                ?orcidIRI has_affiliation: ?affiliationIRI .
                ?affiliationIRI rdfs:label ?affiliation
            } .
             
            # crash the query for SYNGO user "http://orcid.org/0000-0002-1190-4481"^^xsd:string  
            optional {
  			?gpid rdfs:label ?gpname .
            }
            BIND(IF(bound(?gpname), ?gpname, ?gpid) as ?gpname)
              
        }
		GROUP BY ?name
        `);
        return "?query=" + encoded;
    },


    /*  Get the list of Users.
        SYNGO: does require for now post-processing of the results with the SynGO user - mapping */
    UserList() {
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
            
        SELECT  ?orcid ?name    (GROUP_CONCAT(distinct ?organization;separator="` + separator + `") AS ?organizations) 
                                (GROUP_CONCAT(distinct ?affiliation;separator="` + separator + `") AS ?affiliations) 
                                (COUNT(distinct ?cam) AS ?gocams)
        WHERE 
        {
            ?cam metago:graphType metago:noctuaCam .
            ?cam dc:contributor ?orcid .
                    
            BIND( IRI(?orcid) AS ?orcidIRI ).
                    
            optional { ?orcidIRI rdfs:label ?name } .
            optional { ?orcidIRI <http://www.w3.org/2006/vcard/ns#organization-name> ?organization } .
            optional { ?orcidIRI has_affiliation: ?affiliation } .
              
            BIND(IF(bound(?name), ?name, ?orcid) as ?name) .            
        }
        GROUP BY ?orcid ?name 
        `);
        return "?query=" + encoded;
    },


    /* Get the GO-CAMs made by a User. Does work with SYNGO */
    UserModels(orcid) {
        var modOrcid = utils.getOrcid(orcid);
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX BP: <http://purl.obolibrary.org/obo/GO_0008150>
        PREFIX MF: <http://purl.obolibrary.org/obo/GO_0003674>
        PREFIX CC: <http://purl.obolibrary.org/obo/GO_0005575>
            
		SELECT  ?gocam ?date ?title	(GROUP_CONCAT(distinct ?spec;separator="` + separator + `") as ?species)
									(GROUP_CONCAT(distinct ?goid;separator="` + separator + `") as ?bpids)
									(GROUP_CONCAT(distinct ?goname;separator="` + separator + `") as ?bpnames)
									(GROUP_CONCAT(distinct ?gpid;separator="` + separator + `") as ?gpids)
									(GROUP_CONCAT(distinct ?gpname;separator="` + separator + `") as ?gpnames)
        WHERE 
        {
            #BIND("SynGO:SynGO-pim"^^xsd:string as ?orcid) .
            #BIND("http://orcid.org/0000-0001-7476-6306"^^xsd:string as ?orcid)
            #BIND("http://orcid.org/0000-0003-1074-8103"^^xsd:string as ?orcid) .
          	#BIND("http://orcid.org/0000-0001-5259-4945"^^xsd:string as ?orcid) .
              
            BIND(` + modOrcid + ` as ?orcid) .
            BIND(IRI(?orcid) as ?orcidIRI) .
                      
            # Getting some information on the model
            GRAPH ?gocam 
            {
                ?gocam 	metago:graphType metago:noctuaCam ;
                        dc:date ?date ;
                        dc:title ?title ;
                        dc:contributor ?orcid .
                
                ?entity rdf:type owl:NamedIndividual .
    			?entity rdf:type ?goid .
    
                ?s enabled_by: ?gpentity .    
				?gpentity rdf:type ?gpid .
		    	FILTER(?gpid != owl:NamedIndividual) .
  			}

              
            VALUES ?GO_class { BP: } . 
            # rdf:type faster then subClassOf+ but require filter 			
            # ?goid rdfs:subClassOf+ ?GO_class .
    		?entity rdf:type ?GO_class .
  			
  			# Filtering out the root BP, MF & CC terms
			filter(?goid != MF: )
  			filter(?goid != BP: )
		  	filter(?goid != CC: )
  
  			?goid rdfs:label ?goname .
              
            # Getting some information on the contributor
            optional { ?orcidIRI rdfs:label ?name } .
            BIND(IF(bound(?name), ?name, ?orcid) as ?name) .
            optional { ?orcidIRI vcard:organization-name ?organization } .
            optional { 
                ?orcidIRI has_affiliation: ?affiliationIRI .
                ?affiliationIRI rdfs:label ?affiliation
            } .
              
          
          	# Require each GP to have a correct URI, not the case for SYNGO at this time
          	optional {
  			?gpid rdfs:label ?gpname .
  
            ?gpid rdfs:subClassOf ?v0 . 
            ?v0 owl:onProperty <http://purl.obolibrary.org/obo/RO_0002162> . 
            ?v0 owl:someValuesFrom ?taxon .
                  
            ?taxon rdfs:label ?spec .  
            }
  
              
        }
		GROUP BY ?gocam ?date ?title
		ORDER BY DESC(?date)
        `);
        return "?query=" + encoded;
    },


    /* Return all the GPs used by a given contributor */
    UserGPs(orcid) {
        var modOrcid = utils.getOrcid(orcid);
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX has_affiliation: <http://purl.obolibrary.org/obo/ERO_0000066> 
        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX BP: <http://purl.obolibrary.org/obo/GO_0008150>
        PREFIX MF: <http://purl.obolibrary.org/obo/GO_0003674>
        PREFIX CC: <http://purl.obolibrary.org/obo/GO_0005575>
        PREFIX biomacromolecule: <http://purl.obolibrary.org/obo/CHEBI_33694>
           
        SELECT ?identifier ?name ?species (count(?name) as ?usages)         (GROUP_CONCAT(?cam;separator="` + separator + `") as ?gocams)
                                                                            (GROUP_CONCAT(?date;separator="` + separator + `") as ?dates)
                                                                            (GROUP_CONCAT(?title;separator="` + separator + `") as ?titles)
        WHERE 
        {
            #BIND("SynGO:SynGO-pim"^^xsd:string as ?orcid) .
            #BIND("http://orcid.org/0000-0001-7476-6306"^^xsd:string as ?orcid)
            #BIND("http://orcid.org/0000-0003-1074-8103"^^xsd:string as ?orcid) .
          	#BIND("http://orcid.org/0000-0001-5259-4945"^^xsd:string as ?orcid) .

            BIND(` + modOrcid + ` as ?orcid)      
            BIND(IRI(?orcid) as ?orcidIRI) .
                         
            # Getting some information on the model
            GRAPH ?cam {
                ?cam metago:graphType metago:noctuaCam .
                ?cam dc:contributor ?orcid .
                ?cam dc:title ?title .
                ?cam dc:date ?date .
                
                ?s enabled_by: ?id .
                ?id rdf:type ?identifier .
                FILTER(?identifier != owl:NamedIndividual) .  			
            }

            ?identifier rdfs:label ?name .

            ?identifier rdfs:subClassOf ?v0 . 
            ?v0 owl:onProperty <http://purl.obolibrary.org/obo/RO_0002162> . 
            ?v0 owl:someValuesFrom ?taxon .                  
            ?taxon rdfs:label ?species .                  

            
        }
        GROUP BY ?identifier ?name ?species
        ORDER BY DESC(?usages)
        `);
        return "?query=" + encoded;
    },



    UserModelList(userName) {
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
    	PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
        PREFIX providedBy: <http://purl.org/pav/providedBy>
  
        SELECT  ?gocam ?date ?title (GROUP_CONCAT(?orcid;separator="` + separator + `") AS ?orcids) 
                                    (GROUP_CONCAT(?name;separator="` + separator + `") AS ?names)
							        (GROUP_CONCAT(distinct ?providedBy;separator="` + separator + `") AS ?groupids) 
							        (GROUP_CONCAT(distinct ?providedByLabel;separator="` + separator + `") AS ?groupnames) 
        
        WHERE 
        {
  	    	{
    			BIND("` + userName + `" as ?userName) .
    			
              	GRAPH ?gocam {            
	                ?gocam metago:graphType metago:noctuaCam .
              
            	    ?gocam dc:title ?title ;
        	             dc:date ?date ;
            	         dc:contributor ?orcid ;
    		    		 providedBy: ?providedBy .
    
    	            BIND( IRI(?orcid) AS ?orcidIRI ).
	                BIND( IRI(?providedBy) AS ?providedByIRI ).
                }
             
          		optional {
        		  	?providedByIRI rdfs:label ?providedByLabel .
  		        }
    
                optional { 
      				?orcidIRI rdfs:label ?name 
    			}
        	  	BIND(IF(bound(?name), ?name, ?orcid) as ?name) .
			      	filter(?name = ?userName)
            }   
  
        }
        GROUP BY ?gocam ?date ?title 
        ORDER BY DESC(?date)
        `);
        return "?query=" + encoded;
    }

}