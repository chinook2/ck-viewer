/**
 *
 */

Ext.define("Ck.Print", {
	extend: "Ext.form.Panel",
	alias: "widget.ckprint",

	requires: [
		"Ck.print.*"
	],

	controller: "ckprint",

	viewModel: {
		type: "ckprint"
	},

	config: {
		bodyPadding: 10,
		defaultType: "textfield",
		defaults: {
			width: "100%"
		}
	},
	
	listeners: { render: "displayPreview" },
	fieldDefaults: {
        labelWidth: 80,
        anchor: '100%'
    },
	defaults: {
		editable: false,
		xtype: "combo",
		queryMode: "local"
	},
    layout: {
        type: 'vbox',
        align: 'stretch'  // Child items are stretched to full width
	},
	/**
	 * itemId needed for field getCmp, name needed for getValues
	 */
	items: [{
		itemId: "title",
		name: "title",
		xtype: "textfield",
		fieldLabel: "Title...",
		editable: true
	},{
		itemId: "resolution",
		name: "resolution",
		fieldLabel: "Resolution",
		displayField: "scale",
		valueField: "res",
		anchor: '0',
		bind: {
			store: "{resolutions}",
			value: "{printParam.resolution}"
		},
		hidden: true
	},{
		itemId: "angle",
		name: "angle",
		fieldLabel: "Angle",
		displayField: "angle",
		valueField: "angle",
		value: "0",
		hidden: true
	},{
		itemId: "printLayout",
		name: "printLayout",
		fieldLabel: "Layout",
		displayField: "label",
		valueField: "id",
		bind: {
			store: "{layouts}",
			value: "{printParam.layout}"
		},
		hidden: true
	},{
		itemId: "outputFormat",
		name: "outputFormat",
		fieldLabel: "Output format",
		displayField: "label",
		valueField: "id",
		bind: {
			store: "{outputFormats}",
			value: "{printParam.outputFormat}"
		}
	},{
		itemId: "dpi",
		name: "dpi",
		fieldLabel: "Dot Per Inch",
		displayField: "dpi",
		valueField: "id",
		bind: { 
			store: "{dpis}",
			value: "{printParam.dpi}"
		},
		hidden: true
	},{
		itemId: "format",
		name: "format",
		fieldLabel: "Format",
		displayField: "label",
		valueField: "id",
		bind: {
			store: "{formats}",
			value: "{printParam.format}"
		}
	},{
		xtype: "radiogroup",
		name: "shape",
		itemId: "shape",
		fieldLabel: "Forme",
		columns: 2,
		vertical: true,
		items: [
			{boxLabel: "Rectangle", name: "shape", inputValue: "r"},
			{boxLabel: "Carré", name: "shape", inputValue: "c"},
		],
		bind: { value: "{printParam.shape}" }
	},{
		xtype: "radiogroup",
		name: "orientation",
		itemId: "orientation",
		fieldLabel: "Orientation",
		columns: 2,
		vertical: true,
		items: [
			{boxLabel: "Portrait", name: "orientation", inputValue: "p"},
			{boxLabel: "Landscape", name: "orientation", inputValue: "l"}
		],
		bind: { value: "{printParam.orientation}" }
	}/* ,{
        xtype: 'slider',
        name: 'rotate',
		itemId: "rotate",
        fieldLabel: 'Tourner la carte',
		value: 0,
		increment: 1,
        maxValue: 180,
		minValue: -180,
		bind: { value: "{printParam.angle}" }
    } */],

	buttons: [{
		text: "Print",
		handler: "beforePrint"
	},{
		text: "Cancel",
		handler: "cancel"
	}],

	cls: "ckprint"
});
