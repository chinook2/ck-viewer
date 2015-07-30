/**
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
	 * 
	 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Panel}.
	 * 
	 *		{
	 *			xtype: "button",
	 *			scale: "large",
	 *         action: "ckmapZoomout"
	 *		}
	 * 
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.setZoom( map.getZoom() - 1 );
	}
});
