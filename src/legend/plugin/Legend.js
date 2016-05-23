/**
 * Legend for layer. Use getLegendGraphic to get image
 */
Ext.define('Ck.legend.plugin.Legend', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendgraphic',

	init: function(cmp) {
		cmp.on({
			itemclick: this.onItemmousedown,
			itemremove: this.onItemremove,
			scope: this
		});
	},
	
	onItemmousedown: function(tree, record, item, index, e, eOpts ) {
		var layer = record.get('layer');
		if(layer && record.isLeaf() && !Ext.String.startsWith(e.target.className.trim(), "x-action") && !Ext.String.startsWith(e.target.className.trim(), "x-tree-checkbox")) {
			
			var legend = record.get('legend');
			if(legend && legend.getEl().dom && Ext.get(legend.getEl().dom.id)) {
				legend.setVisible(legend.hidden);
			} else {
				if(layer.ckLayer.getOffering("wms")) {
					legend = this.createWmsLegendGraphic(layer, item);
				} else if(layer.ckLayer.getOffering("wfs") || layer.ckLayer.getOffering("geojson")) {
					legend = this.createLegendGraphicFromStyle(layer, item);
				}
				
				if(Ext.isEmpty(legend)) {
					return false;
				}
				
				legend.getEl().dom.addEventListener("error", this.interceptError.bind(this));
				record.set('legend', legend);
			}
		}
	},
	
	onItemremove: function(root, record) {
		// After drag&drop the slider reference is wrong, need to rebuild
		record.set('legend', false);
	},
	
	interceptError: function(el) {
		el.target.setAttribute("hidden", true);
	},
	
	createWmsLegendGraphic: function(layer, item) {
		return Ext.create('Ext.Img', {
			src: Ck.getApi() + "service=wms&request=getLegendGraphic&layers=" + layer.get("id"),
			renderTo: item,
			alt: "No legend available",
			style: {
				marginLeft: '5%',
				marginRight: '5%'
			}
		});
	},
	
	createLegendGraphicFromStyle: function (layer, item) {
		var layerId = layer.ckLayer.getId();
		var style = Ck.map.Style.layerStyles[layerId];		
		var svg = null;
		var image = null;
		
		if(Ext.isEmpty(style) || (!(style instanceof Object) && style.length == 0)) {
			return null;
		}	
		
		if(style instanceof Array) {
			svg = this.createFromExistingStyle(style);
		} else if(style instanceof Object) {
			svg = this.createFromFunction(style);			
		}
		
		image = Ext.create('Ext.container.Container', {
			renderTo: item,
			alt: "No legend available",
			html: svg,
			style: {
				marginLeft: '5%',
				marginRight: '5%'
			}
		});
		
		return image;
	},
	
	createFromFunction: function(styles) {
		var arrayValues = styles.classes;
		var svgArr = [];		
		
		for(var i in arrayValues) {
			var el = arrayValues[i];
			var style = el.style;
			var classe = el.classe;
			style.label = classe.label || classe.value;
			var currSvg = this.createFromExistingStyle(style);
			
			svgArr.push(currSvg);
		}
		
		return svgArr.join("<br/>");
	},
	
	createFromExistingStyle: function(style) {
		var svg = null;
		var geometryType = style.geometryType;
		var label = style.label;
		style = style[0];
		
		switch(geometryType) {
			case "Polygon":
			case "MultiPolygon":
				svg = this.getPolygonThumb(style);
				break;
			
			case "LineString":
			case "MultiLineString":
				svg = this.getLineStringThumb(style);
				break;
				
			case "Point":
			case "MultiPoint":
				svg = this.getPointThumb(style);
				break;
				
			default:
				break;
		}
		
		if(!Ext.isEmpty(label)) {
			svg += "<span class=\"legendGraphicLabel\">" + label + "</span>";
		}
		
		return svg;
	},
	
	getPolygonThumb: function(style) {
		var fillColor = style.getFill().getColor();
		var stroke = style.getStroke();
		var strokeWidth = stroke.getWidth();
		var strokeColor = stroke.getColor();
		
		var strSvg = "<svg height=\"15px\" width=\"30px\" class=\"layerThumb\">";
		strSvg += "	<rect width=\"30px\" height=\"15px\" style=\"fill:rgba(0, 0, 0, 0);stroke-width:1;stroke:rgb(0,0,0)\" />";
		strSvg += "	<polygon points=\"15,3 25,8 15,12 10,12 10,5\" style=\"fill:" + fillColor + ";stroke:" + strokeColor +";stroke-width:" + strokeWidth + "\" />";
		strSvg += "</svg>";
		
		return strSvg;
	},
	
	getLineStringThumb: function(style) {
		var stroke = style.getStroke();
		var strokeWidth = stroke.getWidth();
		var strokeColor = stroke.getColor();
		
		var strSvg = "<svg height=\"15px\" width=\"30px\" class=\"layerThumb\">";
		strSvg += "	<rect width=\"30px\" height=\"15px\" style=\"fill:rgba(0, 0, 0, 0);stroke-width:1;stroke:rgb(0,0,0)\" />";
		strSvg += "	<polyline points=\"6,10 12,6 18,10 26,4\" style=\"fill:white;stroke:" + strokeColor +";stroke-width:" + strokeWidth + "\" />";
		strSvg += "</svg>";
		
		return strSvg;
	},
	
	getPointThumb: function(style) {
		var style = style.getImage();
		var fillColor = style.getFill().getColor();
		var stroke = style.getStroke();
		var strokeWidth = stroke.getWidth();
		var strokeColor = stroke.getColor();
		var radius = style.getRadius();
		
		var strSvg = "<svg height=\"15px\" width=\"30px\" class=\"layerThumb\">";
		strSvg += "	<rect width=\"30px\" height=\"15px\" style=\"fill:rgba(0, 0, 0, 0);stroke-width:1;stroke:rgb(0,0,0)\" />";
		strSvg += "	<circle cx=\"15\" cy=\"7.5\" r=\"" + radius + "\" stroke=\"" + strokeColor + "\" stroke-width=\"" + strokeWidth + "\" fill=\"" + fillColor + "\" />";
		strSvg += "</svg>";
		
		return strSvg;
	}
});
