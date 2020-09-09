/**
 * Combobox context selection controller
 */
Ext.define('Ck.context.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.context',

	config: {
		/**
		 * Configuration of this context combobox
		 */
		 conf: {}
	},

	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent(arguments);

		if(Ck.params.context) {
			this.getView().context = Ck.params.context;
		}

		this.initStore();
	},

	initStore: function() {
		var store = Ck.create("Ck.CapabilitiesStore", {service: "WMC"});
		this.getView().setStore(store);
		
		// If default context specified add an event
		if(this.getView().context != undefined) {
			store.on("load", this.selectDefault, this);
		}
		
		// Sort list by public/private and Title (sort on multiple field failed !)
		store.setSorters({
			property: 'combined',
			direction: 'ASC'
		});

		store.load({
			url: this.getFullUrl(Ck.getApi()) + "service=wmc&request=getCapabilities"
		});
	},

	/**
	 * Select the first source / context
	 */
	selectFirst: function() {
		this.getView().fireEvent("select", this, this.store.getAt(0).data);
	},
	
	selectDefault: function() {
		var map = this.getMap();
		if(!map) return;

		// A context is already loaded or loading (restore context state), by-pass default context from combobox
		if (map.contextName) {
			this.getView().select(map.contextName);
			return;
		}

		// Select default Context in the list
		this.getView().select(this.getView().context);

		// Load default context (plugin load)
		this.getView().fireEvent("select", this.getView(), this.getView().getSelection());
	}
});
