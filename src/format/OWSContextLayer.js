/**
 *
 */
Ext.define('Ck.format.OWSContextLayer', {
	alternateClassName: ['Ck.owsLayer', 'Ck.OwsLayer'],

	/**
	 * Config of OWSContextLayer
	 */
	config: {
		id				: null,
		name			: null,
		title			: null,
		visible			: true,
		layers			: null,
		userLyr			: true,
		minScale		: 0,
		maxScale		: Infinity,
		minResolution	: 0,
		maxResolution	: Infinity,
		offerings		: [],
		owsContext		: {},
		data		: {}
	},

	requires: [
		'Ck.format.OWSContextLayerOffering'
	],

	/**
	 * Create a offering from an object
	 * @param {Object}
	 * @param {Ck.owc}
	 */
	constructor: function(config) {
		// Feed the config
		var data = config.data;

		Ext.apply(config, {
			id			: data.id,
			name		: data.properties.name,
			title		: data.properties.title,
			visible		: data.properties.active,
			userLyr		: Ext.isBoolean(data.properties.userLyr)? data.properties.userLyr : true,
			minScale	: data.properties.minscale,
			maxScale	: data.properties.maxscale
		});

		this.initConfig(config);

		var offerings = this.getOfferings();
		var layers = [];
		if (data.properties.offerings) {
			for(var i = 0; i < data.properties.offerings.length; i++) {
				var off = new Ck.owsOffering({
					data: data.properties.offerings[i],
					owsLayer: this
				});
				// Collect layers from operations
				layers = layers.concat(off.getLayers().split(','));
				offerings.push(off);
			}
		}

		if(offerings.length == 0) {
			Ck.log("No offering for this layer ("+ (data.properties.title || data.properties.name) +").");
		}

		layers = Ext.Array.unique(layers);
		this.setLayers(layers.join(','));
	},

	setMinScale: function(value) {
		if(!isNaN(value)) {
			var units;
			value = parseFloat(value);
			this._minScale = value;

			if(this.getOwsContext() && this.getOwsContext.getProjection) {
				proj = this.getOwsContext().getProjection();
			} else {
				proj = Ck.getMap().getOlView().getProjection();
			}
			this._minResolution = Ck.getResolutionFromScale(value, proj);
		}
	},

	setMaxScale: function(value) {
		if(!isNaN(value)) {
			var units;
			value = parseFloat(value);
			this._maxScale = value;
			// Get the units
			if(this.getOwsContext() && this.getOwsContext.getProjection) {
				proj = this.getOwsContext().getProjection();
			} else {
				proj = Ck.getMap().getOlView().getProjection();
			}
			this._maxResolution = Ck.getResolutionFromScale(value, proj);
		}
	},

	/**
	 * Get layer extent reprojected if necessary
	 * @param {ol.proj.ProjectionLike}
	 * @return {ol.Extent}
	 */
	getExtent: function(proj) {
		var data = this.getData();

		if(data.properties.bbox) {
			return data.properties.bbox;
		} else if(data.properties.latlongbbox) {
			if(proj) {
				var srcProj = ol.proj.get("EPSG:4326");
				var dstProj = ol.proj.get(proj);
				if(ol.proj.equivalent(srcProj, dstProj)) {
					return data.properties.latlongbbox;
				} else {
					return ol.proj.transformExtent(data.properties.latlongbbox, srcProj, dstProj);
				}
			} else {
				return data.properties.latlongbbox;
			}
		}

		return null;
	},

	/**
	 * Return one properties or all properties (in an object) if key param is not defined
	 * @param {String/undefined}
	 * @return {String/Object}
	 */
	getExtension: function(key) {
		var ext = this.getData().properties.extension || {};
		if(Ext.isEmpty(key)) {
			return ext;
		} else {
			return ext[key];
		}
	},

	/**
	 * Get a permission
	 * @param {String}
	 * @return {Object /Boolean}
	 */
	getPermission: function(key) {
		var perm = this.getExtension("permission");
		if(Ext.isString(perm)) {
			perm = Ext.decode(perm);
		} else {
			perm = {};
		}
		if(Ext.isString(key)) {
			perm = (perm[key] == "allow");
		}
		return perm;
	},

	/**
	 * Get offering of desired type
	 * @param {String/Number} Type (wms, wfs, osm...) or index of offering
	 * @return {Ck.owsLayerOffering/undefined}
	 */
	getOffering: function(val) {
		var offering, offerings = this.getOfferings();

		if(Ext.isString(val)) {
			for(var i = 0; (i < offerings.length && Ext.isEmpty(offering)); i++) {
				if(offerings[i].getType() == val) {
					offering = offerings[i];
				}
			}
		} else {
			offering = offerings[val];
		}

		return offering;
	}
});
