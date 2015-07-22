/**
 * 
 */
Ext.define("Ck.map.controllers.ZoomOut", {
	override: "Ck.Controller",

	mapZoomOutClick: function(btn) {
		var map = this.getMap();
		map.setZoom( map.getZoom() - 1 );
	}
});
