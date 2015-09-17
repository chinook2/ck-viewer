/**
 *
 */

Ext.define("Ck.Import", {
	extend: "Ext.form.Panel",
	alias: "widget.ckimport",
	
	requires: [
		"Ck.import.*"
	],

	controller: "ckimport",
	
	viewModel: {
		type: "ckimport"
	},
	
	config: {
		bodyPadding: 10,
		defaultType: "combo",
		defaults: {
			width: "100%"
		}
	},
	
	items: [{
		itemId: "format",
		fieldLabel: "Format",
		name: "format",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{format}"
		}
	},{
		xtype: "filefield",
		itemId: "file",
		fieldLabel: "File",
		name: "file",
		editable: false
	},{
		xtype: "combo",
		itemId: "projection",
		fieldLabel: "Projection",
		name: "projection",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{projection}"
		}
	}],
	
	buttons: [{
		text: "Import",
		itemId: "import"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-import"
});
