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
Ext.define('Ck.map.action.OpenOverview', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenOverview",
	
	toggleGroup: 'ckOverview',
	
	requires: [
		'Ck.Overview'
	],
	
	itemId: 'openoverview',
	text: '',
	
	iconCls: 'fa fa-eye',
	tooltip: 'Display overview',
	
	firstView: true,
	
	/**
	 * Create and display a windows with print form
	 */
	toggleAction: function(btn, pressed) {
		this.button = btn;
		
		if(!this.win) {
			this.ov = Ext.create({
				xtype: "ckoverview",
				openner: this
			});
			this.win = Ext.create('Ext.window.Window', {
				resizable: false,
				layout: 'fit',
				closeAction: 'hide',
				items: this.ov,
				header: {
					height: 20,
					cls: "ck-header-20"
				},
				listeners: {
					close: function() {
						this.button.setPressed(false);
						this.toggleAction(this.button, false);
					},
					scope: this
				}
			});
		}
		
		if(pressed) {
			this.win.show();
			if(this.firstView || this.ov.config.replaceEverytime) {
				this.win.alignTo(Ck.getMap().getOlMap().getViewport(), "tl", [50, 10]);
				this.firstView = false;
			}
		} else {
			this.win.hide();
		}		
	},
	
	close: function() {
		this.win.hide();
		this.button.setPressed(false);
	}
});
