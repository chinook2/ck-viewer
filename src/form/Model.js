/**
 * 
 */
Ext.define('Ck.form.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckform',

	data: {
		isEditable: true,
		isPrintable: false,
		editing: false,

		processing: true,
		processingForm: true,
		processingData: true,
		
		fid: null
	},

	formulas: {
	}
	
});