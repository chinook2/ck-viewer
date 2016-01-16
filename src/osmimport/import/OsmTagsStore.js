/**
 * Store to set the Tree for OSM Tags in OSM Import Panel.
 * Data comes from a JSON file in resources
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.OsmTagsStore', {
	extend: 'Ext.data.TreeStore',
	alias: 'store.osmtagsstore',
	autoLoad: true,
	proxy: {
		type: 'ajax',
		url: Ck.getPath() + '/data/tagsosm.json',
		reader: {
			type: 'json',
			rootProperty: 'children'
		}
	}
});
