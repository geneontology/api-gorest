
var separator = require("../config").separator;

module.exports = {

    correctTaxon(taxon) {
        if(!taxon.startsWith("NCBITaxon_")) {
            taxon = "NCBITaxon_" + taxon;
        }

        if(!taxon.startsWith("http://")) {
            taxon = "http://purl.obolibrary.org/obo/" + taxon;
        }
//        console.log("using: ", taxon);
        return "<" + taxon + ">"
    },

    getSpeciesModels(taxon) {
//        console.log("getSpecies(" , taxon , ")");
        var correctedTaxon = this.correctTaxon(taxon);
        var encoded = encodeURIComponent(`
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX metago: <http://model.geneontology.org/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>

        PREFIX enabled_by: <http://purl.obolibrary.org/obo/RO_0002333>
        PREFIX in_taxon: <http://purl.obolibrary.org/obo/RO_0002162>

        SELECT distinct ?gocam

        WHERE 
        {
            GRAPH ?gocam {
                ?gocam metago:graphType metago:noctuaCam .
                ?s enabled_by: ?gpnode .    
                ?gpnode rdf:type ?identifier .
                FILTER(?identifier != owl:NamedIndividual) .         
            }

            ?identifier rdfs:subClassOf ?v0 . 
            ?identifier rdfs:label ?name .
            
            ?v0 owl:onProperty in_taxon: . 
            ?v0 owl:someValuesFrom ` + correctedTaxon + `
        }
        `);
//        console.log(decodeURI(encoded));
        return "?query=" + encoded;
    }
}
