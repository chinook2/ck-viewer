/**
 * 
 */
Ext.define("Ck.map.controllers.ZoomIn", {
	override: "Ck.Controller",

	/**
	 * Zoom in the map on click.
	 * 
	 * Use on a {@link Ext.button.Button} in a Ext.toolbar ...
	 * 
	 *		{
	 *			xtype: "button",
	 *			iconCls: " fa fa-search-plus",
	 *			scale: "large",
	 *			handler: "mapZoomInClick"
	 *		}
	 * 
	 */
	mapZoomInClick: function(btn) {
		var map = this.getMap();
		map.setZoom( map.getZoom() + 1 );
	}
});
