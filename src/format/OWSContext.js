/**
 *
 */
Ext.define('Ck.format.OWSContext', {
	alternateClassName: ['Ck.owc', 'Ck.Owc'],

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
		proj = ol.proj.get(data.properties.srs || Ck.defaults.srs);

		// Extent
		if(!data.properties.bbox) {
			extent = proj.getWorldExtent() || Ck.defaults.extent;
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
			if (!data.features[i]) continue;
			layers.push(new Ck.owsLayer({
				data: data.features[i],
				owsContext: this
			}));
		}
	},

	/**
	 * Return resolutions in an array.
	 * @param {Boolean} True to return in ascending order
	 */
	getResolutions: function(ascending) {
		var res = this._resolutions;
		if(!Ext.isEmpty(res) && Ext.isArray(res) && res.length > 1) {
			res = res.slice(0); //clone Array (prevent reverse resolution in tilegrid.WMTS)
			if((ascending && res[0] > res[1]) || (!ascending && res[0] < res[1])) {
				res.reverse();
			}
		}
		return res;
	}
});
