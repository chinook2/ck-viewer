/**
 * Created by fri on 7 Jan 2022.
 * Tool to export data as a shapefile.
 * the write function use a callback with following object returning a Blob for each file of the shapefile {shp: Blob(), shx: Blob(), dbf: Blob(), prj: Blob()}
 */
Ext.define('Ck.export.ShpWriter', {
	extend: 'Ext.data.Connection',
	_allowedTypes: ['POINT','LINESTRING','POLYGON'],
	config: {
		projection: null,
		attributes: null,
		coords: null,
		type: null
	},
	constructor : function(config) {
		this._validateConfig(config);
		
		this.setType(config.type);
		this.setAttributes(config.attributes);
		this.setCoords(config.coords);
		this.setProjection(config.projection);
    },
	_validateConfig: function(config) {
		// Checks the given type exists
        if (this._allowedTypes.indexOf(config.type) == -1) {
			throw new Error("Incorrect type given");
		}
		
		// Checks attributes and coords are array and there are as many coords as attributes
		if (!Array.isArray(config.attributes) ||config.attributes.length < 1) {
			throw new Error("attributes must be not empty array");
		}
		if (!Array.isArray(config.coords) || config.coords.length < 1) {
			throw new Error("coords must be not empty array");
		}
		if (config.attributes.length != config.coords.length) {
			throw new Error("attributes and coords must have the same length");
		}
	},
	_bufferToBlob: function(buffer) {
		var blob =  new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);
		return blob;
	},
	_textToBlob: function(text) {
		var blob = new Blob([text]);
		return blob;
	},
	write: function(callback) {
		var me = this;
		shpwrite.write(this.getAttributes(), this.getType(), this.getCoords(),function(err, files) {
			var result = {
				shp: me._bufferToBlob(files.shp.buffer),
				shx: me._bufferToBlob(files.shx.buffer),
				dbf: me._bufferToBlob(files.dbf.buffer),
				prj: null
			};
			var projContent = me.getProjection();
			if (projContent && Ext.isString(projContent) && projContent.length > 1) {
				result.prj = me._textToBlob(projContent);
			}
			callback(result);
		});
	}
});
