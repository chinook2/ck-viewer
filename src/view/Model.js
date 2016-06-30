/**
 * 
 */
Ext.define('Ck.view.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckview',

	data: {
		name: Ext.manifest.name,
		version: Ext.manifest.version
	}

	//TODO - add data, formulas and/or methods to support your view
});