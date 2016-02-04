/**
 *
 */

Ext.define("Ck.addlayer.SourceCapabilities", {
	extend: "Ext.tree.TreePanel",
	alias: "widget.ckaddlayer-sourcecapabilities",

	controller: "ckaddlayer.sourcecapabilities",
	columns: [{
		xtype: "treecolumn",
		dataIndex: "Title",
		text: "Layers",
		flex: 1
	}],

	config: {
		rootVisible : false,
		defaultType: "combo",
		hideHeaders: true,
		defaults: {
			width: "100%"
		},
		useArrows: true
	}
});
