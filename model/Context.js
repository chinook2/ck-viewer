 Ext.define("Context", {
	extend: "Ext.data.Model",
	fields: [
		{name: "Name", type: "string"},
		{name: "Title", type: "string"},
		{name: "Text", type: "string"},
		{name: "SRS", type: "string"},
		{name: "BoundingBox", type: "auto"}
	]
});