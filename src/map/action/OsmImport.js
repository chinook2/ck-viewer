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
	osmapi: new Ck.osmimport.OsmImportStore(),
	finishImport: function() {
		Ck.actions['ckmapOsmImportImport'].setDisabled(true);
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(false);
	},
	
	finishIntegration: function() {
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(true);
		Ck.actions['ckmapOsmImportImport'].setDisabled(false);
	}
		
});

