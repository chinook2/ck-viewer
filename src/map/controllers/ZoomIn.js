/**
 * 
 */
Ext.define("Ck.map.controllers.ZoomIn", {
    override: "Ck.Controller",
    	
    mapZoomInClick: function(btn) {
        var map = this.getMap();
		map.setZoom( map.getZoom() + 1 );
    }
});
