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
		allowFolderAdding: false,
		
		/**
		 * Request parameters
		 */
		request: "getCapabilities",
		
		service: "wms"
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
		this.callParent(arguments);

		var container = view.up("panel");
		this.setContainer(container);

		view.on("itemclick", this.onNodeClick, this);

		this.setService(container.service);
		this.setRequest((container.service == "wmc")? "getContext" : "getCapabilities");
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
	 * Launch the request
	 * @param {DataSource}
	 */
	loadCapabilities: function(ds) {
		// Initialisation du TreeLoader
		this.getView().setStore(Ck.create("Ck.CapabilitiesTreeStore", {
			root: this.getView().getRootNode(),
			service: ds.service.toUpperCase(),
			request: this.getRequest(),
			format: ds.format
		}));
		
		this.source = ds;
		this.reload();
	},

	reload: function() {
		this.getView().getStore().load({
			url: this.getFullUrl(this.source.url) + "&service=" + this.getService().toUpperCase() + "&request=" + this.getRequest() + "&format=" + this.source.format.toLowerCase()
			// ,
			// params: {
				// SERVICE: this.getService().toUpperCase(),
				// REQUEST: this.getRequest(),
				// FORMAT: this.source.format.toLowerCase()
			// }
		});
	}
});
