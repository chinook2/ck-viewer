/**
 * Used by AddLayer component
 */
Ext.define("DataSource", {
	extend: "Ext.data.Model",
	fields: [
		{name: "name", type: "string"},
		{name: "title", type: "string"},
		{name: "url", type: "string"},
		{name: "service", type: "string"},
		{name: "format", type: "string"}
	]
});