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
		 * The method to call when snapping ends. Receive a ol.geom
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
	 * @todo Manage array of geometries
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
	
	/**
	 * When all features next the geometry was requested, do the snapping.
	 */
	doSnap: function() {
 		var geom = this.currentGeom;
 		if(this.layerInBuffer.length > 0) {
 			var coords = geom.getCoordinates();
 			
			// Force MultiGeom structure
			if(geom.getType().indexOf("Multi") == -1) {
				coords = [coords];
			};
 			
			if(geom.getType().indexOf("Polygon") != -1) {
				coords = coords[0];
			};
 			
			var subgeom;
			// Loop on sub-geom (only once if we snap a simple geom)
			for(var sg = 0; sg < coords.length; sg++) {
				// Loop on vertex for polygon and line
				if(geom.getType().indexOf("Point") == -1) {
					for(var v = 0; v < coords[sg].length; v++) {
						coords[sg][v] = this.snapPoint(coords[sg][v]);
					}
				} else {
					coords[sg] = this.snapPoint(coords[sg]);
				}
			}
			
			if(geom.getType().indexOf("Multi") == -1) {
 				coords = coords[0];
 			}
 			
			if(geom.getType().indexOf("Polygon") != -1) {
				coords = [coords];
			}
			
			geom.setCoordinates(coords);
		}
		
		this.getCallback().call(this.getScope(), geom);
	},
	
	/** 
	 * Snap one vertex
	 * @param {ol.coordinate}
	 * @return {ol.coordinate}
	 */
	snapPoint: function(vtxCoord) {
		// Save layout
		var layout = vtxCoord.length;
		
		var trgProj = this.getProjection();
		var wgs84 = ol.proj.get("EPSG:4326");
		
		nearCoord = vtxCoord;
		if(!ol.proj.equivalent(trgProj, wgs84)) {
			vtxWGSCoord = ol.proj.transform(vtxCoord, trgProj, wgs84);
			nearCoord = vtxWGSCoord;
		}
		
		
		minDist = -1;
		var dist, bufCoord, features;
		// Loop on layer containing buffer
		for(var l = 0; l < this.layerInBuffer.length; l++) {
			features = this.layerInBuffer[l].features;
			// Loop on feature in buffer
			for(var f = 0; f < features.length; f++) {
				var g = features[f].getGeometry();
				
				if(g instanceof ol.geom.Point) {
					bufCoord = g.getCoordinates();
				} else {
					bufCoord = g.getClosestPoint(vtxCoord);
 				}
				
				if(!ol.proj.equivalent(trgProj, wgs84)) {
					bufCoord = ol.proj.transform(bufCoord, trgProj, wgs84);
 				}
 				
				dist = ol.sphere.WGS84.haversineDistance(bufCoord, vtxWGSCoord);
				
				if((minDist == -1 && dist <= this.layerTolerance[this.layerInBuffer[0].layer]) || dist < minDist) {
					minDist = dist;
					// Fix XYZ layout
					bufCoord.splice(2, 1);
					nearCoord = bufCoord;
				}
 			}
 		}
		
		if(!ol.proj.equivalent(trgProj, wgs84)) {
			vtxCoord = ol.proj.transform(nearCoord, wgs84, trgProj);
		}
		
		//Restore layout
		if(layout == 2 && vtxCoord.length == 3) {
			vtxCoord.splice(2, 1);
		}
		
		if(layout == 3 && vtxCoord.length == 2) {
			vtxCoord[2] = 0;
		}
		
		return vtxCoord;
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