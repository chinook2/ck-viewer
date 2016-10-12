/**
 *
 */
Ext.define("Ck.AddLayer", {
	extend: "Ext.tab.Panel",
	alias: "widget.ckaddlayer",
	
	requires: [
		"Ck.addlayer.*"
	],
	
	controller: "ckaddlayer",
	
	layout: {
		type: "fit"
	},
	
	config: {
		bodyPadding: 10,
		defaults: {
			width: "100%"
		}
	},
	
	activeTab: 1,
	
	items: [{
		xtype: "ckaddlayer-wfs",
		hidden: true,
		scope: this,
		listeners: {
			itemclick: "addLayer"
		}
	},{
		xtype: "ckaddlayer-wms",
		scope: this,
		listeners: {
			itemclick: "addLayer"
		}
	},{
		xtype: "ckimportvector",
		bbar: ["->", {
			text: "Import",
			itemId: "import",
			handler: "startImport"
		}]
	}]
});
