/**
 *
 */
Ext.define('Ck.result.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckresult',
	
	excludedColumns: ["boundedBy", "the_geom"],
	
	config: {
		openner: null
	},
	
	data: [],
	
	/**
	 * @protected
	 */
	init: function(view) {		
		this.layerTree = view.queryById("layer_tree");
		this.layerStore = this.layerTree.getStore();
		this.layerRoot = this.layerTree.getRootNode();
		this.featureGrid = view.queryById("feature_grid");
		this.featurePaging = view.queryById("feature_paging");
		
		this.setOpenner(view.openner);
		
		this.control({
			"ckresult treepanel#layer_tree": {
				itemclick: this.loadFeature
			},
			"ckresult button#close": {
				click: function() {
					this.getOpenner().resetSelection();
					this.getOpenner().close();
				}
			},
			"ckresult button#clear-history": {
				click: this.clearHistory
			}
		});
	},
	
	/**
	 * Load a search result set to populate left tree.
	 */
	loadData: function(res) {
		this.data.push(res);
		var firstId, now = Ext.Date.format(new Date(), "H-i-s");
		
		// Layer store tree creation
		var layers = [];
		for(var i in res) {
			if(Ext.isEmpty(firstId)) {
				firstId = res[i].layer.get("id") + "-" + now;
			}
			layers.push({
				leaf	: true,
				id		: res[i].layer.get("id") + "-" + now,
				text	: res[i].layer.get("title") + " (" + res[i].features.length.toString() + ")",
				data	: res[i]
			});
		};
		var result = [{
			id			: now,
			text		: now,
			children	: layers,
			expandable	: true
		}];
		
		this.layerRoot.appendChild(result);
		this.layerTree.selectPath(firstId, null, null, function(success, lastNode) { this.loadFeature(this.layerTree, lastNode) }.bind(this));
		
		
	},
	
	loadFeature: function(tree, record) {
		if(Ext.isEmpty(record.data.data)) {
			return false;
		}
		var fts = record.data.data.features;
		
		// List columns
		var columns = [];
		for(var key in fts[0].values_) {
			if(this.excludedColumns.indexOf(key) == -1) {
				columns.push({
					text: key,
					dataIndex: key
				});
			}
		}
		
		var features = [];
		for(var i in fts) {
			features.push(fts[i].values_);
		}
		
		this.featureStore = Ck.create("Ext.data.Store", {
			data: features,
			pageSize: this.getView().getConfig("pageSize"),
			autoLoad: false,
			proxy: {
				type: "memory",
				enablePaging: true
			}
		});
		
		this.featurePaging.setStore(this.featureStore);
		this.featureGrid.reconfigure(this.featureStore, columns);
	},
	
	/**
	 * Remove all results
	 */
	clearHistory: function() {
		this.featureGrid.hide();
		this.layerRoot.removeAll();
	}
});
