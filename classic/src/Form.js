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
	],
	
	controller: "ckform",
	viewModel: {
		type: "ckform"
	},
	
	config: {
		/**
		 * True to init form in editing states
		 */
		editing: false,

		/**
		 * Layer name (can prefixed with context)
		 * @var {String}
		 */
		layer: null,
		
		/**
		 * Storage ID (can be equal to fid) : Unique identifier of the DB (usefull with persistencejs)
		 * @var {String}
		 */
		sid: null,
		
		/**
		 * Default form name
		 */
		defaultFormName: 'ck-default',
		
		/**
		 * The specific form name
		 * @var {String}
		 */
		formName: null,
		
		/**
		 * Form URL
		 * @var {String}
		 */
		formUrl: null,
		
		/**
		 * Inline form definition
		 * @var {String/Object}
		 */
		formRaw: null,
		
		/**
		 * 
		 */
		urlTemplate: {
			st: '{0}/forms/{1}.json',
			ws: '{0}/forms/{1}'
		},

		/** 
		 * Feature ID : recup depuis le geoJSON
		 * @var {String}
		 */
		dataFid: null,
		
		/** 
		 * Inline data
		 * @var {Object}
		 */
		dataRaw: null,
		
		/** 
		 * Object data
		 * @var {Object}
		 */
		dataObject: null,
		
		/** 
		 * Data object
		 * @var {Object}
		 */
		dataUrl : null,
		
		/** 
		 * Data object
		 * @var {Object}
		 */
		dataModel : null,
		
		/** 
		 * True if it's a subform
		 * @var {Object}
		 */
		isSubForm: false,
		
		/** 
		 * Try populate form after initautoLoad
		 */
		autoLoad: true
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
	
	getLayer: function() {
		return this.layer.split(":").pop();
	},
	
	cls: 'ckform',

	beforeClose: Ext.emptyFn
});
