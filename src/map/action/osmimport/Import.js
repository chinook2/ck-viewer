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
	toggleGroup: null,
	enableToggle: false,
	
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create('Ext.window.Window', {
				title: 'OSM Data Import',
				// height: 400,
				width: 400,
				layout: 'fit',
				collapsible: true,
				closeAction: 'hide',
				items: [{
					xtype: "ckosmimportimport",
					openner: this
				}]
				
			});
		}
		
		this.win.show();
	},
	
	/**
	 * Used to close the window.
	 */
	close: function() {
		this.win.hide();
	}
});

