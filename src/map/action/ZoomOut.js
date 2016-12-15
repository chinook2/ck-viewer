/**
 * Basic action to zoom out the map (zoom level - 1).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomout"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.ZoomOut', {
	extend: 'Ck.Action',
	alias: "widget.ckmapZoomout",

	itemId: 'zoomout',
	text: '',
	iconCls: 'fa fa-search-minus',
	tooltip: 'Zoom out',

	/**
	 * Zoom out the map on click.
	 */
	doAction: function(btn) {
		var map = this.getMap();
		map.setZoom( map.getZoom() - 1 );
	}
});
