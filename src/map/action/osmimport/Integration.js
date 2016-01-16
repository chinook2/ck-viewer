/**
 * Action for OpenStreetMap import.
 * Opens a panel to set the configuration of the integration and execute it.
 * @author Florent RICHARD
 */
Ext.define('Ck.map.action.osmimport.Integration', {
	extend: 'Ck.map.action.OsmImport',
	alias: 'widget.ckmapOsmImportIntegration',
	
	itemId: 'osmimportintegration',
	text: '',
	iconCls: 'fa fa-save',
	tooltip: 'Integrate Data',
	enableToggle: true,
	disabled: true,  // Disabled by default, changed after import
	
	toggleAction: function(btn, pressed) {
		if (pressed) {
			if(!this.win || this.needClean) {
				if (this.win) {
					this.win.close();
				}
				this.win = Ext.create('Ext.window.Window', {
					title: 'OSM Data Integration',
					width: 700,
					layout: 'fit',
					collapsible: true,
					closable: false,
					resizable: false,
					items: [{
						xtype: "ckosmimportintegration",
						openner: this
					}]
					
				});
				this.needClean = false;
			}
			this.win.show();
			this.win.expand();
		} else {
			this.win.hide();
		}
	},
	
	/**
	 * Used to close the window.
	 */
	close: function() {
		this.items[0].toggle(false);
	},
	
	/**
	 * Collapse the window.
	 */
	collapse: function() {
		this.win.collapse();
	}
	
});

