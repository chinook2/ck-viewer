/**
 * 
 */
Ext.define('Ck.format.OWSContext', {
	alternateClassName: ['Ck.owc', 'Ck.Owc'],
	
	requires: [
		'Ck.format.OWSContextLayer'
	],
	
	constructor: function(owc) {
		if(!owc.properties || !owc.features) {
			Ck.error("This context is not a OWS context !");
			return false;
		}
		
		this.owc = owc;
	},
	
	getExtent: function() {
		if(!this.owc.properties.bbox) {
			return this.getProjection().getWorldExtent() || [-180,-90,180,90];
		} else {
			return this.owc.properties.bbox;
		}
	},
	
	getProjection: function() {
		return ol.proj.get(this.owc.properties.srs || "EPSG:3857");
	},
	
	getScales: function() {
		return this.owc.properties.scales;
	},
	
	getResolutions: function() {
		var scales = this.getScales();
		if(!scales) return [];
		if(!Ext.isArray(scales)) return [];
		var res = [];
		scales.forEach(function(o) {
			if(o &&  o.res) res.push(o.res);
		});
		return res;
	},
	
	getLayers: function() {
		return this.owc.features;
	},
	
	getLayer: function(layer) {
		return new Ck.OwcLayer(layer, this);
	}
});
