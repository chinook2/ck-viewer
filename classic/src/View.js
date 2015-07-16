/**
 * été
 */
Ext.define("Ck.View", {
	extend: 'Ext.Container',
	
	requires: [
		// 'Ext.plugin.Viewport',
		// 'Ext.window.MessageBox',
		'Ck.view.*',
		'Ck.Map',
		'Ck.Legend'
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
