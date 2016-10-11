/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.addlayer.Wfs", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckaddlayer-wfs",
	
	itemId: "addlayer-wfs",
	controller: "ckaddlayer.wfs",
	
	title: "WFS",
	cls: "ck-addlayer-wfs",
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
		service: "WFS"
	}]
});
