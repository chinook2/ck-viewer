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
		
		/**
		 * The layers to use for snapping. Will be queryed to get nears features.
		 * @var {Object[]} Object with a "layer" and a "tolerance" member
		 */
		layers: null,
		
		/**
		 * Tolerance for snapping. In the units of the map.
		 */
		tolerance: 15,
		
		/**
		 * @var {ol.geom[]}
		 */
		geometries: []
	},
	
	constructor: function(config) {
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
		if(config instanceof ol.geom) {
			this.setCoordinates(config);
		} else {
			this.setConfig(config);
		}
		
		
		
		var extent = geometry.getExtent();

		// Récupération des features dans un buffer d'extent du feature
		var buffer = [
			extent[0] - this.getTolerance(),
			extent[1] - this.getTolerance(),
			extent[2] + this.getTolerance(),
			extent[3] + this.getTolerance()
		];

		var featuresInExtent = [];

		var coordinates = geometry.getCoordinates();
		var type = feature.getGeometry().getType();
		
		// By-pass snapping
		var f = new ol.Feature({
			geometry: Ck.create("ol.geom." + type, coordinates),
			status: "CREATED"
		});
	}
});