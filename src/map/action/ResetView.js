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
Ext.define('Ck.map.action.ResetView', {
	extend: 'Ck.Action',
	alias: "widget.ckmapResetview",
	
	itemId: 'resetview',
	text: '',
	// iconCls: 'fa fa-globe',
	iconCls: 'fa fa-home',
	tooltip: 'Reset view',
	
	/**
	 * Zoom to the initial extent
	 */
	doAction: function(btn) {
		var map = Ck.getMap();
		map.resetView();
	},
	
	render: function(c){
		Ext.create('Ext.tip.ToolTip', {
			target: c.getEl(),
			html: this.tooltip,
			anchor:"left",
			animCollapse:false
		},this);
	}
});
