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
		config: null
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
		
		this.loadPanel();
	},
	
	/**
	 * Create panel from layers
	 */
	loadPanel: function() {
		var srcs, data = [],
			lyrs = Ck.getMap().getLayers().getArray(),
			items = [];
		
		for(var i = 0; i < lyrs.length; i++) {
			srcs = lyrs[i].get("sources");
			if(lyrs[i].ckLayer && ((lyrs[i].getSource() instanceof ol.source.Vector) || (srcs.wfs && srcs.wfs[0]))) {
				data.push({
					layer		: lyrs[i],
					title		: lyrs[i].get("title"),
					tolerance	: Ck.Snap.getTolerance()
				});
			}
		}
		
		this.getView().getStore().loadData(data);
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
