/**
 * Chinook measure interaction
 */
Ext.define('Ck.Measure', {
	statics: {
		getInstance: function(config) {
			config = Ext.applyIf(config || {}, this.prototype.config);
			
			var ckmap = config.map || Ck.getMap();
			var measure = ckmap.measure[config.id];
			if(!measure) {
				measure = new this(config);
				ckmap.measure[config.id] = measure;
			}
			return measure;
		}
	},

	config: {
		id: "default",

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
		 * Id for the layer storing the measurements
		 */
		layerId: "measureing-layer",

		/**
		 * The layer store measureings
		 * @var {ol.layer.Vector}
		 */
		layer: null,
		
		/**
		 * Allow snapping between measure
		 */
		snap: true,
		
		/**
		 * List of layer used for snapping
		 */
		layersSnapping: {},
		
		/**
		 * Message while layer features snapping is loading
		 */
		layersSnapMsg: "Snap features are loading...",

		/**
		 * Measure style. Set to null to hide measureing.
		 * @var {ol.style.Style/ol.style.Style[]/ol.style.StyleFunction}
		 */
		measureStyle: null,

		/**
		 * Measure interaction
		 * @var {ol.interaction.Measure}
		 */
		measure: null,
		
		/**
		 *
		 */
		geodesic: true,
		
		/**
		 * Set measure mode. metric, imperial or both
		 * @var {String|Array}
		 */
		mode: 'metric'
	},
	
	currentExtent: [],
	
	layerSnapping: null,
	
	measureSnapping: null,
	
	wgs84Sphere: new ol.Sphere(6378137),
	
	getSource: function() {
		return this.getLayer().getSource();
	},
	
	/**
	 * Define units and conversion for different mode
	 * @type {Object}
	 */
	units: {
		defaults: {
			decimal: 2
		},
		metric: {
			length: [{
				unit: 'm',
				max: 1000
			},{
				ratio: 1000,
				unit: 'km'
			}],
			area: [{
				unit: 'm<sup>2</sup>',
				max: 1000
			},{
				ratio: 10000,
				unit: 'ha',
				decimal: 4,
				max: 100
			},{
				ratio: 1000000,
				unit: 'km<sup>2</sup>'
			}]
		},
		imperial: {
			length: [{
				ratio: 0.3048,
				unit: 'ft',
				max: 5280
			},{
				ratio: 1609.344,
				unit: 'mi'
			}],
			area: [{
				ratio: 4046.8564224,
				unit: 'ac',
				max: 640
			},{
				ratio: 2589988.1,
				unit: 'mi<sup>2</sup>'
			}]
		}
	},

	constructor: function(config) {
		Ext.apply(config, {
			olMap : config.map.getOlMap(),
			measureStyle: Ck.Style.measureStyle
		});

		this.initConfig(config);

		this.setLayer(new ol.layer.Vector({
			id: this.getLayerId(),
			source: new ol.source.Vector(),
			style: this.getMeasureStyle()
		}));
		
		if(this.getSnap()) {
			this.measureSnapping = new ol.interaction.Snap({
			  source: this.getSource()
			});
			config.olMap.addInteraction(this.measureSnapping);
		}

		this.getMap().addSpecialLayer(this.getLayer());
		
		// Update snap
		this.getOlMap().getView().on("change:center", this.updateSnappingFeatures, this);
		this.getOlMap().getView().on("change:resolution", this.updateSnappingFeatures, this);
		
		this.snapFeatures = new ol.Collection();
		this.layerSnapping = new ol.interaction.Snap({features: this.snapFeatures});
		this.getOlMap().addInteraction(this.layerSnapping);
		
		// Create the mask
		this.mask = new Ext.LoadMask({
			msg: this.getLayersSnapMsg(),
			target: this.getMap().getView()
		});
	},
	
	updateMeasureSnapping: function() {
		if(this.getSnap()) {
			this.getOlMap().removeInteraction(this.measureSnapping);
			this.getOlMap().addInteraction(this.measureSnapping);
		}
	},
	
	updateLayerSnapping: function() {
		this.getOlMap().removeInteraction(this.layerSnapping);
		this.getOlMap().addInteraction(this.layerSnapping);
	},

	/**
	 * Handle pointer move.
	 * @param {ol.MapBrowserEvent} evt
	 */
	pointerMoveHandler: function(evt) {
		if (evt.dragging) {
			return;
		}

		var tooltipCoord = evt.coordinate;

		if (this.sketch) {
			var output;
			var geom = (this.sketch.getGeometry());
			if (geom instanceof ol.geom.Polygon) {
				output = this.formatArea(geom);
				tooltipCoord = geom.getInteriorPoint().getCoordinates();
			} else if (geom instanceof ol.geom.LineString) {
				output = this.formatLength(geom);
				tooltipCoord = geom.getLastCoordinate();
			}else if (geom instanceof ol.geom.Circle) {
				output = this.formatLength(geom);
				//tooltipCoord = geom.getLastCoordinate();
			}
			this.measureTooltipElement.innerHTML = output;
			this.measureTooltip.setPosition(tooltipCoord);
		}
	},

	/**
	 * Creates a new measure tooltip
	 */
	createMeasureTooltip: function() {
		if (this.measureTooltipElement) {
			this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
		}
		this.measureTooltipElement = document.createElement('div');
		this.measureTooltipElement.className = 'tooltip tooltip-measure';
		this.measureTooltip = new ol.Overlay({
			element: this.measureTooltipElement,
			offset: [0, -15],
			positioning: 'bottom-center'
		});
		this.getOlMap().addOverlay(this.measureTooltip);
	},
	
	/**
	 * Format length measurement label
	 * @param {ol.geom.LineString} line
	 * @return {string}
	 */
	formatLength: function(geom) {
		// raw length in meters
		var length, coordinates;
		if (this.getGeodesic()) {
			if(geom instanceof ol.geom.Circle) {
				coordinates = [geom.getCenter(), geom.getLastCoordinate()];
			} else {
				coordinates = geom.getCoordinates();
			}

			length = 0;
			var sourceProj = this.getOlMap().getView().getProjection();
			for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
				var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
				var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
				length += this.wgs84Sphere.haversineDistance(c1, c2);
			}
		} else {
			if(geom instanceof ol.geom.Circle) {
				length = geom.getRadius();
			} else {
				length = geom.getLength();
			}
		}

		var output = [], decimal, uLength;

		var mode = this.getMode();
		if(Ext.isString(mode) && !this.units[mode]) {
			Ck.log("Enable to get mode '"+ mode +"' for units, use default 'metric' mode.");
			mode = 'metric';
		}

		for (var uMode in this.units) {
			if (uMode==='defaults') continue;
			if (Ext.isString(mode) && uMode !== mode) continue;

			var units = this.units[uMode]['length'];
			for (var i = 0; i < units.length; i++) {
				var u = units[i];

				decimal = u.decimal || this.units.defaults.decimal;
				uLength = length;

				// Conversion from meters to Unit
				if (u.ratio) {
					uLength = uLength / u.ratio
				}
				// Test if need to pass next Unit
				if (u.max && uLength > u.max) {
					continue;
				}

				// Format result
				output.push( uLength.toFixed(decimal) + ' ' + u.unit );
				break;
			}
		}

		return output.join('<br>');
	},

	/**
	 * Format area measurement label
	 * @param {ol.geom.Polygon} polygon
	 * @return {string}
	 */
	formatArea: function(polygon) {
		// raw area in square meters
		var area;
		if (this.getGeodesic()) {
			var sourceProj = this.getOlMap().getView().getProjection();
			var geom = polygon.clone().transform(sourceProj, 'EPSG:4326');
			if(geom instanceof ol.geom.Circle) {
				area = (Math.PI * Math.pow(geom.getRadius(), 2) * 10000000000);
			} else {
				var coordinates = geom.getLinearRing(0).getCoordinates();
				area = Math.abs(this.wgs84Sphere.geodesicArea(coordinates));
			}
		} else {
			area = polygon.getArea();
		}

		var output = [], decimal, uArea;

		var mode = this.getMode();
		if(Ext.isString(mode) && !this.units[mode]) {
			Ck.log("Enable to get mode '"+ mode +"' for units, use default 'metric' mode.");
			mode = 'metric';
		}

		for (var uMode in this.units) {
			if (uMode==='defaults') continue;
			if (Ext.isString(mode) && uMode !== mode) continue;

			var units = this.units[uMode]['area'];
			for (var i = 0; i < units.length; i++) {
				var u = units[i];

				decimal = u.decimal || this.units.defaults.decimal;
				uArea = area;

				// Conversion from square meters to Unit
				if (u.ratio) {
					uArea = uArea / u.ratio
				}
				// Test if need to pass next Unit
				if (u.max && uArea > u.max) {
					continue;
				}

				// Format result
				output.push( uArea.toFixed(decimal) + ' ' + u.unit );
				break;
			}
		}

		return output.join('<br>');
	},
	
	/**
	 * Save sketch at measure start
	 */
	measureStart: function(evt) {
		this.sketch = evt.feature;
	},
	
	/**
	 * Create the permanent label for the measurement taken 
	 */
	measureEnd: function(evt) {
		this.measureTooltipElement.className = 'tooltip tooltip-static';
		this.measureTooltip.setOffset([0, -7]);

		// associate the overlay to the feature and remove it when feature is removed
		evt.feature.set('overlay', this.measureTooltip);
		this.getSource().on('removefeature', function(evt) {
			this.getOlMap().removeOverlay(evt.feature.get('overlay'));
		}, this);

		// unset sketch
		this.sketch = null;

		// unset tooltip so that a new one can be created
		this.measureTooltipElement = null;
		this.createMeasureTooltip();
	},
	
	/**
	 * Remove tooltip
	 */
	clearTooltip: function() {
		if(this.measureTooltip) {
			this.getOlMap().removeOverlay(this.measureTooltip);
		}	
	},
	
	/**
	 * Remove all measures
	 */
	clearMeasure: function() {
		this.getSource().clear();
	},
	
	/**
	 * Loop on layers used for snapping to load features for the current extent
	 */
	updateSnappingFeatures: function() {
		// Avoid multiple call execution
		if(this.lyrToLoad > 0) {
			return false;
		}
		
		var sl, lyrs = this.getLayersSnapping();
		var ex = this.getMap().getExtent();
		
		this.snapFeatures.clear();
		
		// First pass to know if a mask should be displayed 
		var nbLyrSnap = 0;
		for(var id in lyrs) {
			if(lyrs[id].snap) {
				nbLyrSnap++;
			}
		}
		
		if(nbLyrSnap > 0) {
			this.lyrToLoad = 0;

			// Load all snapping features
			for(var id in lyrs) {
				l = lyrs[id];
				if(l.snap) {
					if(!l.source) {
						sl = l.layer.get("sources").wfs[0];
						l.source = new ol.source.Vector({
							url : function(ext) {
								return sl.getUrl() + "&BBOX=" + ext.join(",");
							},
							format: sl.getFormat(),
							strategy: ol.loadingstrategy.bbox
						});
						
						// Replace loader to add action on load start (no event for it !?)
						l.source.originLoader = l.source.loader_;
						l.source.loader_ = function() {
							this.loadSnappingFeaturesStart()
							l.source.originLoader.apply(l.source, arguments);
						}.bind(this);
						
						l.source.on("change", this.loadSnappingFeaturesDone, this);
					}
					
					// Perform getFeatures if they have not been loaded
					if(!l.source.isExtentsLoaded([ex])) {
						l.source.loadFeatures(ex);
					} else {
						this.snapFeatures.extend(l.source.getFeatures());
					}
				}
			}
		}
	},
	
	/**
	 * Display the mask for first loading start
	 */
	loadSnappingFeaturesStart: function() {
		if(this.lyrToLoad++ == 0) {
			// Display mask
			this.mask.show();
		}
	},
	
	/**
	 * Add feature to snapping collection.
	 * Hide the mask when all loadings end
	 */
	loadSnappingFeaturesDone: function(evt) {
		this.snapFeatures.extend(evt.target.getFeatures());
		
		if(--this.lyrToLoad == 0) {
			// Refresh snap interaction
			this.updateLayerSnapping();
			
			// Hide mask
			this.mask.hide();
		}
	}
});
