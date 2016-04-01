/**
 *
 */
Ext.define('Ck.result.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckresult',
	
	excludedColumns: ["boundedBy", "the_geom", "msGeometry"],
	
	config: {
		openner: null
	},
	
	data: [],
	
	widgetColumns: {
		sheet: {
			width: 40,
			xtype: 'widgetcolumn',
			resizable: false,
			menuDisabled: true,
			sortable: false,
			hideable: false,
			widget: {
				xtype: 'button',
				style: {
					"background-color": "rgba(0,0,0,0)",
					"border-color": "rgba(0,0,0,0)"
				},
				iconCls: "fa fa-align-justify gray",
				handler: "openSheet"
			}
		}
	},
	
	/**
	 * @var {Ext.data.Model}
	 */
	currentLayer: null,
	
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
		
		this.plugins = [{
			xtype: "gridmenu",
			text: "Click me"
		}];
		
	},
	
	addUpdate: function() {
		var menu = this.headerCt.getMenu();
		menu.add([{
			text: 'Custom Item',
			handler: function() {
				var columnDataIndex = menu.activeHeader.dataIndex;
				alert('custom item for column "'+columnDataIndex+'" was pressed');
			}
		}]);
	},
	
	/**
	 * Load a search result set to populate left tree.
	 */
	loadData: function(res) {
		this.data.push(res);
		var firstId, now = Ext.Date.format(new Date(), "H:i:s");
		
		// JMA Hard fix - temp
		// TODO : option to use/show history or not
		this.layerRoot.removeAll();
		var result = [];
		for(var i in res) {
			if(Ext.isEmpty(firstId)) {
				firstId = res[i].layer.get("id") + "-" + now;
			}
			result.push({
				leaf	: true,
				id		: res[i].layer.get("id") + "-" + now,
				text	: res[i].layer.get("title") + " (" + res[i].features.length.toString() + ")",
				data	: res[i]
			});
		};
		//
		
		// Layer store tree creation
		/*
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
		*/
		
		this.layerTree.collapseAll();
		this.layerRoot.appendChild(result);
		this.layerTree.selectPath(firstId, null, null, function(success, lastNode) {
			this.loadFeature(this.layerTree, lastNode)
		}, this);
	},
	
	/**
	 * Load all features of one layer. Initialize paging
	 * @param {Ext.tree.Panel}
	 * @param {Ext.data.Model} Layer data model (typeof data.data.features == ol.Features[])
	 */
	loadFeature: function(tree, record) {
		if(Ext.isEmpty(record)) {
			record = this.currentLayer;
		} else {
			this.currentLayer = record;
		}
		
		if(Ext.isEmpty(record.data.data)) {
			return false;
		}
		
		var fts = record.data.data.features;
		
		// List columns
		var columns = [];
		
		// Widget columns
		var widget, widgetColumns = this.getView().getWidgetColumns();
		for(var i = 0; i < widgetColumns.length; i++) {
			if(Ext.isEmpty(widgetColumns[i].type)) {
				columns.push(widgetColumns[i]);
			} else {
				widget = this.widgetColumns[widgetColumns[i].type];
				// Ext.apply(widget, widgetColumns[i]);
				columns.push(widget);
			}
		}
		
		for(var key in fts[0].values_) {
			if(this.excludedColumns.indexOf(key) == -1) {
				columns.push({
					text: key,
					dataIndex: key
				});
			}
		}
		
		var obj, features = [];
		for(var i in fts) {
			obj = fts[i].values_;
			obj.ckFeature = fts[i];
			features.push(obj);
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
		
		this.featureStore.ckLayer = record.data.data.layer;
		this.featurePaging.setStore(this.featureStore);
		this.featureGrid.reconfigure(this.featureStore, columns);
	},
	
	/**
	 * Remove all results
	 */
	clearHistory: function() {
		this.layerRoot.removeAll();
	}
});
