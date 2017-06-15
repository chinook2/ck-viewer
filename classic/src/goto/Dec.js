/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.goto.Dec", {
	extend: "Ext.form.FieldSet",
	alias: "widget.ckgoto-dec",
	
	controller: "ckgoto.dec",
	
	itemId: "goto-dec",
	
	width: "100%",
	layout: 'vbox',
	title: 'Coordinates (Dec)',
	defaults: {
		regex: new RegExp('[0-9]{1,15}[.,]?[0-9]{0,10}'),
		width: "100%"
	},
	items: [{
		xtype: "panel",
		layout: "hbox",
		itemId: "xPanel",
		defaults: {
			margin: "0 0 5 0",
			height: 25,
			style: "line-height: 25px"
		},
		items: [{
			xtype: "label",
			html: "Longitude (X)",
			width: 85
		},{
			xtype: 'textfield',
			fieldStyle: 'text-align: right;',
			itemId: "x",
			flex: 1
		},{
			xtype: "label",
			itemId: "xUnit",
			html: "&nbsp;&nbsp;m"
		}]
	},{
		xtype: "panel",
		layout: "hbox",
		itemId: "yPanel",
		defaults: {
			margin: "0 0 5 0",
			height: 25,
			style: "line-height: 25px"
		},
		items: [{
			xtype: "label",
			html: "Latitude (Y)",
			width: 85
		},{
			xtype: 'textfield',
			fieldStyle: 'text-align: right;',
			itemId: "y",
			flex: 1
		},{
			xtype: "label",
			itemId: "yUnit",
			html: "&nbsp;&nbsp;m"
		}]
	}]
});
