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
	
	/**
	 * @inheritdoc Ext.button.Button
	 */
	itemId: 'zoomin',
	
	/**
	 * @inheritdoc Ext.button.Button
	 */
	text: '',
	
	/**
	 * @inheritdoc Ext.button.Button
	 */
	iconCls: 'fa fa-search-plus',
	
	/**
	 * @inheritdoc Ext.button.Button
	 */
	tooltip: 'Zoom in',
	
	
	/**
	 * Zoom in the map on click.
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.setZoom( map.getZoom() + 1 );
	}
});
