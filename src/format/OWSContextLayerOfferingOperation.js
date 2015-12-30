/**
 * 
 */
Ext.define('Ck.format.OWSContextLayerOfferingOperation', {
	alternateClassName: ['Ck.owcOperation', 'Ck.OwcOperation'],
	
	config: {
		code		: null,
		method		: null,
		type		: null,
		owsOffering	: {},
		data		: {}
	},
	
	/**
	 * Create a offering from an object
	 * @param {Object}
	 * @param {Ck.owcLayer}
	 */
	constructor: function(config) {
		var data = config.data;
		
		Ext.apply(config, {
			code	: data.code,
			method	: data.method,
			type	: data.type,
			
			layers: data.layers
		});
		
		this.initConfig(config);
	},
	
	/**
	 * Get the URL with or without parameters or only parameters.
	 * @params {Integer} 
	 * - 1 : Without parameters
	 * - 2 : Only parameters
	 * - 3 : Parameter in object
	 * @params {String/Object}
	 */
	getHref: function(code) {
		var res, href = Ext.htmlDecode(this.getData().href);
		var aHref = href.split("?");
		switch(code) {
			case 1:
				res = aHref[0];
				break;
			case 2:
				res = aHref[1];
				break;
			case 3:
				res  = {};
				var part, parts = aHref[1].split("&");
				for(var i in parts) {
					part = parts[i].split("=");
					res[part[0]] = part[1];
				}
				break;
			default:
				res = href;
		}
		
		return res;
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
	}
});
