/**
 * 
 */
Ext.define("Ck.Form",{
	extend: "Ext.form.Panel",
	alias: "widget.ckform",
	
	requires: [
		'Ext.layout.*',
		'Ext.form.*',
		'Ext.tab.*',
		'Ext.grid.*',
		'Ck.form.*'
		//'Ext.ux.printer.*',
	],
	
	controller: "ckform",
	viewModel: {
		type: "ckform"
	},
	
	config: {
		fieldset: false,
		editing: false,
		processing: true,
		
		layer: null,	// nom du layer = nom de la table
		sid: null,		// Storage ID (peut être = au fid) : Identifiant unique de la base (utile avec persistencejs)

		defaultFormName: 'ck-default',
		formName: null,	// nom du formulaire
		formUrl: null,	// URL du formulaire
		formRaw: null, // definition du formulaire inline
		
		urlTemplate: {
			st: '{0}/forms/{1}.json',
			ws: '{0}/forms/{1}'
		},

		dataFid: null,		// Feature ID : recup depuis le geoJSON
		dataRaw: null,		// Données inline
		dataUrl : null, //
		dataModel : null,
		// dataStore : null,
		
		isSubForm: false,
		parentForm: null, // refrence the parent form view for subForms
		autoLoad: true		// Try populate form after initautoLoad
	},

	bodyPadding: 10,
	scrollable: true,
	
	dockedItems: [{
		xtype: 'toolbar',
		dock: 'bottom',
		ui: 'footer',
		defaults: {minWidth: 120},
		hidden: true,
		items: [{
			xtype: "button",
			text: "Edit",
			handler: 'formEdit',
			bind: {
				hidden: "{!isEditable}"
			}
		},{
			xtype: "button",
			text: "Save",
			handler: 'formSave',
			bind: {
				hidden: "{!editing}"
			}
		},{
			xtype: "button",
			text: "Cancel",
			handler: 'formCancel',
			bind: {
				hidden: "{!editing}"
			}
		},'->',{
			xtype: "button",
			text: "Print",
			handler: 'formPrint',
			bind: {
				hidden: "{!isPrintable}"
			}
		},{
			xtype: "button",
			text: "Close",
			handler: 'formClose'
		}]
	}],
	
	cls: 'ckform',

	beforeClose: Ext.emptyFn
});
