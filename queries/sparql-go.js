var separator = require("../config").separator;

module.exports = {

    getHierarchy(go) {
        go = go.replace(":", "_");
        var encoded = encodeURIComponent(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX definition: <http://purl.obolibrary.org/obo/IAO_0000115>

        SELECT ?hierarchy ?GO ?label WHERE {
    		BIND(<http://purl.obolibrary.org/obo/` + go + `> as ?goquery)
  	    	{
  		        {
                  ?goquery rdfs:subClassOf+ ?GO .
  	        	  ?GO rdfs:label ?label .
	              FILTER (LANG(?label) != "en")    
        	      BIND("parent" as ?hierarchy)
            	}
	        	UNION
        		{
                  ?GO rdfs:subClassOf* ?goquery .
  		          ?GO rdfs:label ?label .    		
        	      FILTER (LANG(?label) != "en")    
 	              BIND(IF(?goquery = ?GO, "query", "child") as ?hierarchy) .
        		}
  	        }
    	}
        `);
        return "?query=" + encoded;
    }

}