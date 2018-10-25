var separator = require("../config").separator;

module.exports = {

    getPMIDModels(pmid) {
        var encoded = encodeURIComponent(`
    	PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX metago: <http://model.geneontology.org/>

		SELECT distinct ?gocam
        WHERE 
        {
	        GRAPH ?gocam {
    	        ?gocam metago:graphType metago:noctuaCam .    	
        	    ?s dc:source ?source .
            	BIND(REPLACE(?source, " ", "") AS ?source) .
	            FILTER((CONTAINS(?source, "` + pmid + `")))
    	    }           

        }
        `);
        return "?query=" + encoded;
    },

    PMIDModelList(pmid) {
        if(!pmid.startsWith("PMID:")) {
            pmid = "PMID:" + pmid;
        }
        var encoded = encodeURIComponent(`
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>
        PREFIX providedBy: <http://purl.org/pav/providedBy>
        
        SELECT  ?gocam ?date ?title (GROUP_CONCAT(distinct ?orcid;separator="` + separator + `") AS ?orcids) 
                                    (GROUP_CONCAT(distinct ?name;separator="` + separator + `") AS ?names)
                                    (GROUP_CONCAT(distinct ?providedBy;separator="` + separator + `") AS ?groupids) 
                                    (GROUP_CONCAT(distinct ?providedByLabel;separator="` + separator + `") AS ?groupnames) 
        
        WHERE 
        {
          GRAPH ?gocam {            
            ?gocam metago:graphType metago:noctuaCam .
        
            ?gocam dc:title ?title ;
                   dc:date ?date ;
                   dc:contributor ?orcid ;
                   providedBy: ?providedBy .
        
            BIND( IRI(?orcid) AS ?orcidIRI ).
            BIND( IRI(?providedBy) AS ?providedByIRI ).
            
            ?s dc:source ?source .
            BIND(REPLACE(?source, " ", "") AS ?source) .
            FILTER(SAMETERM(?source, "` + pmid + `"^^xsd:string))
          }
          
          optional {
            ?providedByIRI rdfs:label ?providedByLabel .
          }
        
          optional { 
            ?orcidIRI rdfs:label ?name 
          }
          BIND(IF(bound(?name), ?name, ?orcid) as ?name) .
        
        }
        GROUP BY ?gocam ?date ?title 
        ORDER BY DESC(?date)
        `);
        return "?query=" + encoded;
    }
    
}