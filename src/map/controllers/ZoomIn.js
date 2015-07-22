/**
 */
Ext.define("Ck.map.controllers.ZoomIn", {
	override: "Ck.Controller",

	/**
	 * Zoom in the map.
	 * 
	 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Panel}.
	 *
	 *		{
	 *			xtype: "button",
	 *			iconCls: "fa fa-search-plus",
	 *			scale: "large",
	 *			handler: "ckmapZoomIn"
	 *		}
	 */
	ckmapZoomIn: function(btn) {
		var map = this.getMap();
		map.setZoom( map.getZoom() + 1 );
	}
});
