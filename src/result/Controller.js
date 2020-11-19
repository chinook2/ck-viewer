/**
 *
 */
Ext.define('Ck.result.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckresult',
	
	excludedColumns: ["boundedBy", "the_geom", "msGeometry", "ckFeature"],
	
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
			"ckresult button#exportcsvsel": {
				click: function() {
					this.prepareexportcsv();
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
		
		Ck.getMap().on("contextloading", function(ctx) {
			this.getOpenner().resetSelection();
			this.getOpenner().close();	
		}, this);	
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
				layer	: res[i].layer.get("title"),
				selected: res[i].features.length.toString(),
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
		this.colorresult(fts);
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
		
		if(this.featurePaging) {
			this.featurePaging.setStore(this.featureStore);
		}
		
		this.featureGrid.reconfigure(this.featureStore, columns);
		this.featureGrid.addListener("cellclick",this.onGridCellClick,this);
	},
	
	/**
	 * Remove all results
	 */
	clearHistory: function() {
		this.layerRoot.removeAll();
	},
	
	/**
	 * exporte all results en csv
	 */
	prepareexportcsv: function(){
		ares = this.data[0];
		var strlstcpr = "";
		for(i=0 ; i < ares.length; i ++) {
			iteratb = 0;
			arestmp = ares[i].features; 
			strlstcpr += ares[i].layer.ckLayer._title+"\n";
			for(t=0 ; t < arestmp.length; t ++) {
				avaltmp = arestmp[t].values_;
				if(iteratb == 0){
					itercol = 0;
					for(var index in avaltmp) { 
						if(index != 'boundedBy' && index != 'the_geom' && index != 'geom' && index != 'id' && index != 'ckFeature'){
							if(itercol != 0){
								strlstcpr += ";";
							}
							strlstcpr += index;
							itercol = itercol + 1;
						} 
					}
					strlstcpr += "\n";
				}
				itercol1 = 0;
				for(var index1 in avaltmp) { 
					if(index1 != 'boundedBy' && index1 != 'the_geom' && index1 != 'geom' && index1 != 'id' && index1 != 'ckFeature'){
						if(itercol1 != 0){
							strlstcpr += ";";
						}
						strlstcpr += avaltmp[index1];
						itercol1 = itercol1 + 1;
					} 
				}
				strlstcpr += "\n\n";
				
				iteratb = iteratb + 1;
			}
			
		}
		var blob = new Blob(["\ufeff",strlstcpr], {type: 'text/csv'});
		var downloadLink = document.createElement("a");
		downloadLink.href = window.URL.createObjectURL(blob);
		downloadLink.download = "Selection.csv";
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
					
	},
	
	colorresult: function(features){
		
		allfeat = Ck.resultFeature;		
		for(i=0 ; i < allfeat.length; i++){
			alay = allfeat[i];
			 for(u = 0 ; u <alay.length; u++){
				afeat = alay[u];
				if(afeat.getGeometry()){
					switch (afeat.getGeometry().getType().toLowerCase()) {
						case 'multipoint':
						case 'point':
							style = new ol.style.Style({
								image: new ol.style.Circle({
									radius: 5,
									stroke: new ol.style.Stroke({
										color: 'rgba(255, 149, 61, 0.9)',
										width: 1
									})
								})
							});
							break;

						case 'linestring':
						case 'line':
							style = new ol.style.Style({
								stroke: new ol.style.Stroke({
									color:  'rgba(255, 149, 61, 0.9)',
									width: 1
								})
							});
							break;

						case 'circle':
						case 'polygon':
						case 'multipolygon':
							style = new ol.style.Style({
								image: new ol.style.Circle({
									radius: 5,
									stroke: new ol.style.Stroke({
										color: 'rgba(255, 149, 61, 0.9)',
										width: 1
									})
								}),
								stroke: new ol.style.Stroke({
									color: 'rgba(255, 149, 61, 0.9)',
									width: 1
								})
							});
							break;
					}
					if(style) afeat.setStyle(style);
				}
			}
		}
		
		for(i = 0; i < features.length; i++) {
			if(features[i].getGeometry()){
				switch (features[i].getGeometry().getType().toLowerCase()) {
					case 'multipoint':
					case 'point':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color:  'rgba(255, 149, 61, 0.5)'
								}),
								radius: 6,
								stroke: new ol.style.Stroke({
									color: 'rgba(255, 149, 61, 0.9)',
									width: 1
								})
							})
						});
						break;

					case 'linestring':
					case 'line':
						style = new ol.style.Style({
							stroke: new ol.style.Stroke({
								color:  'rgba(255, 149, 61, 0.9)',
								width: 2
							})
						});
						break;

					case 'circle':
					case 'polygon':
					case 'multipolygon':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color: 'rgba(255, 149, 61, 0.5)'
								}),
								radius: 6,
								stroke: new ol.style.Stroke({
									color: 'rgba(255, 149, 61, 0.9)',
									width: 2
								})
							}),
							fill: new ol.style.Fill({
								color: 'rgba(255, 149, 61, 0.5)'
							}),
							stroke: new ol.style.Stroke({
								color: 'rgba(255, 149, 61, 0.9)',
								width: 2
							})
						});
						break;
				}
				if(style) features[i].setStyle([style]);
			}
		}
		
	},
	
	onGridCellClick : function(g, td, cellIndex, rec, tr, rowIndex, e, eOpts ){
		
		// if(cellIndex != 0){			
			allfeat = Ck.resultFeature;		
			for(i=0 ; i < allfeat.length; i++){
				alay = allfeat[i];
				 for(u = 0 ; u <alay.length; u++){
					afeat = alay[u];
					if(afeat.getGeometry()){
						switch (afeat.getGeometry().getType().toLowerCase()) {
							case 'multipoint':
							case 'point':
								style = new ol.style.Style({
									image: new ol.style.Circle({
										radius: 5,
										stroke: new ol.style.Stroke({
											color: 'rgba(255, 149, 61, 0.9)',
											width: 1
										})
									})
								});
								break;

							case 'linestring':
							case 'line':
								style = new ol.style.Style({
									stroke: new ol.style.Stroke({
										color:  'rgba(255, 149, 61, 0.9)',
										width: 1
									})
								});
								break;

							case 'circle':
							case 'polygon':
							case 'multipolygon':
								style = new ol.style.Style({
									image: new ol.style.Circle({
										radius: 5,
										stroke: new ol.style.Stroke({
											color: 'rgba(255, 149, 61, 0.9)',
											width: 1
										})
									}),
									stroke: new ol.style.Stroke({
										color: 'rgba(255, 149, 61, 0.9)',
										width: 1
									})
								});
								break;
						}
						if(style) afeat.setStyle(style);
					}
				}
			}
						
			allfeacur = g.getStore().data.items;
			
			for(i = 0; i < allfeacur.length; i++) {
				recfea = allfeacur[i];
				feacur = recfea.get('ckFeature');
				if(feacur.getGeometry()){
					switch (feacur.getGeometry().getType().toLowerCase()) {
						case 'multipoint':
						case 'point':
							style = new ol.style.Style({
								image: new ol.style.Circle({
									fill: new ol.style.Fill({
										color:  'rgba(255, 149, 61, 0.5)'
									}),
									radius: 6,
									stroke: new ol.style.Stroke({
										color: 'rgba(255, 149, 61, 0.9)',
										width: 1
									})
								})
							});
							break;

						case 'linestring':
						case 'line':
							style = new ol.style.Style({
								stroke: new ol.style.Stroke({
									color:  'rgba(255, 149, 61, 0.9)',
									width: 2
								})
							});
							break;

						case 'circle':
						case 'polygon':
						case 'multipolygon':
							style = new ol.style.Style({
								image: new ol.style.Circle({
									fill: new ol.style.Fill({
										color: 'rgba(255, 149, 61, 0.5)'
									}),
									radius: 6,
									stroke: new ol.style.Stroke({
										color: 'rgba(255, 149, 61, 0.9)',
										width: 2
									})
								}),
								fill: new ol.style.Fill({
									color: 'rgba(255, 149, 61, 0.5)'
								}),
								stroke: new ol.style.Stroke({
									color: 'rgba(255, 149, 61, 0.9)',
									width: 2
								})
							});
							break;
					}
					if(style) feacur.setStyle([style]);
				}
			}
			
			 features = rec.get('ckFeature');
			 
			if(features.getGeometry()){
				 switch (features.getGeometry().getType().toLowerCase()) {
					 case 'multipoint':
					case 'point':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color:  'rgba(0, 149, 61, 0.5)'
								}),
								radius: 6,
								stroke: new ol.style.Stroke({
									color: 'rgba(0, 149, 61, 0.9)',
									width: 1
								})
							})
						});
						break;

					case 'linestring':
					case 'line':
						style = new ol.style.Style({
							stroke: new ol.style.Stroke({
								color:  'rgba(0, 149, 61, 0.9)',
								width: 2
							})
						});
						break;

					case 'circle':
					case 'polygon':
					case 'multipolygon':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color: 'rgba(0, 149, 61, 0.5)'
								}),
								radius: 6,
								stroke: new ol.style.Stroke({
									color: 'rgba(0, 149, 61, 0.9)',
									width: 2
								})
							}),
							fill: new ol.style.Fill({
								color: 'rgba(0, 149, 61, 0.5)'
							}),
							stroke: new ol.style.Stroke({
								color: 'rgba(0, 149, 61, 0.9)',
								width: 2
							})
						});
						break;
			}
			if(style) features.setStyle([style]);
		}
	}
	
});
