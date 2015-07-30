/**
 * 
 */
Ext.define("Ck.View", {
	extend: 'Ext.Container',
	
	requires: [
		// require in production
        'Ext.plugin.Viewport',
        'Ext.window.MessageBox',
        
		'Ext.layout.*',
        'Ext.form.*',
        'Ext.tab.*',
        'Ext.grid.*',
		
		'Ck.*' // Load all Ck class...
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
