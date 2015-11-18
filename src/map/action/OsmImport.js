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
	importDone: false,
	
	finishImport: function() {
		importDone = true;
		Ck.actions['ckmapOsmImportImport'].setDisabled(true);
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(false);
	},
	
	finishIntegration: function() {
		importDone = false;
		Ck.actions['ckmapOsmImportIntegration'].setDisabled(true);
		Ck.actions['ckmapOsmImportImport'].setDisabled(false);
	}
		
});

