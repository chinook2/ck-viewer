/**
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
	 * 
	 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Panel}.
	 * 
	 *		{
	 *			xtype: "button",
	 *			scale: "large",
	 *         action: "ckmapZoomin"
	 *		}
	 * 
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.setZoom( map.getZoom() + 1 );
	}
});
