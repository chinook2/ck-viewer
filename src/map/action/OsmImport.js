/**
 * Base class for Osm Import actions.
 * @author Florent RICHARD
 */
Ext.define('Ck.map.action.OsmImport', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapOsmImport',
	
	itemId: 'osmimport',
	text: '',
	iconCls: '',
	tooltip: '',
	
	toggleGroup: 'ckmapAction',
	
	/**
	 * Attribute for the store shared between import and integration.
	 */
	osmapi: Ext.create("Ck.osmimport.OsmImportStore"),
	
	/**
	 * Method to significate that import is finished with data imported.
	 * Go to next workflow step: integration.
	 */
	finishImport: function() {
		Ck.actions['ckmapOsmImportImport'].setDisabled(true);
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(false);
		this.needClean = true;
	},
	
	/**
	 * Method to significate that integration is finished.
	 * Go to next workflow step: import.
	 */
	finishIntegration: function() {
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(true);
		Ck.actions['ckmapOsmImportImport'].setDisabled(false);
		this.needClean = true;
	},
	
	needClean: false
		
});

