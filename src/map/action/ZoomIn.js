/**
 * Basic action to zoom in the map (zoom level + 1).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 * 
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomin"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.ZoomIn', {
	extend: 'Ck.Action',
	alias: "widget.ckmapZoomin",
	
	itemId: 'zoomin',
	text: '',
	iconCls: 'fa fa-search-plus',
	tooltip: 'Zoom in',
	
	/**
	 * Zoom in the map on click.
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.setZoom( map.getZoom() + 1 );
	}
});
