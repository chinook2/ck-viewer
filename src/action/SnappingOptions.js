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
				height		: 350,
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
