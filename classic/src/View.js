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
		name: 'ck-default',

		urlTemplate: {
			st: '{0}/ui/{1}.json',
			ws: '{0}/ui/{1}'
		}
	},
	
	cls: 'ck-view'
});
