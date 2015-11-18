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
	toggleGroup: null,
	enableToggle: false,
	disabled: !this.importDone,
	
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create('Ext.window.Window', {
				title: 'OSM Data Integration',
				// height: 400,
				width: 600,
				layout: 'fit',
				collapsible: true,
				closable: false,
				resizable: false,
				items: [{
					xtype: "ckosmimportintegration",
					openner: this
				}]
				
			});
		}
		this.win.show();
		this.win.expand();
	},
	
	/**
	 * Used to close the window.
	 */
	close: function() {
		this.win.hide();
	},
	
	/**
	 * Collapse the window.
	 */
	collapse: function() {
		this.win.collapse();
	}
	
});

