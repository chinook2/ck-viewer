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
	 * Default width. Typically for stroke
	 */
	defaultWidth: 2,

	/**
	 * Default colors
	 */
	color: {
		lightGray: "rgba(255, 255, 255, 0.2)",
		gray: "rgba(255, 255, 255, 0.4)",
		red: "#ff3333",
		green: "#33cc33",
		blue: "#3399cc",
		orange: "#ff953d"
	},
	
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
		color: "#ff953d",
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
		drawLayer		: 499,
		editInteraction	: 500,
		cloneLayer		: 520,
		featureOverlay	: 540,
		vertexOverlay	: 560,
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
					color: '#333',
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
	getStyleFromConfig: function(config, layerId, ignoreThisStyles) {
		var styles = [];
		var thisLayerStyles = [];
		
		if(ignoreThisStyles === undefined) {
			var ignoreThisStyles = true;
		}		
		
		if(!Ext.isEmpty(config)) {		
			var style = null;
			
			if(!Ext.isEmpty(config.method)) {
				// return this.getFunctionFromConfig(layerId, config);
				style = this.getFunctionFromConfig(layerId, config);
				styles = style;
				ignoreThisStyles = true;
			} else {
				switch(config.type) {
					case "Polygon":
					case "MultiPolygon":
						var fillColor = config.fill;
						var strokeColor = config.stroke;
						var strokeWidth = config.width;
						
						style = new ol.style.Style({
							fill: new ol.style.Fill({
								color: fillColor
							}),
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: strokeWidth
							})
						});
						
						break;
					
					case "LineString":
					case "MultiLineString":
						var strokeColor = config.stroke;
						var strokeWidth = config.width;
						
						style = new ol.style.Style({						
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: strokeWidth
							})
						});
						
						break;
						
					case "Point":
					case "MultiPoint":
						var fillColor = config.fill;
						var radius = config.radius;
						var strokeColor = config.stroke;
						var strokeWidth = config.width;
						
						switch(config.shape) {
							case "regular":
								var shapeConf = {
									fill: new ol.style.Fill({
										color: fillColor
									}),
									radius: radius,
									stroke: new ol.style.Stroke({
										color: strokeColor,
										width: strokeWidth
									})
								};
								
								if(config.radius1) shapeConf.radius1 = config.radius1;
								if(config.radius2) shapeConf.radius2 = config.radius2;
								if(config.points) shapeConf.points = config.points;
								if(config.angle) shapeConf.angle = config.angle;
								if(config.rotation) shapeConf.rotation = config.rotation;
								
								style = new ol.style.Style({
									image: new ol.style.RegularShape(shapeConf)
								});
								
								break;
								
							case "circle":
							default:							
								style = new ol.style.Style({
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
								});
								
								break;
						}
				
						break;						
						
					default:
						style = Ck.map.Style.style;
						config.type = "Polygon";
						break;
				}			
						
				thisLayerStyles.push(style);
				
				if(config.labelStyle) {
					styles = this.getLabelStyleFunction(style, config.labelStyle, layerId);
				} else {
					styles.push(style);
				}

				styles.geometryType = config.type;
				thisLayerStyles.geometryType = config.type;
		
				if(config.label) {
					styles.label = config.label;
					thisLayerStyles.label = config.label;
				}
			}
		} else {
			var style = Ck.map.Style.style;
			style.geometryType = "Polygon";
			styles = style;
			thisLayerStyles = style;
		}
		
		if(!Ext.isEmpty(layerId) && ignoreThisStyles === false) {
			this.layerStyles[layerId] = thisLayerStyles;
		}
		
		return styles;
	},
	
	/**
	*	Generate function from config for vector layers
	*/
	getFunctionFromConfig: function(layerId, config) {
		var fn = {};
		
		switch(config.method) {
			case "classes": // Classes from attributes values
				fn = this.getClassesFunction(config);
				break;
			case "attributes": // Style from attributes values
				fn = this.getAttributesFunction(config);
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
		var arrayValues = [];
		
		for(var i=0; i<config.classes.length; i++) {
			var classe = config.classes[i];
			classe.type = config.type;
			
			arrayValues[classe.value] = {
				style: this.getStyleFromConfig(classe),
				classe: classe
			};
		}
		
		var fn = function(feature, resolution) {
			var style = null;
			var value = feature.get(config.property);
			
			if(Ext.isEmpty(value)) {
				value = "";
			}
			
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
	},
	
	/**
	*	Generate function from config to style vector layers from their attributes
	*/
	getAttributesFunction: function(config) {
		var arrayValues = [];
		var thisRef = this;
		
		var attributesConfig = {
			type: undefined,
			// fill: "#FFFFFF",
			fill: "rgba(255, 255, 255, 0)",
			// stroke: "#000000",
			stroke: "rgba(0, 0, 0, 1)",
			radius: 5,
			width: 2
		};		
						
		var fn = function(feature, resolution) {
			var geom = feature.getGeometry();
			
			var styleConfig = {
				type: geom.getType(),
				fill: feature.get(config.properties.fill),
				stroke: feature.get(config.properties.stroke),
				radius: feature.get(config.properties.radius),
				width: feature.get(config.properties.width)
			}
			
			styleConfig = Ext.applyIf(styleConfig, attributesConfig);
			
			return thisRef.getStyleFromConfig(styleConfig);
		};
		
		return {
			styleFunction: fn,
			method: "attributes",
			defaultConfig: attributesConfig,
			attributesConfig: config.properties,
			classes: []
		};
	},

	/**
	*	Generate function from config to style vector layers with normal style + label style
	*/
	getLabelStyleFunction: function(style, labelStyleConfig, layerId) {
		var fillColor = labelStyleConfig.fill || "#000";
		var color = labelStyleConfig.color || "rgba(0, 0, 0, 1)";
		var strokeColor = labelStyleConfig.stroke || "#fff";
		var strokeWidth = labelStyleConfig.width || 2;
		var property = labelStyleConfig.property;
		var font = labelStyleConfig.font || "12px helvetica,sans-serif";	
		var minResolution = labelStyleConfig.resolution || Infinity;
		
		var fn = function(feature, resolution) {
			var styles = [style];			
			var template = labelStyleConfig.template;
			if(resolution <= minResolution) {
				if(property){
					
					var labelStyle = new ol.style.Style({
						text: new ol.style.Text({
							font: font,
							color: color,
							text: feature.get(property),
							fill: new ol.style.Fill({
								color: fillColor
							}),
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: strokeWidth
							})
						})
					});
				} else if (template){					
						
					var coordinates = [];
					var newProjection = new ol.proj.Projection({code: "EPSG:4326"});
					
					var currentLayer = Ck.getMap().getLayerById(layerId);		
					var currentProjection = new ol.proj.Projection({code: currentLayer.ckLayer.getOfferings()[0].getOperations()[0].getSrs()});
					
					var clonedGeometry = feature.getGeometry().clone();
					clonedGeometry.transform(currentProjection, newProjection);
					
					var polyArea = 0;	
					
					console.log(feature.getProperties());
					for(var feat in feature.getProperties()){
						template = template.replace("{"+ feat +"}", feature.get(feat));
					
					}					
					
					polyArea = Math.abs(ol.sphere.getArea(clonedGeometry));
					template = template.replace("{geom_area}", polyArea.toFixed(2));
					
					var labelStyle = new ol.style.Style({
						text: new ol.style.Text({
							font: font,
							color: color,
							text: template,
							fill: new ol.style.Fill({
								color: fillColor
							}),
							stroke: new ol.style.Stroke({
								color: strokeColor,
								width: strokeWidth
							})
						})
					});

				}
				styles.push(labelStyle);
			}
			
			return styles;
		};
		
		return fn;
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

/**
 * Gray
 */
Ck.Style.grayFill = [
	new ol.style.Style({ 
		fill: new ol.style.Fill({ color: Ck.Style.color.gray }) 
	})
];
Ck.Style.lightGrayFill = [
	new ol.style.Style({ 
		fill: new ol.style.Fill({ color: Ck.Style.color.lightGray} )
	})
];

/**
 * Red
 */
Ck.Style.redStroke = [
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

/**
 * Green
 */
Ck.Style.greenStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke(Ck.Style.greenStroke),
			radius: Ck.map.Style.minorRadius
		}),
		stroke: new ol.style.Stroke(Ck.Style.greenStroke)
	})
];
Ck.Style.greenCircle = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke({ color: Ck.Style.color.green, width: Ck.Style.defaultWidth }),
			radius: Ck.Style.minorRadius
		})
	})
];

/**
 * 
 */
Ck.Style.orangeStroke = [
	new ol.style.Style({
		image: new ol.style.Circle({
			stroke: new ol.style.Stroke(Ck.map.Style.selectStroke),
			radius: Ck.map.Style.minorRadius
		}),
		stroke: new ol.style.Stroke(Ck.map.Style.selectStroke)
	})
];

/**
 * Here is defined the directly used styles
 */
Ck.Style.invisibleStyle = [];
//Ck.Style.drawStyle = [Ck.Style.greenStroke, Ck.Style.greenCircle, Ck.Style.grayFill];