/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer',
	
	addlayerPanelVisible: true,
	
	config: {
	},
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);
	}
});
