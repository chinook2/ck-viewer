/**
 * ZoomOut controller.
 */
Ext.define("Ck.map.controllers.ZoomOut", {
	override: "Ck.Controller",

	/**
	 * Zoom out the map on click.
	 * 
	 * Use on a {@link Ext.button.Button} in a Ext.toolbar ...
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
