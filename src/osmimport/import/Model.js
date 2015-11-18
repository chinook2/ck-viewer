/**
 * ViewModel to do Data binding for OSM Import Panel
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckosmimportimport',

	requires: [
	    "Ck.osmimport.import.OsmTagsStore"
	],
	data: {
		checkedTags: [],
		adminSelectAvailable: false
	},
		
	stores: {
		osmtags: {type: 'osmtagsstore'}
	}
});