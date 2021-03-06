/**
 *
 */

Ext.define("Ck.Overview", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckoverview",
	
	requires: [
		'Ck.overview.*'
	],

	controller: "ckoverview",
	
	config: {
		ovHeight: 200,
		ovWidth: 200,
		bodyPadding: 0,
		replaceEverytime: false,
		nbRes: 1
	},

	cls: 'ck-overview'
});