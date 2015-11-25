/**
 * Action for OpenStreetMap import.
 * Opens a panel to show the OSM Attributions.
 * @author Florent RICHARD
 */
Ext.define("Ck.map.action.osmimport.Attributions", {
	extend: "Ck.map.action.OsmImport",
	alias: "widget.ckmapOsmImportAttributions",
	
	itemId: "osmimportattributions",
	iconCls: "fa fa-info",
	tooltip: "Attributions",
	
	/**
	 * Method launched when action button is clicked.
	 * The attribution panel is shown or hidden.
	 */
	toggleAction:  function(btn, pressed) {
		if(!this.win) {
			this.win = Ext.create("Ext.window.Window", {
				title: "OSM Attributions",
				resizable: false,
				items: [{
					xtype: "ckosmimportattributions"
				}],
				closeAction: "hide",
				listeners: {
					close: function() {
						btn.setPressed(false);
						this.win.hide();
					},
					scope: this
				}			
			});
		}
		if (pressed) {
			this.win.show();
		} else {
			this.win.hide()
		}
	}
});
