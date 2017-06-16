/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.goto.DMS", {
	extend: "Ext.form.FieldSet",
	alias: "widget.ckgoto-dms",
	
	controller: "ckgoto.dms",
	
	itemId: "goto-dms",
	
	layout: 'vbox',
	title: 'Coordinates (DMS)',
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