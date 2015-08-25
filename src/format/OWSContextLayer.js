/**
 * 
 */
Ext.define('Ck.format.OWSContextLayer', {
	alternateClassName: ['Ck.owcLayer', 'Ck.OwcLayer'],
		
	constructor: function(layer, owsContext) {
		if(!layer.id || !layer.properties) {
			Ck.error("This layer is not a OWS context Layer !");
			return false;
		}
		
		this.lyr = layer;
		this.context = owsContext;
	},
	
	getTitle: function() {
		return this.lyr.properties.title;
	},
	
	getName: function() {
		return this.lyr.properties.name;
	},
	
	/**
	 * Get layer extent reprojected if necessary
	 * @param {ol.proj.ProjectionLike}
	 * @return {ol.Extent}
	 */
	getExtent: function(proj) {
		if(this.lyr.properties.bbox) {
			return this.lyr.properties.bbox;
		} else if(this.lyr.properties.latlongbbox) {
			if(proj) {
				var srcProj = ol.proj.get("EPSG:4326");
				var dstProj = ol.proj.get(proj);
				if(ol.proj.equivalent(srcProj, dstProj)) {
					return this.lyr.properties.latlongbbox;
				} else {
					return ol.proj.transformExtent(this.lyr.properties.latlongbbox, srcProj, dstProj);
				}
			} else {
				return this.lyr.properties.latlongbbox;
			}
		}
		
		return null;
	},
	
	/**
	 * Get the layer projection
	 * @return {ol.proj.Projection}
	 */
	getProjection: function() {
		return ol.proj.get(this.lyr.properties.sourceProjection);
	},
	
	getProtocolVersion: function() {
		var offering = this.lyr.properties.offerings[0];
		return offering.version;
	},
	
	getHref: function(params) {
		var offering = this.lyr.properties.offerings[0];
		var operation = offering.operations[0];
		var href = Ext.htmlDecode(operation.href);
		
		var aHref = href.split("?");
		if(params === false) return aHref[0];
		return href;
	},
	
	getHrefParams: function() {
		var href = this.getHref();
		var aHref = href.split("?");
		return Ext.Object.fromQueryString( aHref.pop() );
	},
	
	getVisible: function() {
		return this.lyr.properties.active;
	},
	
	getExtension: function(key) {
		var ext = this.lyr.properties.extension;
		if(!ext) return '';
		return ext[key];
	},
	
	getType: function() {
		var offering = this.lyr.properties.offerings[0];
		if(!offering) {
			Ck.log("No offering for this layer ("+ this.getTitle() +").");
			return false;
		}
		
		var c = offering.code;
		if(!c) {
			Ck.log("No offering code for this layer ("+ this.getTitle() +").");
			return false;
		}
		
		if (c.indexOf('google') != -1) {
			return 'google';
		} else if (c.indexOf('osm') != -1) {
			return 'osm';
		} else if (c.indexOf('wms') != -1) {
			return 'wms';
		} else if (c.indexOf('wmts') != -1) {
			return 'wmts';
		} else if (c.indexOf('wfs') != -1) {
			return 'wfs';
			
		} else if (c.indexOf('geojson') != -1) {
			return 'geojson';
		
		// WCS, WPS, CSW, GML, KML, GeoTIFF, GMLJP2, GMLCOV
		} else {
			Ck.error("Offering code '" + c + "' not available for this layer ("+ this.getTitle() +").");
			return false;
		}
	}
});
