/**
 */
Ext.define("Ck.map.controllers.ZoomOut", {
	override: "Ck.Controller",

	/**
	 * Zoom out the map.
	 * 
	 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Panel}.
	 *
	 *		{
	 *			xtype: "button",
	 *			iconCls: "fa fa-search-minus",
	 *			scale: "large",
	 *			handler: "ckmapZoomOut"
	 *		}
	 */
	ckmapZoomOut: function(btn) {
		var map = this.getMap();
		map.setZoom( map.getZoom() - 1 );
	}
});
