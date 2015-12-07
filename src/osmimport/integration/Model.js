/**
 * ViewModel to do Data binding for OSM Integration Panel
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.integration.Model', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.ckosmimportintegration',

	data: {
		layersList: [],
		layersAttributes: [],
		tagsOsm: []
	}
});
