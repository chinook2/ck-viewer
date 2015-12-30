/**
 * 
 */
Ext.define('Ck.format.OWSContext', {
	alternateClassName: ['Ck.owc', 'Ck.Owc'],
	
	defaults: {
		srs: "EPSG:3857",
		extent: [-180,-90,180,90]
	},
	
	config: {
		extent		: null,
		projection	: null,
		scales		: null,
		resolutions	: null,
		layers		: []
	},
	
	requires: [
		'Ck.format.OWSContextLayer'
	],
	
	/**
	 * Constructor
	 * @params {Object}
	 */
	constructor: function(config) {
		var scales, proj, extent, resolutions = [], data = config.data;
		
		// Scales
		scales = data.properties.scales;
		
		// Projection
		proj = ol.proj.get(data.properties.srs || this.defaults.srs);
		
		// Extent
		if(!data.properties.bbox) {
			extent = proj.getWorldExtent() || this.defaults.extent;
		} else {
			extent = data.properties.bbox;
		}
		
		// Resolutions
		if(!Ext.isEmpty(scales) && Ext.isArray(scales)) {
			scales.forEach(function(o) {
				if(o &&  o.res) resolutions.push(o.res);
			});
		}
		
		Ext.apply(config, {
			projection	: proj,
			extent		: extent,
			scales		: scales,
			resolutions	: resolutions
		});
		
		this.initConfig(config);
		
		var layers = this.getLayers();
		
		// Layers
		for(var i = 0; i < data.features.length; i++) {
			layers.push(new Ck.owcLayer({
				data: data.features[i],
				owsContext: this
			}));
		}
	}
});
