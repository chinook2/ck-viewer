/**
 * été
 */
Ext.define("ck.View", {
	extend: 'Ext.Container',
	
	requires: [
		// 'Ext.plugin.Viewport',
		// 'Ext.window.MessageBox',
		'ck.view.*',
		'ck.Map',
		'ck.Legend'
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
