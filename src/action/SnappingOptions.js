/**
 *
 */
Ext.define('Ck.action.SnappingOptions', {
	extend: 'Ck.Action',
	alias: "widget.ckSnappingOptions",

	text: "Snapping options",
	tooltip: "Snapping options",
	
	enableToggle: true,
	toggleGroup: "snappingOptions",
	
	reloadLayer: false,
	layer: null,
	
	/**
	 * Show the snappingOptions window
	 */
	toggleAction: function(btn, status) {
		this.callParent(arguments);
		this.btn = btn;
		
		if(Ext.isEmpty(this.win) || this.win.isDestroyed) {

			this.win = Ck.create("Ext.window.Window", {
				title		: "Snapping options",
				height		: 400,
				width		: 500,
				layout		: "fit",
				maximizable	: false,
				collapsible	: true,
				closeAction	: "hide",
				constrain   : true,
				items		: [{
					xtype	: "cksnapping",
					reloadLayer: this.reloadLayer,
					layer: this.layer,
					openner	: this
				}],
				listeners: {
					hide: function(win, opt) {
						this.btn.toggle(false);
					},
					close: function(win, opt) {
						this.btn.toggle(false);
					},
					show: function(win, opt) {
						var grid = Ext.getCmp("edit-snapping-options");
						if(grid) {
							grid.getView().refresh();
						}
					},
					scope: this
				}
			});
		}

		if(status) {
			this.win.show();
		} else {
			this.win.hide();
		}		
	},
	
	close: function() {
		this.win.hide();		
	}
});
