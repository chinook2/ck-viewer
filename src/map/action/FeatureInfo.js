/**
 * Base class for featureinfo actions.
 *
 * The ol.interaction.FeatureInfo is not used because ol does not support exotic featureinfoion (circle, polygon...).
 * However an ol.interaction.FeatureInfo is created to manage featureinfoed features properly.
 * So featureinfoions are made manually.
 * 
 * See : Ck.map.action.featureinfo.Point, Ck.map.action.featureinfo.Square ...
 */
Ext.define('Ck.map.action.FeatureInfo', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapFeatureInfo',
	
	toggleGroup: 'ckmapAction',
	tooltip: "Get feature info",
	iconCls: "fa fa-info-circle",
	
	itemId: 'featureinfo',
	
	/**
	 * Buffer around point click (in pixel)
	 */
	buffer: 5,
	
	/**
	 * Query visible layer only
	 */
	onlyVisible: true,
	
	/**
	 * 
	 */
	fieldIgnored: ["geometry"],
	
	/**
	 * FeatureInfo on vector layer
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		Ext.define('FeatureInfoResult', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'featureid', type: 'int'},
				{name: 'field', type: 'string'},
				{name: 'value', type: 'string'}
			]
		});
	},
	
	/**
	 * 
	 */
	toggleAction: function(btn, pressed) {
		if(pressed) {
			this.evKey = this.olMap.on("click", this.onClick, this);
		} else {
			this.olMap.unByKey(this.evKey);
		}
	},
	
	onClick: function(evt) {
		this.res = [];
		
		this.curCoord = evt.coordinate;
		this.curPixel = evt.pixel;
		
		// TODO Display mask
		
		var lyrs = Ck.getMap().getLayers(function(lyr) {
			return (lyr.getExtension && lyr.getExtension("queryable") === true
				&& (!this.onlyVisible || lyr.getVisible()));
		}.bind(this));
		
		// Buffer point
		var geom = turf.buffer(
			turf.point(this.curCoord),
			Ck.getMap().getOlView().getResolution() * this.buffer
			, "meters"
		);
		
		var bbox = new ol.geom.Polygon(geom.features[0].geometry.coordinates);
		
		/*/ Debug to display buffered point
		if(!window.lyr) {
			window.lyr = new ol.layer.Vector({
				id: "onTheFlyLayer",
				title: "onTheFlyLayer",
				source: new ol.source.Vector({
					projection: 'EPSG:3857',
					format: new ol.format.GeoJSON()
				}),
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'blue',
						width: 3
					}),
					fill: new ol.style.Fill({
						color: 'rgba(0, 0, 255, 0.1)'
					})
				})
			});
			Ck.getMap().getOlMap().addLayer(window.lyr);
		}
		window.lyr.getSource().addFeature(new ol.Feature({geometry: bbox}));
		*/
		
		bbox = bbox.getExtent();
		
		var size = this.olMap.getSize();
		var extent = Ck.getMap().getOlView().calculateExtent(size).join(",");
		
		this.nbQueryDone = 0;
		this.nbQuery = lyrs.getLength();
		
		// Loop on queryable layers
		lyrs.forEach(function(lyr) {
			var src = lyr.getSource();
			
			if(src.getFeaturesInExtent) {
				features = src.getFeaturesInExtent(bbox);
				if(features.length != 0) {
					// If clustered vector we have to scan sub feature
					if(src instanceof ol.source.Cluster) {
						var subFeatures = [];
						features.forEach(function(ft) {
							subFeatures = subFeatures.concat(ft.values_.features);
						});
						features = subFeatures;
					}
					this.res.push({
						features: features,
						layer: lyr
					});
				}
				this.displayInfo();
			} else {
				url = src.getUrl();
				Ck.Ajax.get({
					scope: this,
					url: url,
					params: {
						service: "WMS",
						request: "GetFeatureInfo",
						version: src.getParams().version,
						layers: src.getParams().layers,
						query_layers: src.getParams().layers,
						bbox: extent,
						srs: "EPSG:3857",
						feature_count: 10,
						x: this.curPixel[0],
						y: this.curPixel[1],
						width: size[0],
						height: size[1],
						info_format: "application/vnd.ogc.gml",
						geometriefeature: "bounds",
						mod: "sheet"
					},
					success: function(response) {
						var parser = new ol.format.WMSGetFeatureInfo();
						var features = parser.readFeatures(response.responseXML);
						if(features.length != 0) {
							this.res.push({
								features: features,
								layer: lyr
							});
						}
						this.displayInfo();
					},
					failure: function() {
						Ck.log("Request getFeature fail for layer ");
						this.displayInfo();
					}
				});
			}
			
			
		}, this);
		
		
	},
	
	displayInfo: function() {
		this.nbQueryDone++;
		
		if(this.nbQueryDone == this.nbQuery) {
			if(this.res.length != 0) {
				this.createContainer();
				this.panel.removeAll();
				
				this.res.forEach(function(lyr) {
					this.panel.add(this.createTab(lyr));
				}, this);
				
				this.win.show();
			} else {
				alert("Result empty!");
			}
		}
	},
	
	/**
	 * Create panel with grid from one layer
	 * @param {Object} Result with members "features" and "layer"
	 * @return {Ext.grid.Panel}
	 */
	createTab: function(lyr) {
		var data = [];
		for(var i = 0; i < lyr.features.length; i++) {
			for(var f in lyr.features[i].values_) {
				if(this.fieldIgnored.indexOf(f) == -1) {
					data.push({
						featureid: i + 1,
						field: f,
						value: lyr.features[i].values_[f].toString()
					});
				}
			}
		}
		
		var store = Ck.create("Ext.data.Store", {
			model: "FeatureInfoResult",
			groupField: "featureid",
			data: data
		});
		
		var grid = Ext.create('Ext.grid.Panel', {
			title: lyr.layer.get("title"),
			store: store,
			layout: "fit",
			// height: 200,
			scrollable: true,
			features: [{
				ftype: "groupingsummary",
				groupHeaderTpl: "Feature {featureid}",
				enableGroupingMenu: false,
				showSummaryRow: false,
				startCollapsed: true
			}],
			columns: [{
				text: 'Attribut',
				dataIndex: 'field',
				hideable: false
			},{
				text: 'Value',
				dataIndex: 'value',
				hideable: false
			}]
		});
		
		return grid;
	},
	
	createContainer: function() {
		if(Ext.isEmpty(this.win)) {
			this.panel = Ck.create("Ext.tab.Panel", {
				layout: "fit"
			});
			
			this.win = Ck.create("Ext.Window", {
				width: 400,
				height: 400,
				layout: "fit",
				items: [this.panel],
				closeAction: "hide"
			});
		}
	}
});
