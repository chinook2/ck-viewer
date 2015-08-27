/**
 *
 */

Ext.define("Ck.Print", {
	extend: "Ext.form.Panel",
	alias: "widget.ckprint",
	
	requires: [
		'Ck.print.*'
	],

	controller: "ckprint",
	
	viewModel: {
		type: "ckprint",
	},
	
	config: {
		bodyPadding: 10,
		defaultType: "textfield"		
	},
	
	items: [{
		fieldLabel: 'Title',
		name: 'title'
	}],
	
	buttons: [{
		text: "Print",
		itemId: "print"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: 'ck-print'
});
