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
		/**
		 * True to insert the layer at first in legend
		 */
		insertFirst: false,
		
		/**
		 * wmc, wms or wfs
		 */
		service: "wmc",
		
		/**
		 * False to add layer without its group in the legend
		 */
		keepStructure: true
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
