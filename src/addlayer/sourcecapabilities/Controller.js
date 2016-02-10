/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.sourcecapabilities.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.sourcecapabilities',

	config: {
		container: null,

		/**
		 * True to allow addition of several layers in same time
		 */
		allowFolderAdding: false
	},

	/**
	 * @event layeradded
	 * Fires when a feature was created
	 * @param {ol.Feature}
	 */

	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);

		var container = view.up("panel");
		this.setContainer(container);

		view.on("itemclick", this.onNodeClick, this);

		// Initialisation du TreeLoader
		view.setStore(Ck.create("Ck.CapabilitiesTreeStore", {service: container.source.toUpperCase()}));

	},

	/**
	 * On treeNode click
	 * @param {Ext.tree.View}
	 * @param {Ext.data.Model}
	 */
	onNodeClick: function(tree, node) {
		if(!node.data.leaf) {
			if(this.getAllowFolderAdding()) {
				for(var i = 0; i < node.childNodes.length; i++) {
					this.onNodeClick(tree, node.childNodes[i]);
				}
			}
		} else {
			this.getContainer().getController().addLayer(node.data);
		}
	},

	/**
	 * Launch the getCapabilities request
	 * @param {Ext.data.Model}
	 */
	loadCapabilities: function(ds) {
		this.source = ds;
		this.reload();
	},

	reload: function() {
		this.getView().getStore().load({
			url: this.getFullUrl(this.source.url) + "service=wms&request=getCapabilities"
		});
	}
});
