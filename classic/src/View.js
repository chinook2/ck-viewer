/**
 * été
 */
Ext.define("Ck.View", {
	extend: 'Ext.Container',
	
	requires: [
		'Ck.view.*'
	],
	
	controller: 'ckview',
	
	viewModel: {
		type: 'ckview'
	},
	
	layout: {
		type: 'fit'
	},
	
	config: {
		name: 'default'
	},
	
	cls: 'ck-view'
});
