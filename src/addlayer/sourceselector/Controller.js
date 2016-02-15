/**
 * Controller of the edit panel. An edit panel consists of :
 *
 * - Edit action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.sourceselector.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.sourceselector',

	requires: [
		'DataSource'
	],
	
	config: {
		/**
		 * Add layer view
		 */
		container: null,

		/**
		 * One of "wms", "wfs", "wmc" to display
		 */
		service: "wmc",
		
		/**
		 * Configuration of this datasource selector
		 */
		 conf: {
			 url	: "http://localhost/",
			 format	: "Xml"
		 }
	},

	/**
	 * @protected
	 */
	init: function(view) {
		view.config.container = view.up("panel");
		view.config.service = container.service;
		this.callParent(arguments);

		this.store = Ck.create("Ext.data.Store", {
			model: "DataSource"
		});
		
		Cks.get({
			url: "resources/conf/addlayer.json",
			scope: this,
			success: function(response){
				var conf = Ext.decode(response.responseText)[service];
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
	},

	initStore: function(conf) {
		if(Ext.isEmpty(conf)) {
			conf = this.getConf();
		}
		
		switch(this.getService()) {
			case "wmc":
				if(conf.context === true) {
					// TODO wmc getCapabilities
				} else {
					this.store.add({
						name	: "repository",
						title	: "Repository",
						url		: conf.url,
						service	: "wmc",
						format	: conf.format
					});
					this.getView().setVisible(false);
				}
				break;
			case "wms":
			case "wfs":
				if(Ext.isArray(conf)) {
					
				} else {
					this.store.add({
						name	: this.getService(),
						title	: this.getService(),
						url		: conf.url,
						service	: this.getService(),
						format	: conf.format
					});
					this.getView().setVisible(false);
				}
		}
		// Select the first item to load the capabilities directly
		if(this.getView().rendered) {
			this.selectFirst();
		} else {
			this.getView().on("render", this.selectFirst, this);
		}
	},

	/**
	 * Select the first source / context
	 */
	selectFirst: function() {
		this.getView().fireEvent("select", this, this.store.getAt(0).data);
	}
});
