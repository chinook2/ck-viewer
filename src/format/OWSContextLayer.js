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
		zIndex			: null,
		minScale		: 0,
		maxScale		: Infinity,
		minResolution	: 0,
		maxResolution	: Infinity,
		offerings		: [],
		owsContext		: {},
		data			: {}
	},
	
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
			zIndex		: data.properties.zIndex,
			minScale	: data.properties.minscale,
			maxScale	: data.properties.maxscale,
			minResolution	: data.properties.minResolution,
			maxResolution	: data.properties.maxResolution
		});
		
		this.initConfig(config);
		
		var offerings = this.getOfferings();
		
		for(var i = 0; i < data.properties.offerings.length; i++) {
			offerings.push(new Ck.owcOffering({
				data: data.properties.offerings[i],
				owsLayer: this
			}));
		}
		
		if(offerings.length == 0) {
			Ck.log("No offering for this layer ("+ this.getTitle() +").");
		}
	},
	
	setMinScale: function(value) {
		if(!isNaN(value)) {
			var units;
			value = parseFloat(value);
			this._minScale = value;
			// Get the units
			if(this.getOwsContext() && this.getOwsContext.getProjection) {
				units = this.getOwsContext().getProjection().units_;
			} else {
				units = Ck.getMap().getOlView().getProjection().units_;
			}
			this._minResolution = Ck.getResolutionForScale(value, units);
		}
	},
	
	setMaxScale: function(value) {
		if(!isNaN(value)) {
			var units;
			value = parseFloat(value);
			this._maxScale = value;
			// Get the units
			if(this.getOwsContext() && this.getOwsContext.getProjection) {
				units = this.getOwsContext().getProjection().units_;
			} else {
				units = Ck.getMap().getOlView().getProjection().units_;
			}
			this._maxResolution = Ck.getResolutionForScale(value, units);
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
