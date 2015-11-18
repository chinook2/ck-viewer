/**
 * ViewController used to manage the Integration Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.integration.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportintegration',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		/**
         * Init Constants
		 */
		
	
		/**
		 * Init the controls from View.
		 */
		this.control({
			"ckosmimportintegration button#cancel": {
				click: this.cancel
			}
		});
	},
		
	/**
	 * Hide the integration panel
	 */
	cancel: function() {
		this.getView().openner.close();
	}
});
