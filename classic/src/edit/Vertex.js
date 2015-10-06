/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.edit.Vertex", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckedit-vertex",
	
	controller: "ckedit.vertex",
	
	cls: "ck-edit-vertex",
	itemId: "edit-vertex",
	height: "auto",
	hidden: true,
	
	layout: {
		type: "fit"
	},
	
	items: [{
		xtype: "gridpanel",
		itemId: "vertexgrid",
		selModel: "rowmodel",
		// Disable buffere for UP and DOWN grid loop (decrease display perf)
		bufferedRenderer: false,
		width: "auto",
		height: "auto",
		plugins: [{
			ptype: "cellediting",
			clicksToEdit: 2
		}],
		columns: [
			{
				text: "#",
				dataIndex: "number",
				width: 50,
				hideable: true,
				locked: true
			},{
				text: "X",
				dataIndex: "longitude",
				editor: "numberfield",
				width: 115
			},{
				text: "Y",
				dataIndex: "latitude",
				editor: "numberfield",
				decimalPrecision: 4,
				width: 115
			}
		],
		store: {
			storeId: "editVertexStore",
			fields: ["number", "longitude", "latitude", "geometry"]
		}
	}],
	
	bbar: [{
		text: "Save",
		itemId: "save"
	},{
		text: "Cancel",
		itemId: "cancel"
	},{
		text: "Add vertex",
		itemId: "add-vertex"
	},{
		xtype: "tbtext",
		text: "Position :"
	},{
		xtype: "numberfield",
		itemId: "vertex-position",
		width: 60,
		value: 1,
		minValue: 1,
		allowDecimals: false,
		allowBlank: false,
		hideTrigger: true
	}]	
});
