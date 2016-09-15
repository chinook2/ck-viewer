/**
 * Define default style for vector layer...
 * Predefine style are :
 *  - ol.style.defaultStyleFunction
 *  - ol.style.createDefaultEditingStyles
 *  - Ck.map.Style.style			: Default OL blue style
 *  - Ck.map.Style.redStroke		: Red stroke without fill
 *  - Ck.map.Style.greenStroke		: Green stroke without fill
 *  - Ck.map.Style.orangeStroke		: Pretty similar to Style.style but with an orange stroke
 *  - Ck.map.Style.invisibleStyle	: Invisible style
 */
Ext.define('Ck.map.Style', {
	alternateClassName: 'Ck.Style',
	singleton: true,
	
	defaultWidth	: 2,
	blueColor		: "#3399CC",
	redColor		: "#FF3333",
	greenColor		: "#33cc33",
	orangeColor		: "#FF953D",
	
	/**
	 * Default fill color.
	 */
	fill: {
		color: 'rgba(255,255,255,0.4)'
	},
	
	/**
	 * Default stroke color and width.
	 */
	stroke: {
		color: '#3399CC',
		width: 2
	},
	
	/**
	 * Default red stroke
	 */
	redStroke: {
		color: "#FF3333",
		width: 2
	},
	
	/**
	 * Default green stroke
	 */
	greenStroke: {
		color: "#33cc33",
		width: 2
	},
	
	/**
	 * Default select stroke color and width
	 */
	selectStroke: {
		color: "#FF953D",
		width: 2
	},
	
	/**
	 * Default minor radius.
	 */
	minorRadius: 6,
	
	/**
	 * Default radius.
	 */
	radius: 10,
	
	style: null,
	
	zIndex: {
		editInteraction	: 500,
		cloneLayer		: 520,
		drawLayer		: 530,
		featureOverlay	: 540,
		vertexOverlay	: 560
	},
	
	/**
	 * Default styles by type ([Multi]Point, [Multi]LineString, [Multi]Polygon).
	 */
	defaultStyles: {
		'Point': [new ol.style.Style({
			image: new ol.style.Circle({
				fill: new ol.style.Fill({
					color: 'rgba(255,255,0,0.5)'
				}),
				radius: 5,
				stroke: new ol.style.Stroke({
					color: '#ff0',
					width: 1
				})
			})
		})],
		'LineString': [new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#f00',
				width: 3
			})
		})],
		'Polygon': [new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(0,255,255,0.5)'
			}),
			stroke: new ol.style.Stroke({
				color: '#0ff',
				width: 1
			})
		})],
		'MultiPoint': [new ol.style.Style({
			image: new ol.style.Circle({
				fill: new ol.style.Fill({
					color: 'rgba(255,0,255,0.5)'
				}),
				radius: 5,
				stroke: new ol.style.Stroke({
					color: '#f0f',
					width: 1
				})
			})
		})],
		'MultiLineString': [new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#0f0',
				width: 3
			})
		})],
		'MultiPolygon': [new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(0,0,255,0.5)'
			}),
			stroke: new ol.style.Stroke({
				color: '#00f',
				width: 1
			})
		})]
	},
	
	/**
	 *
	 */
	styleFunction: function(feature, resolution) {
		var featureStyleFunction = feature.getStyleFunction();
		if (featureStyleFunction) {
			return featureStyleFunction.call(feature, resolution);
		} else {
			return Ck.map.Style.defaultStyles[feature.getGeometry().getType()];
		}
	}
});

/**
 * Get default ol.style {Array} using Ck.map.Style.fill, Ck.map.Style.stroke and Ck.map.Style.radius properties.
 *
 * 	olStyle = Ck.map.Style.style;
 * 
 */
Ck.Style.style = [
	new ol.style.Style({
		image: new ol.style.Circle({
			fill: new ol.style.Fill(Ck.Style.fill),
			stroke: new ol.style.Stroke({color: Ck.Style.blueColor, width: Ck.Style.defaultWidth}),
			radius: 15
		}),
		fill: new ol.style.Fill(Ck.Style.fill),
		stroke: new ol.style.Stroke({color: Ck.Style.blueColor, width: Ck.Style.defaultWidth})
	})
];

Ck.Style.redStroke = [
	new ol.style.Style({
		image: new ol.style.RegularShape({
			points: 4,
			stroke: new ol.style.Stroke({color: Ck.Style.redColor, width: Ck.Style.defaultWidth}),
			radius: Ck.Style.radius,
			angle: 0.785398
		}),
		stroke: new ol.style.Stroke({color: Ck.Style.redColor, width: Ck.Style.defaultWidth})
	})
];

Ck.Style.greenStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke({color: Ck.Style.greenColor, width: Ck.Style.defaultWidth}),
			radius: Ck.Style.minorRadius
		}),
		stroke: new ol.style.Stroke({color: Ck.Style.greenColor, width: Ck.Style.defaultWidth})
	})
];

Ck.Style.orangeStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke({color: Ck.Style.orangeColor, width: Ck.Style.defaultWidth}),
			radius: Ck.Style.minorRadius
		}),
		stroke: new ol.style.Stroke({color: Ck.Style.orangeColor, width: Ck.Style.defaultWidth})
	})
];

Ck.Style.invisibleStyle = [];
