/**
 * 
 */
Ext.define("Ck.View", {
	extend: 'Ext.Container',
	alias: "widget.ckview",
	
	requires: [
		// require in production
        'Ext.plugin.Viewport',
        'Ext.window.*',
        'Ext.data.reader.*',
		'Ext.layout.*',
        'Ext.form.*',
        'Ext.tab.*',
        'Ext.grid.*',
		
		'Ck.*' // Load all Ck class...
	],
	plugins: 'viewport',
	
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
