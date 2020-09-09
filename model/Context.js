 Ext.define("Context", {
	extend: "Ext.data.Model",
	fields: [
		{name: "Name", type: "string"},
		{name: "Title", type: "string"},
		{name: "Text", type: "string"},
		{name: "private", type: "boolean"},
		{name: "SRS", type: "string"},
		{name: "BoundingBox", type: "auto"},

		{name: "combined", type: "string", calculate: function (data) {
			var res = data.Title;
			if (data['private'] === true) {
				res = "1_" + data.Title;
			} else {
				res = "0_" + data.Title;
			}
			return res;
		}} 
	]
});