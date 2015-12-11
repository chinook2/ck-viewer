/**
 * Action for OpenStreetMap import.
 * Opens a panel to set the configuration of the import and execute it.
 * @author Florent RICHARD
 */
Ext.define('Ck.map.action.osmimport.Import', {
	extend: 'Ck.map.action.OsmImport',
	alias: 'widget.ckmapOsmImportImport',
	
	itemId: 'osmimportimport',
	text: '',
	iconCls: 'fa fa-cloud-download',
	tooltip: 'Import Data',
	enableToggle: true,
	disabled: false,  // available by default, changed once import is finished
	
	toggleAction: function(btn, pressed) {
		if (pressed) {
			if(!this.win || this.needClean) {
				if (this.win) {
					this.win.close();
				}
				this.win = Ext.create('Ext.window.Window', {
					title: 'OSM Data Import',
					width: 600,
					layout: 'fit',
					collapsible: true,
					closable: false,
					resizable: false,
					items: [{
						xtype: "ckosmimportimport",
						openner: this
					}]
					
				});
				this.needClean = false;
			}
			this.win.show();
			this.win.expand();
		} else {
			if (this.closeFromController) {
				this.win.hide();
				this.closeFromController = undefined;
			} else {
				this.win.items.items[0].getController().cancel(); // Permits to close properly the import (remove map interaction ...)
			}
		}
	},
	
	/**
	 * Used to close the window.
	 */
	close: function() {
		this.closeFromController = true;  // This variable permits to not have circular call when closing from Controller
		this.items[0].setPressed(false);
		this.toggleAction(undefined, false);  // Force the method to be called even if button is not pressed
	},
	
	/**
	 * Collapse the window.
	 */
	collapse: function() {
		this.win.collapse();
	}
	
});

