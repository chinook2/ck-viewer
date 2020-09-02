/**
 * Combobox context selection controller
 */
Ext.define('Ck.context.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.context',
	
	requires: [
		'Ck.CapabilitiesStore'
	],
	
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
		this.getView().select(this.getView().context);
		this.getView().fireEvent("select", this.getView(), this.getView().getSelection());
	}
});
