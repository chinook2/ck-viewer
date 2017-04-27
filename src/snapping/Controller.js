/**
 * Controller of the snapping options panel
 */
Ext.define('Ck.snapping.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cksnapping',

	config: {
		openner: null,
		
		/**
		 * Config used by snapping tool
		 */
		config: null,
		
		reloadLayer: false,
		layer: null
	},
	
	/**
	 * @protected
	 */
	init: function(view) {
		this.callParent(arguments);
		
		this.control({
			"cksnapping button#close": {
				click: this.getOpenner().close.bind(this.getOpenner())
			}
		});
		
		this.getMap().on("addlayer", this.addLayer, this);
		this.getMap().on("contextloading", this.contextLoading, this);
		
		this.loadPanel();
	},
	
	/**
	 * Create panel from layers
	 */
	loadPanel: function() {
		var item, data = [];
		var lyrs = Ck.getMap().getLayers().getArray();
 		this.getView().getStore().removeAll();
		
 		for(var i = 0; i < lyrs.length; i++) {
			item = this.createItem(lyrs[i]);
			
			if(this.getReloadLayer() && lyrs[i] == this.getLayer()) {
				item.active = true;
			}
			
			if(item != null) {
				data.push(item);
			}
		}
		
		this.getView().getStore().loadData(data);
		this.getView().getView().refresh();
	},
	
	/**
	 * Create an item from a layer to add it into the store.
	 * Return null if the layer cannot be use for snapping.
	 * @param {ol.layer.Base}
	 * @return {Object}
	 */
	createItem: function(layer) {
		var srcs, item;
		
		srcs = layer.get("sources");
		if(layer.ckLayer && ((layer.getSource() instanceof ol.source.Vector) || (srcs.wfs && srcs.wfs[0]))) {
			item = {
				layer		: layer,
				title		: layer.get("title"),
				tolerance	: layer.ckLayer.tolerance || Ck.Snap.getTolerance()
			};
		}
		
		return item;
	},
	
	/**
	 * Create an item from a layer and add it into the store.
	 * @param {ol.layer.Base}
	 */
	addLayer: function(layer) {
		var store = this.getView().getStore();
		item = this.createItem(layer);
		if(item != null) {
			store.add(item);
			this.getView().getView().refresh();
		}
	},
	
	/**
	 * Clear the store on context loading
	 * @param {Object} The OWS Context.
	 */
	contextLoading: function(context) {
		this.getView().getStore().removeAll();		
	},
	
	/**
	 * Get settings. Return an array with one item for each active layer
	 * @return {Object[]}
	 */
	getSettings: function() {
		var settings = [], lyr, data = this.getView().getStore().getData();
		for(var i = 0; i < data.getCount(); i++) {
			lyr = data.getAt(i).data;
			if(lyr.active) {
				settings.push({
					layer		: lyr.layer,
					tolerance	: lyr.tolerance
				});
			}
		}
		
		return settings;
	}
});
