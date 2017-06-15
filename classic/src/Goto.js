/**
 *
 */
Ext.define("Ck.Goto", {
	extend: "Ext.form.Panel",
	alias: "widget.ckgoto",
	
	requires: [
		"Ck.goto.*",
		"Ck.store.Projection"
	],
	
	controller: "ckgoto",
	
	config: {
		bodyPadding: 10,
		defaults: {
			width: "100%"
		}
	},
	
	listeners: {
		afterrender: "render"
	},
	
	items: [{
		xtype: "combobox",
		itemId: "projection",
		name: "projection",
		displayField: 'label',
		valueField: 'code',
		store: "ckProjection",
		allowBlank: false,
		editable: false,
		scope: this,
		listeners: {
			change: "projChange"
		}
	},{
		xtype  : 'fieldcontainer',
		fieldLabel: 'Unit ',
		hidden: true,
		itemId: "units",
		defaultType: 'radiofield',
		defaults: {
			name: "unit",
			flex: 1,
			listeners: {
				change: "unitChange"
			}
		},
		layout: 'hbox',
		items: [{
			boxLabel: 'Dec',
			itemId: "units-dec",
			inputValue: 'dec',
			value: true
		}, {
			boxLabel: 'DM',
			itemId: "units-dm",
			inputValue: 'dm'
		}, {
			boxLabel: 'DMS',
			itemId: "units-dms",
			inputValue: 'dms'
		}]
	},{
		xtype: 'ckgoto-dec'
	},{
		xtype: 'ckgoto-dm',
		hidden: true
	},{
		xtype: 'ckgoto-dms',
		hidden: true
	}],
	bbar: ["->",{
		text: "Clear marker",
		handler: "clearMarker"
	},{
		text: "Go to position",
		handler: "goTo"
	}]
}); 
