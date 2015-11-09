Ext.define("Ck.osmimport.import.OsmImportStore", {
	extend: "Ext.data.Store",
	alias: "store.osmimport",
	requires: ["Ck.osmimport.import.OsmImportModel"],
	model: "Ck.osmimport.import.OsmImportModel",
	proxy: {
		type: "ajax",
		url: "http://overpass-api.de/api/interpreter",
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
