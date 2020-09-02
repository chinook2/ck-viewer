/**
 * Chinook draw interaction
 */
Ext.define('Ck.Draw', {
	config: {
		id: null,

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

		layerId: "drawing-layer",

		/**
		 * The layer store drawings
		 */
		layer: null,

		/**
		 *
		 */
		source: null,

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
		 * window
		 * @var {Ext.Window}
		 */
		win: null
	},

	statics: {
		getInstance: function(config) {
			var ckmap = config.map || Ck.getMap();
			var draw = (ckmap.draw && ckmap.draw.hasOwnProperty(config.id)) ? ckmap.draw[config.id] : null;
			if (!draw) {
				draw = new this(config);
				ckmap.draw[config.id] = draw;
			}
			return draw;
		}
	},

	/**
	 * [constructor description]
	 * @param  {[type]} config [description]
	 */
	constructor: function(config) {
		Ext.apply(config, {
			olMap : (config && config.map) ? config.map.getOlMap() : null,
			drawStyle: Ck.Style.orangeStyle,
			highlightStyle: Ck.Style.orangeStyle,
			highlightZIndex: Ck.Style.zIndex.editInteraction
		});

		this.initConfig(config);

		if (!config.map.draw) {
			config.map.draw = new ol.interaction.Select();
		}

		config.map.draw[config.id] = this;
		//config.map.addInteraction(config.map.draw);

		var source = new ol.source.Vector();
		localStorage.removeItem('shapes');
		localStorage.removeItem('shapesStyle');
		/*
		var geojsonObject = {
			'type': 'FeatureCollection',
			'crs': {
				'type': 'name'
			},
			'features':[]
		};
		geojsonObject = JSON.parse(localStorage.getItem("shapes")) || geojsonObject;
		var features = (new ol.format.GeoJSON()).readFeatures(geojsonObject);
		var source = new ol.source.Vector({
			features: features,
			format: new ol.format.GeoJSON()
		});
		var styles = JSON.parse(localStorage.getItem("shapesStyle")) || [];
		for(i = 0; i < features.length; i++) {
			if (styles[i]) {
				style = styles[i][0] || styles[i];
				switch (features[i].getGeometry().getType().toLowerCase()) {
					case 'point':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color: this.hexToRgb(this[key].color, this[key].opacity)
								}),
								radius: this[key].radius,
								stroke: new ol.style.Stroke({
									color: 'rgba(25, 25, 25, 0.9)',
									width: 1
								})
							})
						});
						break;

					case 'linestring':
					case 'line':
						style = new ol.style.Style({
							stroke: new ol.style.Stroke({
								color: this.hexToRgb(this[key].color, this[key].opacity),
								width: this[key].width
							})
						});
						break;

					case 'circle':
					case 'polygon':
						style = new ol.style.Style({
							image: new ol.style.Circle({
								fill: new ol.style.Fill({
									color: 'rgba(255,255,0,0.5)'
								}),
								radius: 5,
								stroke: new ol.style.Stroke({
									color: '#333', //'rgba(25, 25, 25, 0.9)'
									width: 1
								})
							}),
							fill: new ol.style.Fill({
								color: style.fill_.color_
							}),
							stroke: new ol.style.Stroke({
								color: style.stroke_.color_,
								width: style.stroke_.width_
							})
						});
						break;
				}
				features[i].setStyle([style]);
			} else {
				style = new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: 'rgba(255,255,0,0.5)'
						}),
						radius: 5,
						stroke: new ol.style.Stroke({
							color: '#333',
							width: 1
						})
					}),
					fill: new ol.style.Fill({
						color: 'rgba(0,255,255,0.5)'
					}),
					stroke: new ol.style.Stroke({
						color: '#0ff',
						width: 1
					})
				});
				features[i].setStyle(style);
			}
		}
*/
		var layer = new ol.layer.Vector({
			id: this.layerId,
			source: source,
			zIndex: Ck.Style.zIndex.drawLayer
			//style: Ck.Style.drawStyle
		});		

		layer.setMap(this.getOlMap());

		this.setLayer(layer);
		this.setSource(source);
	},

	/**
	 * [activeDraw description]
	 * @param  {[type]} type   [description]
	 * @param  {[type]} enable [description]
	 */
	activeDraw: function(type, enable) {
		// var interaction = this.getInteractions()[type];
		if (enable && this.win) {
			var items = this.win.query('#'+type);
			if (items[0]) {
				this.win.currentType = type;
				this.win.setActiveItem(items[0]);
			}
		} else {
			if (/modify/i.test(type)) {
				var items = this.win.query('#'+type);
				if (items[0]) {
					items[0].getDockedItems()[0].setVisible(false);
					items[0].setActiveItem(0);
				}
			}
		}
	}
});
