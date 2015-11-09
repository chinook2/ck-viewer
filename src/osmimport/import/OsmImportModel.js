Ext.define('Ck.osmimport.import.OsmImportModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: "type", type: "string",},
		{name: "id", type: "int"},
		{name: "lat", type: "number"},
		{name: "lon", type: "number"},
		{name: "tags"},
		{name: "nodes", reference: "OsmImportModel"},
		{name: "geometry"},
		{name: "coords"},
		{name: "properties"}
	],
	idProperty: 'id'
});
