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
	
	/**
	 * @inheritdoc Ext.button.Button
	 */
	itemId: 'zoomout',

	/**
	 * @inheritdoc Ext.button.Button
	 */
	text: '',

	/**
	 * @inheritdoc Ext.button.Button
	 */
	iconCls: 'fa fa-search-minus',

	/**
	 * @inheritdoc Ext.button.Button
	 */
	tooltip: 'Zoom out',
	
	/**
	 * Zoom out the map on click.
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.setZoom( map.getZoom() - 1 );
	}
});
