/**
 * 
 */
Ext.define('Ck.format.OWSContextLayerOffering', {
	alternateClassName: ['Ck.owcOffering', 'Ck.OwcOffering'],
	
	config: {
		code		: null,
		version		: null,
		layers		: null,
		srs			: null,
		type		: null,
		operations	: [],
		owsContext	: {},
		data		: {}
	},
	
	/**
	 * Create a offering from an object
	 * @param {Object}
	 * @param {Ck.owsLayer}
	 */
	constructor: function(config) {
		var data = config.data;
		
		Ext.apply(config, {
			code	: data.code,
			version	: data.version,
			layers	: data.layers,
			srs		: data.srs
		});
		
		this.initConfig(config);
		
		var operations = this.getOperations();
		
		for(var i = 0; i < data.operations.length; i++) {
			operations.push(new Ck.owcOperation({
				data: data.operations[i],
				owsOffering: this
			}));
		}
		
		if(operations.length == 0) {
			Ck.log("No operations for the offering.");
		}
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
			} else if (c.indexOf('ign') != -1) {
				this.type = 'ign';
			} else if (c.indexOf('wms') != -1) {
				this.type = 'wms';
			} else if (c.indexOf('wmts') != -1) {
				this.type = 'wmts';
			} else if (c.indexOf('xyz') != -1) {
				this.type = 'xyz';
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
	 * @return {Ck.owcOperation/undefined}
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
