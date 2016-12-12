/**
 * Chinook draw interaction
 */
Ext.define('Ck.Draw', {
	statics: {
		getInstance: function(config) {
			var ckmap = config.map || Ck.getMap();
			var draw = ckmap.draw[config.id];
			if(!draw) {
				draw = new this(config);
				ckmap.draw[config.id] = draw;
			}
			return draw;
		}
	},

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
		draw: null
	},

	constructor: function(config) {
		Ext.apply(config, {
			olMap : config.map.getOlMap(),
			drawStyle: Ck.map.Style.orange,
			highlightStyle: Ck.map.Style.orange,
			highlightZIndex: Ck.map.Style.zIndex.editInteraction
		});

		this.initConfig(config);
		config.map.draw[config.id] = this;

		var source = new ol.source.Vector();

		var layer = new ol.layer.Vector({
			id: this.layerId,
			source: source,
			zIndex: Ck.map.Style.zIndex.drawLayer,
			style: Ck.Style.drawStyle
		});

		layer.setMap(this.getOlMap());

		this.setLayer(layer);
		this.setSource(source);
	},

	activeDraw: function(type, enable) {
		// var interaction = this.getInteractions()[type];

		// alert('active');
	}
});
