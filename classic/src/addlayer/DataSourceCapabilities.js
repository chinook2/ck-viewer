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
	height: "auto",
	
	layout: {
		type: "fit"
	},
	
	listeners: {
		click: "onClick",
		render: "initMask"
	}
});
