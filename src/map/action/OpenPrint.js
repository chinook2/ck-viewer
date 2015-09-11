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
Ext.define('Ck.map.action.OpenPrint', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenPrint",
	
	requires: [
		'Ck.Print'
	],
	
	itemId: 'openprint',
	text: '',
	
	iconCls: 'fa fa-print',
	tooltip: 'Open print panel',
	
	/**
	 * Create and display a windows with print form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create('Ext.window.Window', {
				title: 'Print',
				// height: 400,
				width: 400,
				layout: 'fit',
				closeAction: 'hide',
				items: {
					xtype: 'ckprint',
					openner: this
				}
			});
		}
		
		this.win.show();
	},
	
	close: function() {
		this.win.hide();
	}
});
