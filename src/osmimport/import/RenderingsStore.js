/**
 * Store to get list of renderings in OSM Import Panel.
 * Data comes from a JSON file in resources
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.import.RenderingsStore", {
	extend: "Ext.data.Store",
	alias: "store.renderingsstore",
	autoLoad: true,
	model: "Ck.osmimport.import.RenderingsModel",
	proxy: {
		type: "ajax",
		url: Ck.getPath() + "/data/renderingsosm.json",
		reader: {
			type: "json",
			rootProperty: "renderings"
		}
	}
});
