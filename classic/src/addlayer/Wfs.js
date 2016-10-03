/**
 * This panel list parts of multi-wfs object. Actions that can be undertaken are :
 *  - remove or create sub-wfs
 *  - start vertex addlayerion for one sub-wfs
 *  - crop or merge sub-wfs
 */

Ext.define("Ck.addlayer.Wfs", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckaddlayer-wfs",
	
	controller: "ckaddlayer.wfs",
	
	title: "WFS",
	cls: "ck-addlayer-wfs",
	itemId: "addlayer-wfs",
	height: "auto",
	
	layout: {
		type: "fit"
	},
	
	sources: [],
	
	items: [{
		xtype: 'ckaddlayer-datasourceselector',
		itemId: 'ckaddlayer-wfs-datasourceselector',
		listeners:{
			select: "dataSourceChange"
		}
	},{
		xtype: 'ckaddlayer-datasourcecapabilities',
		itemId: 'ckaddlayer-wfs-datasourcecapabilities',
		service: "WFS",
		autoScroll: true
	}]
});
