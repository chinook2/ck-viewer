/**
 * Chinook selection interaction. Differents options allowed :
 *  - type
 *  - style
 *  - limit
 *
 * There are several possibilities to highlight selection but most of them are problematic :
 *  - change the feature style with getStyle and setStyle, but render ordering raise error
 *  - 
 *
 * For WFS callback parameter contain the reals features and not a clone
 */
Ext.define('Ck.Selection', {
	
	config: {
		/**
		 * Chinook map
		 * @var {Ck.map}
		 */
		map: null,
		
		/**
		 * OpenLayers 3 map
		 * @var {ol.map}
		 */
		olMap: null,
		
		/**
		 * The layers to be queried or null to queried all layer
		 */
		layers: null,
		
		/**
		 * Type of selection.
		 * Can be one of : Point, LineString, Polygon, Circle, Square, Box
		 */
		type: null,
		
		/**
		 * Number of feature needed. Limit per layer. If null no limit will be applied.
		 * @var {Integer}
		 */
		limit: 1,
		
		/**
		 * Witch key used to stack selection. Can be "ctrlKey", "shitftKey", "altKey"
		 * @var {String} By default "shitftKey"
		 */
		mergeKey: "shiftKey",
		
		/**
		 * The function will be called when feature selected
		 * The function take one parameter : {Object[]}. One array of object with "features" and "layer" members.
		 * The features are "real" features for WFS layer or temporaries features for WMS
		 */
		callback: Ext.emptyFn,
		
		/**
		 * The scope of the callback method
		 */
		scope: null,
		
		/**
		 * Draw style. Set to null to hide drawing.
		 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction}
		 */
		drawStyle: Ck.map.Style.orangeStroke,
		
		/**
		 * Draw interaction
		 * @var {ol.interaction.Draw}
		 */
		draw: null,
		
		/**
		 * True to hightlight feature from WMS.
		 */
		highlight: true,
		
		/**
		 * True to replace vector feature with a selected feature.
		 * Useful to change style of selected feature.
		 */
		overHighlight: false,
		
		/**
		 * Selection style. Set to null to hide drawing. Only useful when highlight is true.
		 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction}
		 */
		highlightStyle: Ck.map.Style.orangeStroke,
		
		/**
		 * ZIndex of the highlight selected feature
		 */
		highlightZIndex: Ck.map.Style.zIndex.editInteraction,
		
		/**
		 * Select interaction. Use to highlight features.
		 * @var {ol.interaction.Select}
		 */
		select: null,
		
		/**
		 * Select interaction ID. Useful to share the select interaction.
		 * @var {String}
		 */
		selectId: "ckmapSelect",
		
		/**
		 * Stack selection or not
		 */
		stackSelection: false,
		
		/**
		 *
		 */
		maskMsg: "Selection in progress...",
		
		/**
		 * Loading mask
		 */
		mask: null,
		
		/**
		*	Tolerance en px
		**/
		tolerance: 10
	},
	
	/**
	 * For a selection, mark if the new selection must stack with the old selection.
	 */
	inAddition: false,
	
	/**
	 * The current selection. Cleaned at the beginning of a selection if mergeKey doesn't be pressed.
	 * @var {Object[]} Array of object with "features" and "layer" member
	 */
	selection: [],

	constructor: function(config) {
		Ext.apply(config, {
			olMap : config.map.getOlMap()
		});
		
		this.initConfig(config);
		
		if(config.scope) {
			this.setCallback(config.callback.bind(config.scope));
		}
		
		var geometryFunction, maxPoints;
		var type = this.getType().toLowerCase();
		var olMap = this.getOlMap();
		
		// Type compatibility and specifications
		if(type.indexOf("point") != -1) {
			type = "Point";
		} else if(type.indexOf("line") != -1) {
			type = "LineString";
		} else if(type.indexOf("polygon") != -1) {
			type = "Polygon";
		} else if(type.indexOf("circle") != -1) {
			type = "Circle";
		} else if(type.indexOf("square") != -1) {
			type = "Circle";
			geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
		} else if(type.indexOf("box") != -1) {
			maxPoints = 2;
			type = "LineString";
			geometryFunction = function(coordinates, geometry) {
				if (!geometry) {
					geometry = new ol.geom.Polygon(null);
				}
				var start = coordinates[0];
				var end = coordinates[1];
				geometry.setCoordinates([
					[start, [start[0], end[1]], end, [end[0], start[1]], start]
				]);
				return geometry;
			};
		}
		
		// Initialize draw interaction		
		var draw = new ol.interaction.Draw({
			type				: type,
			geometryFunction	: geometryFunction,
			maxPoints			: maxPoints,
			style				: this.getDrawStyle(),
			condition			: function() {return true;}
		});
		this.setDraw(draw);
		
		
		draw.on('drawstart', function(evt) {
			this.sketch = evt.feature;
		}, this);
		
		draw.on('drawend', this.processSelection, this);
		
		olMap.addInteraction(draw);
		draw.setActive(false);
		
		// Share only one select interaction for all sub classes
		var inte = olMap.getInteractions();
		for(i=0; i<inte.getLength(); i++){
			if(inte.item(i).get('id') == this.getSelectId()) {
				this.setSelect(inte.item(i));
				break;
			}
		}
		
		// Select interaction to host (and highlight) selected features
		if(Ext.isEmpty(this.getSelect()) && this.getHighlight()) {
			var select = new ol.interaction.Select({
				style: this.getHighlightStyle(),
				zIndex: this.getHighlightZIndex()
			});
			olMap.addInteraction(select);
			select.set('id', this.getSelectId());
			select.setActive(false);
			
			select.on('select', function(e) {
				Ck.log(e.target.getFeatures().getLength() +
				  ' selected features (last operation selected ' + e.selected.length +
				  ' and deselected ' + e.deselected.length + ' features)');
			});
			this.setSelect(select);
		}
		
		// Create the mask
		this.setMask(new Ext.LoadMask({
			msg: this.getMaskMsg(),
			target: this.getMap().getView()
		}));
	},
	
	/**
	 * Query layers with current selection
	 * @param {ol.interaction.DrawEvent}
	 */
	processSelection: function(evntParams) {
		this.getMask().show();
		
		// Fix if selection is fired from code and not from user interaction
		if(event !== undefined) {
			this.inAddition = event[this.getMergeKey()];
		}
		
		var feature = evntParams.feature;
		var draw = this.getDraw();
		
		if(!this.inAddition && !this.getStackSelection()) {
			this.resetSelection();
		}
		
		// Unset sketch
		draw.sketch = null;
		
		// Parse les géométries en GeoJSON
		var geoJSON  = new ol.format.GeoJSON();
		var type = feature.getGeometry().getType();
		
		var selFt = feature;
		if(type=="Point"){
			var radius = Ck.getMap().getOlView().getResolution() * this.getTolerance(); // 10px buffer
			var bbox = feature.getGeometry().getExtent();
			var selFt = new ol.Feature({
				geometry: new ol.geom.Polygon.fromExtent(ol.extent.buffer(bbox, radius))
			});
		}
		
		/* Developper : you can display buffered draw for Circle and Point
			writer = new ol.format.WKT();
			// writer.writeFeature(geoJSON.readFeature(selFt)); // getWKT
			ft = geoJSON.readFeature(selFt);
			
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
			window.lyr.getSource().addFeature(ft);
		//*/
		
		var i = 0;
		var layers = this.getLayers();
		
		if(Ext.isEmpty(layers)) {
			layers = Ck.getMap().getLayers(function(lyr) {
				return (lyr.getVisible() && Ck.getMap().layerInRange(lyr) && 
					(lyr instanceof ol.layer.Vector || lyr instanceof ol.layer.Image) &&
					lyr.getProperties("id") != "measureLayer"
				);
			});
			layers = layers.getArray();
		}
		
		var ft;
		this.nbQueryDone = 0;
		this.nbQuery = layers.length;
		
		for(var i = 0; i < layers.length; i++) {
			if(layers[i] instanceof ol.layer.Vector) {
				ft = this.queryWFSLayer(layers[i], selFt, evntParams);
				this.onSelect(ft, layers[i]);
			} else {
				this.queryWMSLayer(layers[i], selFt, evntParams);
			}
		}
	},
	
	/**
	 * Query a WFS layer.
	 * @params {ol.layer.Base}
	 * @params
	 * @params 
	 * @return {ol.Feature[]}
	 */
	queryWFSLayer: function(layer, selFt, evntParams) {
		
		var geoJSON  = new ol.format.GeoJSON();
		var lyrFts, lyrFt, source, map, view, extent;
		
		map = Ck.getMap().getOlMap();
		view = map.getView();
		extent = view.calculateExtent(map.getSize());
		res = [];
		source = layer.getSource();
		lyrFts = source.getFeaturesInExtent(extent);
		// selFeature = geoJSON.writeFeatureObject(evntParams.feature);
		selFeature = geoJSON.writeFeatureObject(selFt);
		
		for(var j = 0; j < lyrFts.length; j++) {
			var currFeature = lyrFts[j];
			lyrFt = geoJSON.writeFeatureObject(currFeature);
			
			// JMA
			// TODO : retest !
			try {
				if(turf.intersect(lyrFt, selFeature)) {
					if(currFeature.getProperties().features) {
						for(k = 0; k < currFeature.getProperties().features.length; k++) {
							res.push(currFeature.getProperties().features[k]);
						}
					} else {
						res.push(currFeature);
					}
				}
			} catch(error) {
				var id = currFeature.get("id") || currFeature.getId();
				console.log("Feature" + id + " error " + error.name + " : " + error.message);
			}			
		}
		
		return res;
	},
	
	/**
	 * Query a WMS layer.
	 * @params {ol.layer.Base}
	 * @params
	 * @params 
	 * @return {ol.Feature[]}
	 */
	queryWMSLayer: function(layer, selFt, evntParams) {
		var sources = layer.get("sources");
		if(Ext.isEmpty(sources.wfs)) {
			var size = Ck.getMap().getOlMap().getSize();
			var extent = Ck.getMap().getOlView().calculateExtent(size).join(",");
			var xy = evntParams.target.downPx_;
			var projCode = this.getMap().getProjection().getCode();
			
			var source = layer.getSource();
			url = source.getUrl();
			
			Ck.Ajax.get({
				scope: this,
				url: url,
				cors: true,
				useDefaultXhrHeader : false,
				nocache: true,
				params: {
					service: "WMS",
					request: "GetFeatureInfo",
					version: source.getParams().VERSION,
					layers: source.getParams().LAYERS,
					query_layers: source.getParams().LAYERS,
					bbox: extent,
					srs: projCode,
					feature_count: 10,
					x: xy[0],
					y: xy[1],
					width: size[0],
					height: size[1],
					info_format: "application/vnd.ogc.gml",
					geometriefeature: "bounds",
					mod: "sheet"
				},
				success: function(layer, response) {
					var parser = new ol.format.WMSGetFeatureInfo();
					var parseOptions = {
						dataProjection: projCode,
						featureProjection: projCode
					};
					var features = parser.readFeatures(response.responseXML, parseOptions);
					this.onSelect(features, layer);
				}.bind(this, layer),
				failure: function() {
					Ck.log("Request getFeature fail for layer ");
					this.onSelect();
				}
			});
		} else {
			this.queryWFSSource(layer, selFt, evntParams);
		}
	},
	
	queryWFSSource: function(layer, selFt, evntParams) {
		var off = layer.ckLayer.getOffering("wfs");
		var ope = off.getOperation("GetFeature");
		var selBBox = selFt.getGeometry().getExtent();

		var f = Ck.create("ol.format.WFS", {
			featureNS: "http://mapserver.gis.umn.edu/mapserver",
			gmlFormat: Ck.create("ol.format.GML3"),
			featureType: ope.getLayers().split(",")
		});
		var gf = f.writeGetFeature({
			srsName			: this.getMap().getProjection().getCode(),
			featureTypes	: ope.getLayers().split(","),
			geometryName	: layer.getExtension("geometryColumn"),
			count			: this.getLimit(),
			maxFeatures		: this.getLimit(),
			bbox			: selBBox
		});
		
		// Temporary parent to get the whole innerHTML
		var pTemp = document.createElement("div");
		pTemp.appendChild(gf);
		
		// Pre make reader options for readFeatures method
		var readOptions = {
			dataProjection: ope.getSrs(),
			featureProjection: this.getMap().getProjection().getCode()
		};
		
		// Do the getFeature query
		Ck.Ajax.post({
			scope: this,
			url: ope.getUrl(),
			rawData: pTemp.innerHTML,
			success: function(layer, ope, readOptions, response) {
				var lyr = ope.getLayers().split(",");
				// Fix Chinook 1 context prefix in getFeature response
				for(var i in lyr) {
					lyr[i] = lyr[i].split(":").pop();
				}
				
				var format = Ck.create("ol.format.WFS", {
					featureNS: "http://mapserver.gis.umn.edu/mapserver",
					gmlFormat: Ck.create("ol.format.GML3"),
					featureType: lyr
				});
				
				var features = format.readFeatures(response.responseXML, readOptions);
				this.onSelect(features, layer);
			}.bind(this, layer, ope, readOptions),
			failure: function() {
				Ck.log("Request getFeature fail for layer ");
				this.onSelect();
			}
		});
	},
	
	/**
	 * @params {ol.Feature[]}
	 * @params {ol.layer.Base}
	 */
	onSelect: function(features, layer) {
		if(features && features.length !== 0 && layer) {
			var res;
			
			// Force number of features limitation
			if(this.getLimit() !== null) {
				features = features.slice(0, this.getLimit());
			}
			
			// Look whether a selection has been made on the same layer
			for(var i = 0; ((i < this.selection.length) && Ext.isEmpty(res)); i++) {
				if(this.selection[i].layer == layer) {
					res = this.selection[i];
				}
			}
			
			if(Ext.isEmpty(res)) {
				this.selection.push({
					features: features,
					layer: layer
				});
			} else {
				var idx;
				for(var i = 0; i < features.length; i++) {
					idx = res.features.indexOf(features[i]);
					if(idx == -1) {
						res.features.push(features[i]);
					} else {
						res.features.slice(idx, 1);
					}
				}
			}
			
			var wfsLayer = (layer instanceof ol.layer.Vector);
			
			// Highligth selected features and add them to select collection
			if((!wfsLayer && this.getHighlight()) || (this.getOverHighlight() && wfsLayer)) {
				
				// The select interaction is used to highlight
				var idx, select = this.getSelect();
				select.setActive(true);
				var selCollection = select.getFeatures();
				var selArray = selCollection.getArray();
				
				// Loop on new selected features
				for(var i = 0; i < features.length; i++) {
					idx = selArray.indexOf(features[i]);
					if(idx == -1) {
						selCollection.push(features[i]);
					} else {
						selCollection.remove(features[i]);
					}
				}
				select.setActive(false);
			}
		}
		
		this.nbQueryDone++;
		
		if(this.nbQueryDone >= this.nbQuery) {
			this.getMask().hide();
			this.getCallback()(this.selection);
		}
	},
	
	/**
	 * Set the draw style. Set to null to hide drawing.
	 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction/null}
	 */
	setDrawStyle: function(style) {
		if(Ext.isEmpty(style)) {
			this._drawStyle = Ck.map.Style.invisibleStyle;
		} else {
			this._drawStyle = style;
		}
	},
	
	/**
	 * Set the selection style. Set to null to hide drawing.
	 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction/null}
	 */
	setHighlightStyle: function(style) {
		if(Ext.isEmpty(style)) {
			this._highlightStyle = Ck.map.Style.invisibleStyle;
		} else {
			this._highlightStyle = style;
		}
	},
	
	/** 
	 * Activate or deactivate the draw interaction
	 */
	setActive: function(status) {
		this.getDraw().setActive(status);
	},
	
	/**
	 * Reset the selection
	 */
	resetSelection: function() {
		var style;
		for(var obj in this.selection) {
			for(var ft in this.selection[obj].features) {
				
			}
		}
		this.selection = [];
		// this.getDraw().source_.clear();
		if(this.getHighlight()) {
			var isActive = this.getSelect().getActive();
			this.getSelect().setActive(true);
			this.getSelect().getFeatures().clear();
			this.getSelect().setActive(isActive);
		}
	},
	
	destroy: function() {
		this.resetSelection();
		var olMap = this.getOlMap();
		var draw = this.getDraw();
		var select = this.getSelect();
		
		olMap.removeInteraction(draw);
		if(!Ext.isEmpty(select)) {
			olMap.removeInteraction(select);
		}
	}
});