/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.addlayer.DataSourceCapabilities", {
	extend: "Ext.tree.Panel",
	alias: "widget.ckaddlayer-datasourcecapabilities",
	
	controller: "ckaddlayer.datasourcecapabilities",
	
	itemId: "addlayer-datasourcecapabilities",
	
	manageHeight: false,
	syncRowHeight: false,
	rootVisible: false,
	
	root: {
		title: "Layers"
	},
	store: {
		xtype: "store.tree",
		autoLoad: false,
		clearOnLoad: true,
		proxy: {
			type: "capabilitiesloader"
		}
	}
});
