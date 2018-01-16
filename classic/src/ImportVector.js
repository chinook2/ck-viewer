/**
 *
 */

Ext.define("Ck.ImportVector", {
	extend: "Ext.form.Panel",
	alias: "widget.ckimportvector",

	title: "File",

	requires: [
		"Ck.importvector.*"
	],

	controller: "ckimportvector",

	viewModel: {
		type: "ckimportvector"
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
		},
		listeners: {
			change: "paramChange"
		}
	},{
		xtype: "filefield",
		itemId: "file",
		fieldLabel: "File",
		name: "file",
		editable: false,
		listeners: {
			change: "paramChange"
		}
	},{
		xtype: "combo",
		itemId: "projection",
		fieldLabel: "Projection",
		name: "projection",
		displayField: "label",
		valueField: "id",
		editable: false,
		store: "ckProjection",
		listeners: {
			change: "paramChange"
		}
	}],

	bbar: [{
		text: "Import",
		itemId: "import",
		handler: "startImport"
	},{
		text: "Cancel",
		itemId: "cancel",
		handler: "cancel"
	}],

	cls: "ck-import"
});
