/**
 *
 */
Ext.define('Ck.format.OWSContextLayerOffering', {
	alternateClassName: ['Ck.owsOffering', 'Ck.OwsOffering'],

	config: {
		code		: null,
		type		: null,
		layers		: null,
		operations	: [],
		owsContext	: {},
		data		: {}
	},

	requires: [
		'Ck.format.OWSContextLayerOfferingOperation'
	],

	/**
	 * Create a offering from an object
	 * @param {Object}
	 * @param {Ck.owsLayer}
	 */
	constructor: function(config) {
		var data = config.data;

		Ext.apply(config, {
			code	: data.code
		});

		this.initConfig(config);

		var operations = this.getOperations();

		var layers = [];
		for(var i = 0; i < data.operations.length; i++) {
			var op = new Ck.owsOperation({
				data: data.operations[i],
				owsOffering: this
			});
			// Collect layers from operations
			layers = layers.concat(op.getLayers().split(','));
			operations.push(op);
		}

		if(operations.length == 0) {
			Ck.log("No operations for the offering.");
		}

		layers = Ext.Array.unique(layers);
		this.setLayers(layers.join(','));
	},

	/**
	 * Get the layer type.
	 * @return {String} Can be : google, osm, wms, wmts, wfs
	 */
	getType: function() {
		if(Ext.isEmpty(this.type)) {
			var c = this.getData().code;
			if(!c) {
				Ck.log("No offering code for this layer.");
			}

			if (c.indexOf('google') != -1) {
				this.type = 'google';
			} else if (c.indexOf('osm') != -1) {
				this.type = 'osm';
			} else if (c.indexOf('wms') != -1) {
				this.type = 'wms';
			} else if (c.indexOf('wmts') != -1) {
				this.type = 'wmts';
			} else if (c.indexOf('wfs') != -1) {
				this.type = 'wfs';

			} else if (c.indexOf('geojson') != -1) {
				this.type = 'geojson';

			// WCS, WPS, CSW, GML, KML, GeoTIFF, GMLJP2, GMLCOV
			} else {
				Ck.log("Offering code '" + c + "' not available.");
				return false;
			}
		}

		return this.type;
	},

	/**
	 * Get operation of desired code
	 * @param {String/Number} code (getMap, getFeature...) or index of operation
	 * @return {Ck.owsOperation/undefined}
	 */
	getOperation: function(val) {
		var operation, operations = this.getOperations();

		if(Ext.isString(val)) {
			for(var i = 0; (i < operations.length && Ext.isEmpty(operation)); i++) {
				if(operations[i].getCode() == val) {
					operation = operations[i];
				}
			}
		} else {
			operation = operations[val];
		}

		return operation;
	}
});
