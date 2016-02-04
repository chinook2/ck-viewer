/**
 *
 */

Ext.define("Ck.AddLayer", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckaddlayer",

	requires: [
		"Ck.addlayer.*"
	],

	controller: "ckaddlayer",

	config: {
		layout: "border",
		source: null
	},

	items: [{
		xtype	: "ckaddlayer-sourceselector",
		itemId	: "sourceselector",
		region	: "north",
		listConfig	: {
			emptyText	: "No source available"
		}
	},{
		xtype	: "ckaddlayer-sourcecapabilities",
		itemId	: "sourcecapabilities",
		region	: "center"
	}]
});
