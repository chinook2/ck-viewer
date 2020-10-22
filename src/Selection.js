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
    requires: [
		'Ck'
	],
	config: {
		/**
		 * True to draw geometry use for getFeature
		 */
		debug: false,

		/**
		 * Method called before process selection
		 */
		beforeProcess: Ext.emptyFn,

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
		 * @var {ol.Layer[]/String[]}
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
		 * Buffer, in pixel, for point selection
		 */
		buffer: 10,

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
		drawStyle: null,

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
		highlightStyle: null,

		/**
		 * ZIndex of the highlight selected feature
		 */
		highlightZIndex: null,

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
		 * Allow deselect
		 */
		deselectOnClick: false,

		/**
		 *
		 */
		maskMsg: "Selection in progress...",

		/**
		 * Loading mask
		 */
		mask: null,

		/**
		 * When provide several layers, ignore WMS/WFS layers if found features in local Vector layers
		 */
		skipOwsLayers: false
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
		var me = this;
		Ext.applyIf(config, {
			olMap : config.map.getOlMap(),
			drawStyle: Ck.Style.orangeStroke,
			highlightStyle: Ck.Style.orangeStroke,
			highlightZIndex: Ck.Style.zIndex.editInteraction
		});
		if (config.limit === null) config.limit = -1;

		this.initConfig(config);

		this.selection = new Array();

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
			geometryFunction = ol.interaction.Draw.createRegularPolygon(24);
		} else if(type.indexOf("square") != -1) {
			type = "Circle";
			geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
		} else if(type.indexOf("box") != -1) {
			type = "Circle";
			geometryFunction = ol.interaction.Draw.createBox();
		}

		// Initializ draw interaction
		var draw = new ol.interaction.Draw({
			type				: type,
			geometryFunction	: geometryFunction,
			maxPoints			: maxPoints,
			style				: this.getDrawStyle(),
			condition			: function(e) {
				me.inAddition = e.originalEvent[me.getMergeKey()];
				return true;
			}
		});
		this.setDraw(draw);


		draw.on('drawstart', function(evt) {
			this.sketch = evt.feature;
		}.bind(this));

		draw.on('drawend', this.processSelection.bind(this));

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
		if(this.getBeforeProcess().bind(this.getScope())() === false) {
			return false;
		}

		// Get access to event in override
		this.drawEvent = evntParams;

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
			var radius = Ck.getMap().getOlView().getResolution() * this.getBuffer(); // 10px buffer
			var bbox = feature.getGeometry().getExtent();
			var selFt = new ol.Feature({
				geometry: new ol.geom.Polygon.fromExtent(ol.extent.buffer(bbox, radius))
			});
		}

		// Draw the feature used for getFeature query if debug is true. Use this to clean map : window.lyr.getSource().clear()
		if(this.getDebug()) {
			var ft = selFt.clone();
			if(!this.debugLayer) {
				this.debugLayer = new ol.layer.Vector({
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
				this.getMap().getOlMap().addLayer(this.debugLayer);
			}
			this.debugLayer.getSource().addFeature(ft);
		}

		var lyr, layers = this.getLayers();
		this.layersToQuery = [];

		if(Ext.isEmpty(layers) || !Ext.isArray(layers)) {
			var lyrToQuery = this.getMap().getLayers(function(lyr) {
				return ((lyr.ckLayer && lyr.ckLayer.getUserLyr() &&
						(lyr.getVisible() || lyr.getExtension("alwaysQueryable")) &&
						(lyr instanceof ol.layer.Vector || lyr instanceof ol.layer.Image))
				);
			});
			this.layersToQuery = lyrToQuery.getArray().reverse();
		} else {
			for(var i = 0; i < layers.length; i++) {
				if(Ext.isString(layers[i])) {
					lyr = this.getMap().getLayerById(layers[i]);
				} else {
					lyr = layers[i];
				}
				if(lyr) {
					if ((lyr.ckLayer && lyr.ckLayer.getUserLyr()) &&
						(lyr.getVisible() || lyr.getExtension("alwaysQueryable")) &&
						(lyr instanceof ol.layer.Vector || lyr instanceof ol.layer.Image)) {
						this.layersToQuery.push(lyr);
					}
				} else {
					Ck.log("Layer \"" + layers[i] + "\" not found, unable to query it");
				}
			}
		}

		var ft;
		var skip = false;

		this.nbQueryDone = 0;
		this.nbQuery = this.layersToQuery.length;
		this.selection = new Array(this.nbQuery);

		if (this.nbQuery > 0) this.getMask().show();

		for(var l = 0; l < this.layersToQuery.length; l++) {
			lyr = this.layersToQuery[l];
			if(lyr instanceof ol.layer.Vector) {
				ft = this.queryWFSLayer(lyr, selFt, evntParams);
				if (ft.length > 0 && this.getSkipOwsLayers()) {
					skip = true;
				}
				this.onSelect(ft, lyr);
			} else {
				if (skip) {
					this.onSelect();
				} else {
					this.queryWMSLayer(lyr, selFt, evntParams);
				}
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

		if(selFt instanceof ol.Feature) {
			selFt = geoJSON.writeFeatureObject(selFt);
		}

		var res = [];
		var lyrFts = layer.getSource().getFeatures();

		// Force feature loading from WFS server
		if(lyrFts.length == 0) {
			layer.getSource().loader_();
			lyrFts = layer.getSource().getFeatures();
		}

		var tfFts = geoJSON.writeFeaturesObject(lyrFts).features;

		for(var j = 0; j < tfFts.length; j++) {
			if(turf.intersect(tfFts[j], selFt)) {
				if(lyrFts[j].getProperties().features) {
					for(k = 0; k < lyrFts[j].getProperties().features.length; k++) {
						res.push(lyrFts[j].getProperties().features[k]);
					}
				} else {
					res.push(lyrFts[j]);
				}
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
			var size = this.getMap().getOlMap().getSize();
			var extent = this.getMap().getOlView().calculateExtent(size).join(",");
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
					feature_count: this.getLimit(),
					x: parseInt(xy[0]),
					y: parseInt(xy[1]),
					width: parseInt(size[0]),
					height: parseInt(size[1]),
					info_format: "application/vnd.ogc.gml",
					geometriefeature: "bounds",
					mod: "sheet",
					env: source.getParams().ENV
				},
				success: function(layer, response) {
					var features;
					var parser = new ol.format.WMSGetFeatureInfo();
					var parseOptions = {
						dataProjection: projCode,
						featureProjection: projCode
					};
					if(response.responseXML) {
						features = parser.readFeatures(response.responseXML, parseOptions);
					} else {
						features = parser.readFeatures(response.responseText, parseOptions);
					}
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

		/*
		var f = Ck.create("ol.format.WFS", {
			featureNS: "http://mapserver.gis.umn.edu/mapserver",
			featureType: ope.getLayers().split(",")
		});
		*/

		// Pass WMS ENV variables to WFS Query !
		var env = '';
		var filter = '';
		var wmsSrc = layer.get("sources").wms;
		if(Ext.isArray(wmsSrc)) {
			wmsSrc = wmsSrc[0];
			var p = wmsSrc.getParams() || {};
			var i = 0;

			// AGA - 28072020 - Update to catch SQLFILTER parameter of WMS
			for ([key, value] of Object.entries(p)) {
				if(key){
					if(key == 'ENV'){
						var env = '&ENV=' + value;
						i++;
					}else if (key == 'SQL_FILTER'){
						value = value.replace(/ /g, '%20').replace(/'/g, '%27').replace(/=/g, "%3D");
						var filter = '&SQL_QUERY=' + value;
						i++;
					}
				}
			}
			// AGA - End update

/* 			for(var i = 0 ; i < Object.keys(p).length ; i++){
				if(i !== 0){
					add = '&';
				}
				if(p.ENV){
					env = add + 'ENV=' + p.ENV;

				}else if (p.SQL_FILTER){
					filter = add + 'SQL_FILTER=' + p.SQL_FILTER
				}
			} */
		}
		//

		var f = new ol.format.WFS();
		var gf = f.writeGetFeature({
			srsName			: this.getMap().getProjection().getCode(),
			featureTypes	: ope.getLayers().split(","),
			geometryName	: layer.getExtension("geometryColumn"),
			count			: this.getLimit(),
			maxFeatures		: this.getLimit(),
			filter			: new ol.format.filter.Intersects(
				layer.getExtension("geometryColumn"),
				selFt.getGeometry(),
				this.getMap().getProjection().getCode()
			)
		});

		// Pre make reader options for readFeatures method
		var readOptions = {
			dataProjection: ope.getSrs(),
			featureProjection: this.getMap().getProjection().getCode()
		};

		// Allow add to current selection (Shift key by default)
		var modifiers = '';
		if(this.inAddition) {
			modifiers = "&modifiers="+this.getMergeKey();
		}
		//

		// Do the getFeature query
		Ck.Ajax.post({
			scope: this,
			url: this.getMap().getMapUrl(ope.getUrl()) + "?" + env + filter + modifiers,
			rawData: new XMLSerializer().serializeToString(gf),
			success: function(layer, ope, readOptions, response) {
				/*
				var ly, ns = {
					"http://mapserver.gis.umn.edu/mapserver": []
				};
				var lyr = ope.getLayers().split(",");
				// Fix Chinook 1 context prefix in getFeature response
				if(false && chinook1) {
					for(var i in lyr) {
						lyr[i] = lyr[i].split(":")[0];
					}
				} else {
					for(var i in lyr) {
						ly = lyr[i].split(":");
						if(ly.length > 1) {
							if(!Ext.isArray(ns[ly[0]])) {
								ns[ly[0]] = [];
							}
							ns[ly[0]].push(ly[ly.length - 1]);
						} else {
							ns["http://mapserver.gis.umn.edu/mapserver"].push(ly[ly.length - 1]);
						}
					}
				}

				var format, features = [];
				for(n in ns) {
					if(ns[n].length > 0) {
						format = Ck.create("ol.format.WFS", {
							featureNS: n,
							featureType: ns[n]
						});

						features = Ext.Array.merge(features, format.readFeatures(response.responseXML, readOptions));
					}
				}
				*/
				var format = new ol.format.WFS();
				var features = [];
				// Test if response is not an Exception
				if (response.responseText.indexOf('ExceptionReport') == -1) {
					features = format.readFeatures(response.responseXML, readOptions);
				}

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
			var sel;

			// Force number of features limitation
			if(this.getLimit() !== null && this.getLimit() > 0) {
				features = features.slice(0, this.getLimit());
			}

			// Look whether a selection has been made on the same layer
			for(var i = 0; ((i < this.selection.length) && Ext.isEmpty(sel)); i++) {
				if(this.selection[i] && this.selection[i].layer == layer) {
					sel = this.selection[i];
				}
			}

			// First selection for this layer
			if(Ext.isEmpty(sel)) {
				// Try to preserve layer order in response
				var pos = this.layersToQuery.indexOf(layer);
				if (pos != -1) {
					this.selection[pos] = {
						features: features,
						layer: layer
					};					
				}
			} else {
				var idx;
				for(var i = 0; i < features.length; i++) {
					//idx = sel.features.eIndexOf(features[i]);
					idx = Ck.eIndexOf(sel.features, features[i]);
					if(idx == -1) {
						sel.features.push(features[i]);
					} else {
						if(this.getDeselectOnClick()) {
							sel.features.splice(idx, 1);
						}
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

				// Add or remove (if unselect available) items
				for(var i = 0; i < features.length; i++) {
					//idx = selArray.eIndexOf(features[i]);
					idx = Ck.eIndexOf(selArray, features[i]);
					if(idx == -1) {
						selCollection.push(features[i]);
					} else {
						if(this.getDeselectOnClick()) {
							selCollection.removeAt(idx);
						}
					}
				}

				select.setActive(false);
			}
		}

		this.nbQueryDone++;

		if(this.nbQueryDone == this.nbQuery) {
			this.getMask().hide();
			// remove empty row
			this.selection = Ext.Array.clean(this.selection);

			this.getCallback()(this.selection);
		}
	},

	/**
	 * Set the draw style. Set to null to hide drawing.
	 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction/null}
	 */
	setDrawStyle: function(style) {
		if(Ext.isEmpty(style)) {
			this._drawStyle = Ck.Style.invisibleStyle;
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
			this._highlightStyle = Ck.Style.invisibleStyle;
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

		if(this.getHighlight()) {
			this.getSelect().getFeatures().clear()
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
