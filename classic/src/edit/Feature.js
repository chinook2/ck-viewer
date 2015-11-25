/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.edit.Feature", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckedit-feature",
	
	controller: "ckedit.feature",
	
	cls: "ck-edit-feature",
	itemId: "edit-feature",
	height: "auto",
	hidden: true,
	
	layout: {
		type: "fit"
	},
	
	items: [{
		xtype: "gridpanel",
		itemId: "featuregrid",
		selModel: "rowmodel",
		width: "auto",
		height: "auto",
		columns: [
			{
				text: "#",
				dataIndex: "number",
				width: 50,
				hideable: true,
				locked: true
			},{
				text: "Area",
				dataIndex: "area",
				width: 230
			}
		],
		store: {
			storeId: "editFeatureStore",
			fields: ["number", "area", "geometry"]
		}
	}],
	
	bbar: [{
		iconCls: 'fa fa-check',
		itemId: "save"
	},{
		iconCls: 'fa fa-remove',
		itemId: "cancel"
	},{
		iconCls: 'fa fa-plus',
		itemId: "create"
	},{
		iconCls: 'fa fa-edit',
		itemId: "geometry"
	},{
		iconCls: 'fa fa-remove',
		itemId: "delete"
	}]
});
