/**
 *
 */
Ext.define('Ck.format.OWSContextLayerOfferingOperation', {
	alternateClassName: ['Ck.owcOperation', 'Ck.OwcOperation'],

	config: {
		code		: null,
		method		: null,
		type		: null,
		format      : null,
		href		: null,
		params		: null,
		url			: null,
		version		: null,
		layers		: null,
		srs			: null,
		crs			: null,
		owsOffering	: {},
		data		: {}
	},

	/**
	 * Create a offering from an object
	 * @param {Object}
	 * @param {Ck.owcLayer}
	 */
	constructor: function(config) {
		var params = {}, data = config.data;

		var href = Ext.htmlDecode(data.href);
		var aHref = href.split("?");

		if(aHref[1]) {
			params = Ext.Object.fromQueryString(aHref[1]);
		}

		Ext.apply(config, {
			code	: data.code,
			method	: data.method,
			type	: data.type,
			format  : data.type,
			href	: href,
			params	: params,
			url		: aHref[0],
			version	: params.VERSION,
			layers	: params.LAYERS,
			srs		: params.SRS,
			crs		: params.CRS
		});

		this.initConfig(config);
	},

	/**
	 * Get the format.
	 * @return {String} Can be : xml, json, text
	 */
	setType: function(type) {
		var t;
		if (type.indexOf('xml') != -1) {
			t = 'xml';
		} else if (type.indexOf('json') != -1) {
			t = 'json';
		} else if (type.indexOf('text') != -1) {
			t = 'text';
		} else if (type.indexOf('png') != -1) {
			t = 'png';
		} else if (type.indexOf('image') != -1) {
			t = 'image';
		}

		// this.type = t;
		this._type = t;
	},

	/**
	 * Get the layer projection
	 * @return {ol.proj.Projection}
	 */
	getProjection: function() {
		var projection = this.getSrs() || this.getCrs();
		if(Ext.isEmpty(projection)) {
			if(this.getVersion() >= "1.3") {
				projection = Ck.defaults.crs;
			} else {
				projection = Ck.defaults.srs;
			}
		}
		return ol.proj.get(projection);
	},

	/**
	 * Return the operation version or default version
	 * @return {String}
	 */
	getProtocolVersion: function() {
		var v = this.getVersion();
		if(Ext.isEmpty(v)) {
			v = Ck.defaults.version[this.owsOffering.getType()];
		}
		return v;
	}
});
