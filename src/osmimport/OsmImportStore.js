/**
 * Store to access to the OSM API, import data 
 * and store imported data until integration is finished
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.OsmImportStore", {
	extend: "Ext.data.Store",
	alias: "store.osmimport",
	requires: ["Ck.osmimport.OsmImportModel"],
	model: "Ck.osmimport.OsmImportModel",
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
