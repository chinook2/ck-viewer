/**
 * Define default style for vector layer...
 * Predefine style are :
 *  - ol.style.defaultStyleFunction
 *  - ol.style.createDefaultEditingStyles
 *  - Ck.map.Style.style			: Default OL blue style
 *  - Ck.map.Style.red				: Red stroke without fill
 *  - Ck.map.Style.green			: Green stroke without fill
 *  - Ck.map.Style.orange			: Pretty similar to Style.style but with an orange stroke
 *  - Ck.map.Style.invisibleStyle	: Invisible style
 */
Ext.define('Ck.map.Style', {
	alternateClassName: 'Ck.Style',
	singleton: true,
	
	/**
	 * Default width. Typically for stroke
	 */
	defaultWidth: 2,
	
	/**
	 * Default colors
	 */
	color: {
		gray	: "rgba(255, 255, 255, 0.4)",
		blue	: "#3399CC",
		red		: "#FF3333",
		green	: "#33cc33",
		orange	: "#FF953D"
	},
	
	/**
	 * Default radius
	 */
	radius: {
		small	: 3,
		medium	: 5,
		big		: 10
	},
	
	/**
	 * Default Z-Index
	 */
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
 * Gray
 */
Ck.Style.grayFill = new ol.style.Style({fill: new ol.style.Fill({color: Ck.Style.color.gray})});

/**
 * Red
 */
Ck.Style.redStroke = new ol.style.Style({stroke: new ol.style.Stroke({color: Ck.Style.color.red, width: Ck.Style.defaultWidth})});
Ck.Style.redShape = new ol.style.Style({
	image: new ol.style.RegularShape({
		points: 4,
		stroke: new ol.style.Stroke({color: Ck.Style.color.red, width: Ck.Style.defaultWidth}),
		radius: Ck.Style.radius.big,
		angle: 0.785398
	})
});

/**
 * Green
 */
Ck.Style.greenStroke = new ol.style.Style({stroke: new ol.style.Stroke({color: Ck.Style.color.green, width: Ck.Style.defaultWidth})});
Ck.Style.greenCircle = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: Ck.Style.color.green, width: Ck.Style.defaultWidth}),
		radius: Ck.Style.radius.medium
	})
});

/**
 * Orange
 */
Ck.Style.orangeStroke = new ol.style.Style({stroke: new ol.style.Stroke({color: Ck.Style.color.orange, width: Ck.Style.defaultWidth})});
Ck.Style.orangeCircle = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: Ck.Style.color.orange, width: Ck.Style.defaultWidth}),
		radius: Ck.Style.radius.medium
	})
});

/**
 * Blue
 */
Ck.Style.blueStroke = new ol.style.Style({stroke: new ol.style.Stroke({color: Ck.Style.color.blue, width: Ck.Style.defaultWidth})});
Ck.Style.blueCircle = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: Ck.Style.color.blue, width: Ck.Style.defaultWidth}),
		radius: Ck.Style.radius.medium
	})
});


/**
 * Here is defined the directly used styles
 */
Ck.Style.invisibleStyle = [];
Ck.Style.deleteStyle = [Ck.Style.redStroke, Ck.Style.redShape];
Ck.Style.vertexStyle = [Ck.Style.redStroke, Ck.Style.redShape];
Ck.Style.drawStyle = [Ck.Style.greenStroke, Ck.Style.greenCircle, Ck.Style.grayFill];
Ck.Style.importStyle = [Ck.Style.blueStroke, Ck.Style.blueCircle];
