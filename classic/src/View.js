/**
 *
 */
 //<debug>
 // Mini hack to load Ck.js main static class in dev mode
 // Ext.manifest.paths doesn't in production and testing !!
 if(Ext.manifest.paths) Ext.Loader.loadScriptsSync([Ext.manifest.paths.Ck + "/Ck.js"]);
 //</debug>
Ext.define("Ck.View", {
	extend: 'Ext.Container',
	alias: "widget.ckview",

	requires: [
		// require in production
        'Ext.plugin.Viewport',
        'Ext.window.*',

		'Ext.layout.*',
        'Ext.form.*',
        'Ext.tab.*',
        'Ext.grid.*',
		'Ext.util.*',

        'Ck.Notify',

        'Ck.Map',
        'Ck.Legend',
        'Ck.Toolbar',
        'Ck.Form',
        'Ck.Edit',
        'Ck.Overview',
        'Ck.Selection',
        'Ck.Result',
        'Ck.Print',
        'Ck.Pdf',
        'Ck.PdfViewer',
        'Ck.view.*'
	],
	//plugins: 'viewport',

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
