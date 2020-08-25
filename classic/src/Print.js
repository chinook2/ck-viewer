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
		}
	},{
		itemId: "printLayout",
		name: "printLayout",
		fieldLabel: "Layout",
		displayField: "label",
		valueField: "id",
		bind: {
			store: "{layouts}",
			value: "{printParam.layout}"
		}
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
	}/*,{
		itemId: "dpi",
		name: "dpi",
		fieldLabel: "Dot Per Inch",
		displayField: "dpi",
		valueField: "dpi",
		bind: { "store": "{dpi}" }
	}*/,{
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
	}],

	buttons: [{
		text: "Print",
		handler: "beforePrint"
	},{
		text: "Cancel",
		handler: "cancel"
	}],

	cls: "ckprint"
});
