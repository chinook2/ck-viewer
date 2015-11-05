/**
 * 
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.control({
			"ckosmimportimport button#cancel": {
				click: this.cancel
			}
		});
		
	},
		
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		console.log(this.getView());
		this.getView().openner.close();
	}
});
