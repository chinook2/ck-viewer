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
	
	style:null,
	
	zIndex: {
		editInteraction	: 500,
		cloneLayer		: 520,
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
	*	Backup of every layer styled loaded in the map
	*/
	layerStyles: [],
	
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
	},
	
	/**
	*	Generate style from config for vector layers
	*/
	getStyleFromConfig: function(config, layerId) {
		if(!Ext.isEmpty(config)) {
			var style = null;
			
			if(!Ext.isEmpty(config.method)) {
				return this.getFunctionFromConfig(layerId, config);
			}
			
			switch(config.type) {
				case "Polygon":
				case "MultiPolygon":
					var fillColor = config.fill;
					var strokeColor = config.stroke;
					var strokeWidth = config.width;
					
					style = [new ol.style.Style({
						fill: new ol.style.Fill({
							color: fillColor
						}),
						stroke: new ol.style.Stroke({
							color: strokeColor,
							width: strokeWidth
						})
					})];
					break;
				
				case "LineString":
				case "MultiLineString":
					var strokeColor = config.stroke;
					var strokeWidth = config.width;
					
					style = [new ol.style.Style({						
						stroke: new ol.style.Stroke({
							color: strokeColor,
							width: strokeWidth
						})
					})];
					break;
					
				case "Point":
				case "MultiPoint":
					var fillColor = config.fill;
					var radius = config.radius;
					var strokeColor = config.stroke;
					var strokeWidth = config.width;
					
					style = [new ol.style.Style({
						image: new ol.style.Circle({
							fill: new ol.style.Fill({
								color: fillColor
							}),
							radius: radius,
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: strokeWidth
							})
						})
					})];
					break;
					
				default:
					style = Ck.map.Style.style;
					config.type = "Polygon";
					break;
			}
			
			style.geometryType = config.type;
			
			if(config.label) {
				style.label = config.label;
			}
			
		} else {
			style = Ck.map.Style.style;
			style.geometryType = "Polygon";
		}
		
		if(!Ext.isEmpty(layerId)) {
			this.layerStyles[layerId] = style;
		}
		
		return style;
	},
	
	/**
	*	Generate function from config for vector layers
	*/
	getFunctionFromConfig: function(layerId, config) {
		var fn = {};
		
		switch(config.method) {
			case "classes":
				fn = this.getClassesFunction(config);
				break;				
			default:
				break;
		}
		
		this.layerStyles[layerId] = fn;
		return fn.styleFunction;
	},
	
	/**
	*	Generate classe function from config for vector layers
	*/
	getClassesFunction: function(config) {
		var thisref = this;
		var arrayValues = [];
		
		for(var i=0; i<config.classes.length; i++) {
			var classe = config.classes[i];
			classe.type = config.type;
			
			arrayValues[classe.value] = {
				style: thisref.getStyleFromConfig(classe),
				classe: classe
			};
		}
		
		var fn = function(feature, resolution) {
			var style = null;
			var value = feature.get(config.property);			
			var item = arrayValues[value];
			
			if(!Ext.isEmpty(item)) {
				style = item.style;
			}
			
			return style;
		};
		
		return {
			styleFunction: fn,
			method: "classes",
			classes: arrayValues
		};
	}
});

/**
 * Get default ol.style {Array} using Ck.map.Style.fill, Ck.map.Style.stroke and Ck.map.Style.radius properties.
 *
 * 	olStyle = Ck.map.Style.style;
 * 
 */
Ck.map.Style.style = [
	new ol.style.Style({
		image: new ol.style.Circle({
			fill: new ol.style.Fill(Ck.map.Style.fill),
			stroke: new ol.style.Stroke(Ck.map.Style.stroke),
			radius: 15
		}),
		fill: new ol.style.Fill(Ck.map.Style.fill),
		stroke: new ol.style.Stroke(Ck.map.Style.stroke)
	})
];

Ck.map.Style.redStroke = [
	new ol.style.Style({
		image: new ol.style.RegularShape({
			points: 4,
			stroke: new ol.style.Stroke(Ck.map.Style.redStroke),
			radius: Ck.map.Style.radius,
			angle: 0.785398
		}),
		stroke: new ol.style.Stroke(Ck.map.Style.redStroke)
	})
];

Ck.map.Style.greenStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke(Ck.map.Style.greenStroke),
			radius: Ck.map.Style.minorRadius
		}),
		stroke: new ol.style.Stroke(Ck.map.Style.greenStroke)
	})
];

Ck.map.Style.orangeStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke(Ck.map.Style.selectStroke),
			radius: Ck.map.Style.minorRadius
		}),
		stroke: new ol.style.Stroke(Ck.map.Style.selectStroke)
	})
];

Ck.map.Style.invisibleStyle = [];
