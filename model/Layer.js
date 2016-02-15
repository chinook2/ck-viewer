 Ext.define("Layer", {
	extend: "Ext.data.Model",
	fields: [
		{name: "Name", type: "string"},
		{name: "Title", type: "string"},
		{name: "Text", type: "string"},
		{name: "BoundingBox", type: "auto"},
		{name: "Group", type: "auto"},
		{name: "LatLonBoundingBox", type: "string"},
		{name: "SRS", type: "auto"},
		{name: "owsData", type: "auto"},
		{name: "owcLayer", type: "auto"}
	]
});