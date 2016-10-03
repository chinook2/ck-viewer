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
	
	config: {
		bodyPadding: 10,
		defaultType: "combo",
		defaults: {
			width: "100%"
		}
	},
	
	items: [{
		xtype: "ckaddlayer-wfs"
	}]
});
