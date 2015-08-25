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
	
	getLayers: function() {
		return this.owc.features;
	},
	
	getLayer: function(layer) {
		return new Ck.OwcLayer(layer, this);
	}
});
