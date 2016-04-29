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
	
	/**
	 * Update geolocationMarker's position via GPS if pressed == true.
	 * Zoom to user location
	 */
	toggleAction: function(btn, toggle) {
		this.btn = btn;
		
		if(toggle) {
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
						openner	: this
					}]
				});
			}

			this.win.show();
		} else {
			this.win.hide();
		}
	},
	
	close: function() {
		this.win.hide();		
	}
});
