/**
 * Store to access to the OSM API.
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.import.OsmImportStore", {
	extend: "Ext.data.Store",
	alias: "store.osmimport",
	requires: ["Ck.osmimport.import.OsmImportModel"],
	model: "Ck.osmimport.import.OsmImportModel",
	proxy: {
		type: "ajax",
		url: "http://overpass-api.de/api/interpreter",
		actionMethods : {
			read    : 'POST'
		},
		limitParam: false,
		pageParam: false,
		startParam: false,
		noCache: false,
		reader: {
			type: "json",
			rootProperty: "elements"
		}
	}
});
