/**
 * Utils to get snape point
 */
Ext.define('Ck.Snap', {
	singleton: true,
	
	config: {
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
		
		olView: null,
		
		/**
		 * The layers to use for snapping. Will be queryed to get nears features.
		 * @var {Object[]} Object with a "layer" and a "tolerance" member
		 */
		layers: null,
		
		/**
		 * Layer
		 * @var {ol.layer.Base}
		 */
		layer: null,
		
		/**
		 * Tolerance for snapping. In the units of the map.
		 */
		tolerance: 15,
		
		/**
		 * @var {ol.geom[]}
		 */
		geometries: [],
		
		/**
		 * Selection
		 * @param {Ck.Selection}
		 */
		selection: null,
		
		/**
		 * The method to call when snapping ends
		 * @var {Function}
		 */
		callback: Ext.emptyFn,
		
		/**
		 * The scope of the callback
		 */
		scope: null
	},
	
	layerTolerance: {},
	
	constructor: function(config) {
		Ext.on('ckmapReady', function(map) {
			this.setMap(map);
			this.setOlMap(map.getOlMap());
			this.setOlView(map.getOlView());
			this.setSelection(new Ck.Selection({
				callback	: this.layerQueried,
				scope		: this,
				type		: "Box",
				map			: map,
				highlight	: false,
				limit		: null
			}));

		}, this);
		this.initConfig(config);
    },
	
	/**
	 * @experimental
	 */
	liveSnapping: function() {
		layerToSnap = Ck.getMap().getLayerById("tag:tag");
		sourceToSnap = z.get("sources").wfs;
		interaction = new ol.interaction.Snap({
			source: sourceToSnap[0]
		});
		sourceToSnap[0].loadFeatures();
		Ck.getMap().getOlMap().addInteraction(interaction);

	},
	
	/**
	 * Query layers with current selection
	 * @param {Object}
	 * @return {ol.geom}
	 */
	snap: function(config) {
		if(Ext.isArray(config)) {
			this.setCoordinates(config);
		} else {
			this.setConfig(config);
		}
		
		var geom, geometries = this.getGeometries()
		var layer, layers = this.getLayers();
		
		// Loop on geometries
		for(var g = 0; g < geometries.length; g++) {
			this.currentGeom = geometries[g];
			var extent = this.currentGeom.getExtent();
			
			var select = this.getSelection();
			var layer, layers = this.getLayers();
			
			this.queriedLayers = 0;
			this.layerInBuffer = [];
			// Loop on used layers
			for(var l = 0; l < layers.length; l++) {
				layer = layers[l].layer;
				
				this.layerTolerance[layers[l].layer] = layers[l].tolerance;
				
				// Build a buffer from the geometry and the tolerance for this layer
				var buffer = [
					extent[0] - layers[l].tolerance,
					extent[1] - layers[l].tolerance,
					extent[2] + layers[l].tolerance,
					extent[3] + layers[l].tolerance
				];
				
				// Create a polygon feature from the buffer
				var bufferFeature = new ol.Feature({
					geometry: new ol.geom.Polygon([[[buffer[0], buffer[1]], [buffer[0], buffer[3]], [buffer[2], buffer[3]], [buffer[2], buffer[1]], [buffer[0], buffer[1]]]])
				});
				
				// Use Ck.Selection to get features in the buffer
				select.setLayers([layer]);
				select.processSelection({
					feature: bufferFeature
				});
				
			}
			
			
			

			
		}
	},
	
	layerQueried: function(feature) {
		this.queriedLayers++;
		
		if(feature[0]) {
			this.layerInBuffer.push(feature[0]);
		}
		
		if(this.queriedLayers == this.getLayers().length) {
			this.doSnap();
		}
	},
	
	doSnap: function() {
		var geom = this.currentGeom;
		if(this.layerInBuffer.length > 0) {
			var coords = geom.getCoordinates();
			
			var trgProj = this.getProjection();
			var wgs84 = ol.proj.get("EPSG:4326");
			
			var coords;
			
			// Multi
			// if(geom instanceof ol.geom.Polygon || geom instanceof ol.geom.LineString) {
				// coords = coords[0];
			// }
			if(geom instanceof ol.geom.Point) {
				coords = [coords]
			}
			
			var trgCoord, dist, bufCoord, nearCoord;
			// Loop on coord. Once if is a point, several times if polygon or line
			for(var c = 0; c < coords.length; c++) {
					
				trgCoord = coords[c];
				if(!ol.proj.equivalent(trgProj, wgs84)) {
					trgWGSCoord = ol.proj.transform(trgCoord, trgProj, wgs84);
				}
				
				
				minDist = -1;
				var features, nearCoord = trgWGSCoord;
				for(var l = 0; l < this.layerInBuffer.length; l++) {
				// Loop on feature in buffer
					features = this.layerInBuffer[l].features;
					for(var f = 0; f < features.length; f++) {
						var g = features[f].getGeometry();
						
						if(g instanceof ol.geom.Point) {
							bufCoord = g.getCoordinates();
						} else {
							bufCoord = g.getClosestPoint(trgCoord);
						}
						
						
						
						if(!ol.proj.equivalent(trgProj, wgs84)) {
							bufCoord = ol.proj.transform(bufCoord, trgProj, wgs84);
						}
						
						dist = ol.sphere.WGS84.haversineDistance(bufCoord, trgWGSCoord);
						
						if((minDist == -1 && dist <= this.layerTolerance[this.layerInBuffer[0].layer]) || dist < minDist) {
							minDist = dist;
							// Fix XYZ layout
							bufCoord.splice(2, 1);
							nearCoord = bufCoord;
						}
					}
				}
				
				if(!ol.proj.equivalent(trgProj, wgs84)) {
					nearCoord = ol.proj.transform(nearCoord, wgs84, trgProj);
				}
				
				coords[c] = nearCoord;
			}
			
			// Multi
			// if(geom instanceof ol.geom.Polygon || geom instanceof ol.geom.LineString) {
				// geom.setCoordinates([coords]);
			// }
			if(geom instanceof ol.geom.Point) {				
				geom.setCoordinates(coords[0]);
			}
		}
		this.getCallback().bind(this.getScope())(geom);

	},
	
	/**
	 * 
	 * @var {ol.proj}
	 */
	getProjection: function() {
		var proj, lyr = this.getLayer();
		
		if(lyr) {
			proj = lyr.getSource().getProjection();
		}
		if(Ext.isEmpty(proj)) {
			proj = this.getOlView().getProjection();
		}
		return proj;
	}
});