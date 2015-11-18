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
		this.openner = this.getView().openner;

		/**
         * Init Constants
		 */
		
		
	
		/**
		 * Init the controls from View.
		 */
		this.control({
			"ckosmimportintegration button#cancel": {
				click: this.onCancelClick
			},
			"ckosmimportintegration button#integrationfinished": {
				click: this.onIntegrationFinishedClick
			}
		});
	},
		
	/**
	 * Hide the integration panel
	 */
	onCancelClick: function() {
		this.openner.close();
	},
	
	/**
	 * Indicate to the tool that the user has finished the integration of data.
	 */
	onIntegrationFinishedClick: function() {
		this.openner.finishIntegration();
		this.openner.close();
	}
});
