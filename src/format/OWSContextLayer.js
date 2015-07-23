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
	
	getExtent: function() {
		// if(!this.lyr.properties.bbox) return [-180,-90,180,90]; // TODO : check projection for default bbox
		return this.lyr.properties.bbox;
	},
	
	getHref: function(params) {
		var offering = this.lyr.properties.offerings[0];
		var operation = offering.operations[0];
		var href = Ext.htmlDecode(operation.href);
		
		var aHref = href.split("?");
		if(params===false) return aHref[0];
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
		
		// WCS, WPS, CSW, GML, KML, GeoTIFF, GMLJP2, GMLCOV
		} else {
			Ck.error("Offering code '" + c + "' not available for this layer ("+ this.getTitle() +").");
			return false;
		}
	}
});
