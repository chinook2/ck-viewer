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
	
	items: [{
		fieldLabel: "Title",
		itemId: "title",
		name: "title"
	},{
		xtype: "combo",
		itemId: "resolution",
		fieldLabel: "Resolution",
		name: "resolution",
		displayField: "scale",
		valueField: "res",
		editable: false
	},{
		xtype: "combo",
		itemId: "printLayout",
		fieldLabel: "Layout",
		name: "printLayout",
		editable: false,
		store: ["default-layout"]
	},{
		xtype: "combo",
		itemId: "outputFormat",
		fieldLabel: "Output format",
		name: "outputFormat",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{outputformats}"
		}
	}/*,{
		xtype: "combo",
		itemId: "dpi",
		fieldLabel: "Dot Per Inch",
		name: "dpi",
		displayField: "dpi",
		valueField: "dpi",
		editable: false,
		bind: {
			"store": "{dpi}"
		}
	}*/,{
		xtype: "combo",
		itemId: "format",
		fieldLabel: "Format",
		name: "format",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{formats}"
		}
	},{
		xtype: "radiogroup",
		itemId: "orientation",
		fieldLabel: "Orientation",
		columns: 2,
		vertical: true,
		name: "orientation",
		items: [
			{boxLabel: "Portrait", name: "orientation", inputValue: "p"},
			{boxLabel: "Lanscape", name: "orientation", inputValue: "l"}
		]
	}],
	
	buttons: [{
		text: "Print",
		itemId: "print"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-print"
});
