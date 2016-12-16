/**
 * Basic action to zoom to specified extent (default to context extent).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomTo"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.ZoomTo', {
	extend: 'Ck.Action',
	alias: "widget.ckmapZoomto",

	itemId: 'zoomto',
	text: '',
	// iconCls: 'fa fa-globe',
	iconCls: 'ckfont ck-home',
	tooltip: 'Zoom to extent',

	/**
	 * Zoom to the initial extent
	 */
	doAction: function(btn) {
		var map = this.getMap();
		if (Ext.isArray(btn.extent)) {
			map.setExtent(btn.extent);
		} else {
			map.resetView();
		}
	}
});
