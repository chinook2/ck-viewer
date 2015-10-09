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

		fid: null
	},

	formulas: {
	}
	
});