var separator = require("../config").separator;

module.exports = {

    getAllGPsModels() {
        var encoded = encodeURIComponent(`
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX metago: <http://model.geneontology.org/>
        
        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        PREFIX in_taxon: <http://purl.obolibrary.org/obo/RO_0002162>
        
        SELECT ?identifier	(GROUP_CONCAT(distinct ?gocam;separator=",") as ?gocams)
        
        WHERE 
        {
        
          GRAPH ?gocam {
            ?gocam metago:graphType metago:noctuaCam .    
            ?s enabled_by: ?gpnode .    
            ?gpnode rdf:type ?identifier .
            FILTER(?identifier != owl:NamedIndividual) .         
          }
          
        }
        GROUP BY ?identifier        
        `);
        return "?query=" + encoded;
    },

    getGPModels(id) {
        var encoded = encodeURIComponent(`
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX metago: <http://model.geneontology.org/>
        
        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        
        SELECT distinct ?gocam
        
        WHERE 
        {
        
          GRAPH ?gocam {
            ?gocam metago:graphType metago:noctuaCam .    
            ?s enabled_by: ?gpnode .    
            ?gpnode rdf:type ?identifier .
            FILTER(?identifier = <` + id + `>) .         
          }
          
        }
        `);
        return "?query=" + encoded;
    }


}
