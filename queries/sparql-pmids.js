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
    }
    
}