/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
/**
 * Used by AddLayer component
 */
Ext.define("DataSource", {
	extend: "Ext.data.Model",
	fields: [
		{name: "name", type: "string"},
		{name: "title", type: "string"},
		{name: "url", type: "string"},
		{name: "type", type: "string"}
	]
});
Ext.define('Ck.addlayer.sourceselector.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.sourceselector',

	config: {
		/**
		 * Add layer view
		 */
		container: null,

		/**
		 * One of "wms", "wfs", "chinook" to display
		 */
		source: null,
		
		/**
		 * Configuration of this datasource selector
		 */
		 conf: {}
	},

	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent([view]);

		var container = view.up("panel");
		var source = container.getSource();

		this.store = Ck.create("Ext.data.Store", {
			model: "DataSource"
		});

		this.setContainer(container);
		this.setSource(source);

		switch(source) {
			case "chinook":
				Cks.get({
					url: "resources/conf/addlayer.json",
					scope: this,
					success: function(response){
						var conf = Ext.decode(response.responseText).chinook;
						if(Ext.isString(conf)) {
							conf = {url: conf};
						}
						this.setConf(conf);
						this.initStore(conf);
					},
					failure: function(response, opts) {
						Ck.error('Error when loading AddLayer configuration');
					}
				});
				break;
			case "wms":
				break;
			case "wfs":
				break;
		}
	},

	initStore: function(conf) {
		if(Ext.isEmpty(conf)) {
			conf = this.getConf();
		}
		
		switch(this.getSource()) {
			case "chinook":
				if(conf.context === true) {
					// TODO wmc getCapabilities
				} else {
					this.store.add({
						name: "repository",
						title: "Repository",
						url: conf.url,
						type: "chinook"
					});
					this.getView().setVisible(false);
				}
				
				// Select the first item to load the capabilities directly
				if(this.getView().rendered) {
					this.selectFirst();
				} else {
					this.getView().on("render", this.selectFirst, this);
				}
				break;
			case "wms":
				break;
			case "wfs":
				break;
		}
	},

	/**
	 * Select the first source / context
	 */
	selectFirst: function() {
		this.getView().fireEvent("select", this, this.store.getAt(0).data);
	}
});
