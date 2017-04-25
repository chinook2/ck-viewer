/**
 * Base class for measure actions.
 *
 * See : Ck.map.action.measure.Length, Ck.map.action.measure.Area ...
 *
 * Code from : http://openlayers.org/en/master/examples/measure.html?q=measure
 */
Ext.define('Ck.map.action.Measure', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapMeasure',

	itemId: 'measure',
	text: '',
	iconCls: 'ckfont ck-measures',
	tooltip: '',

	toggleGroup: 'ckmapAction',

	/**
	 * The type of the measure :
	 *
	 *  - length
	 *  - area
	 *  - radius
	 *  - ...
	 */
	type: 'length',

	/**
	 * Allow snapping between measure
	 */
	snap: true,

	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */
	sketch: null,

	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	measureTooltipElement: null,

	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	measureTooltip: null,

	helpMessages: {
		/**
		 * Message to show when the user start measure.
		 */
		startMsg : 'Click to start measuring (shift and hold click for free measure)',

		/**
		 * Message to show when the user is measuring.
		 */
		continueMsg: 'Click to continue measuring'
	},

	/**
	 * Set measure mode. metric, imperial or both...
	 * @type {String|Array}
	 */
	 mode: 'metric',
	 //mode: ['metric', 'imperial'],

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

	/**
	 *
	 */
	geodesic: true,

	draw: null,

	/**
	 * Button associate with this action
	 */
	btn: null,

	/**
	 * Measure type -> vector type association
	 */
	typeAssoc: {
		area: "Polygon",
		length: "LineString",
		radius: "Circle"
	},

	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();

		this.measureLayer = map.getLayerById('measureLayer');
		if(!this.measureLayer) {
			this.measureLayer = new ol.layer.Vector({
				id: 'measureLayer',
				source:  new ol.source.Vector(),
				style: Ck.Style.measureStyle
			});
			map.addSpecialLayer(this.measureLayer);
		}

		var source = this.measureLayer.getSource();


		this.type = this.initialConfig.type || this.type;
		if(this.type) {
			var gtype = this.typeAssoc[this.type];

			this.draw = new ol.interaction.Draw({
				source: source,
				type: gtype,
				style: new ol.style.Style({
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					}),
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 0, 0.5)',
						lineDash: [10, 10],
						width: 2
					}),
					image: new ol.style.Circle({
						radius: 5,
						stroke: new ol.style.Stroke({
							color: 'rgba(0, 0, 0, 0.7)'
						}),
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 255, 0.2)'
						})
					})
				})
			});
			this.olMap.addInteraction(this.draw);
			this.draw.setActive(false);

			this.createMeasureTooltip();

			this.draw.on('drawstart', function(evt) {
				// set sketch
				this.sketch = evt.feature;
				this.setHelpMsg(this.helpMessages.continueMsg);
			}, this);

			this.draw.on('drawend', function(evt) {
				this.measureTooltipElement.className = 'tooltip tooltip-static';
				this.measureTooltip.setOffset([0, -7]);

				// associate the overlay to the feature and remove it when feature is removed
				evt.feature.set('overlay', this.measureTooltip);
				source.on('removefeature', function(evt) {
					this.olMap.removeOverlay(evt.feature.get('overlay'));
				}, this);

				// unset sketch
				this.sketch = null;
				this.setHelpMsg(this.helpMessages.startMsg);

				// unset tooltip so that a new one can be created
				this.measureTooltipElement = null;
				this.createMeasureTooltip();
			}, this);

			this.snap = this.initialConfig.snap || this.snap;
			if(this.snap) {
				this.olMap.addInteraction(new ol.interaction.Snap({
				  source: source
				}));
			}

			this.wgs84Sphere = new ol.Sphere(6378137);
		}
	},

	/**
	 *
	 */
	toggleAction: function(btn, pressed) {
		this.btn = btn;
		if(!this.draw) return;
		this.draw.setActive(pressed);
		if(this.tip) this.tip.setVisible(pressed);
		if(pressed) {
			if (!this.measureTooltipElement) {
				this.createMeasureTooltip();
			}

			this.olMap.on('pointermove', this.pointerMoveHandler, this);
			// fix for touch device
			this.olMap.on('singleclick', this.pointerMoveHandler, this);
			this.setHelpMsg(this.helpMessages.startMsg);
		} else {
			this.olMap.un('pointermove', this.pointerMoveHandler, this);
			this.olMap.un('singleclick', this.pointerMoveHandler, this);
			this.setHelpMsg(null);

			// Force clear tooltip if toggle off measure tool when drawing
			if (this.measureTooltip) {
				this.olMap.removeOverlay(this.measureTooltip);
			}
			this.measureTooltipElement = null;
			this.sketch = null;
		}
	},

	/**
	 *
	 */
	clearAll: function() {
		if(this.measureLayer) this.measureLayer.getSource().clear();
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
		this.olMap.addOverlay(this.measureTooltip);
	},


	/**
	 * format length output
	 * @param {ol.geom.LineString} line
	 * @return {string}
	 */
	formatLength: function(geom) {
		// raw length in meters
		var length, coordinates;
		if (this.geodesic) {
			if(geom instanceof ol.geom.Circle) {
				coordinates = [geom.getCenter(), geom.getLastCoordinate()];
			} else {
				coordinates = geom.getCoordinates();
			}

			length = 0;
			var sourceProj = this.olMap.getView().getProjection();
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

		var mode = this.mode;
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
	 * format length output
	 * @param {ol.geom.Polygon} polygon
	 * @return {string}
	 */
	formatArea: function(polygon) {
		// raw area in square meters
		var area;
		if (this.geodesic) {
			var sourceProj = this.olMap.getView().getProjection();
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

		var mode = this.mode;
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
	}
});
