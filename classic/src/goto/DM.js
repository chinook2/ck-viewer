/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.goto.DM", {
	extend: "Ext.form.FieldSet",
	alias: "widget.ckgoto-dm",
	
	controller: "ckgoto.dm",
	
	itemId: "goto-dm",
	
	layout: 'vbox',
	title: Ck.text('goto_dm_title'),
	defaultType: 'textfield',
	defaults: {
		flex: 1
	},
	items: [{
		label: Ck.text('goto_dm_easting')
	},{
		label: Ck.text('goto_dm_northing')
	}]
});
