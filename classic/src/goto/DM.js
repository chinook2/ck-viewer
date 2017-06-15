/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.goto.DM", {
	extend: "Ext.form.FieldSet",
	alias: "widget.ckgoto-dm",
	
	controller: "ckgoto.dm",
	
	itemId: "goto-dm",
	
	layout: 'vbox',
	title: 'Coordinates (DM)',
	defaultType: 'textfield',
	defaults: {
		flex: 1
	},
	items: [{
		label: "Longitude (X)"
	},{
		label: "Latitude (Y)"
	}]
});
