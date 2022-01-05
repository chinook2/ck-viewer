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
		fieldLabel: Ck.text('print_title'),
		editable: true
	},{
		itemId: "resolution",
		name: "resolution",
		fieldLabel: Ck.text('print_resolution'),
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
		fieldLabel: Ck.text('print_layout'),
		displayField: "label",
		valueField: "id",
		bind: {
			store: "{layouts}",
			value: "{printParam.layout}"
		}
	},{
		itemId: "outputFormat",
		name: "outputFormat",
		fieldLabel: Ck.text('print_output_format'),
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
		fieldLabel: Ck.text('print_format'),
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
		fieldLabel: Ck.text('print_orientation'),
		columns: 2,
		vertical: true,
		items: [
			{boxLabel: Ck.text('print_orientation_portrait'), name: "orientation", inputValue: "p"},
			{boxLabel: Ck.text('print_orientation_landscape'), name: "orientation", inputValue: "l"}
		],
		bind: { value: "{printParam.orientation}" }
	}],

	buttons: [{
		text: Ck.text('print_print'),
		handler: "beforePrint",
		scale : 'medium',
		cls : 'i-primary-btn i-upper-btn'
	},{
		text: Ck.text('print_cancel'),
		handler: "cancel",
		scale : 'medium',
		cls : 'i-upper-btn'
	}],

	cls: "ckprint"
});
