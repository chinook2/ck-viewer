/**
 *
 */

Ext.define("Ck.osmimport.Import", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportimport",
	
	requires: [
		"Ck.osmimport.import.*"
	],

	controller: "ckosmimportimport",
	
	viewModel: {
		type: "ckosmimportimport"
	},
	items: [{
		bind: {
			html: '<p>Mon Test {foo}</p>'
		}
	}],
	
	buttons: [{
		text: "Import",
		itemId: "import"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-import"
});
