/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer',

	config: {
		openner: null,
		source: null
	},

	/**
	 * @protected
	 */
	init: function(view) {

		this.callParent([view]);

		this.selector = view.down("#sourceselector");
		this.capabilities = view.down("#sourcecapabilities");
		this.capabilitiesCtrl = this.capabilities.getController();

		this.selector.on("select", this.loadCapabilities, this);
	},

	/**
	 * Launch the loading of capabilities
	 */
	loadCapabilities: function(cbx, rcd) {
		this.capabilitiesCtrl.loadCapabilities(rcd);
	}
});
