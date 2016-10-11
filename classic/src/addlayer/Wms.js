/**
 * This panel list parts of multi-wms object. Actions that can be undertaken are :
 *  - remove or create sub-wms
 *  - start vertex addlayerion for one sub-wms
 *  - crop or merge sub-wms
 */

Ext.define("Ck.addlayer.Wms", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckaddlayer-wms",
	
	itemId: "addlayer-wms",
	controller: "ckaddlayer.wms",
	
	title: "WMS",
	cls: "ck-addlayer-wms",
	height: "100%",
	
	layout: "vbox",
	
	sources: [],
	
	items: [{
		xtype: 'ckaddlayer-datasourceselector',
		flex: 0,
		width: "100%",
		listeners:{
			select: "dataSourceChange"
		}
	},{
		xtype: 'ckaddlayer-datasourcecapabilities',
		flex: 1,
		width: "100%",
		service: "WMS"
	}]
});
