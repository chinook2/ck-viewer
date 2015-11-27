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
			fields: ["number", "area", "feature"]
		}
	}],
	
	bbar: [{
		iconCls: 'fa fa-check',
		itemId: "save"
	},{
		iconCls: 'fa fa-remove',
		itemId: "cancel"
	},"->",{
		action: "ckEditCreate",
		enableToggle: true,
		toggleGroup: "feature-tools"
	},{
		iconCls: 'fa fa-edit',
		itemId: "geometry"
	},{
		iconCls: 'fa fa-remove',
		itemId: "delete"
	},{
		xtype: "splitbutton",
		itemId: "vertex-live-edit",
		iconCls: "fa fa-list",
		tooltip: "Advance operation",
		dock: "right",
		menu: [{
			action: "ckEditCrop",
			xtype: "button",
			text: "Crop in half",
			enableToggle: true,
			toggleGroup: "feature-tools",
			iconCls: "fa fa-crop"
		},{
			action: "ckEditUnion",
			xtype: "button",
			text: "Gathering",
			enableToggle: true,
			toggleGroup: "feature-tools",
			iconCls: "fa fa-compress"
		}]
	}]
});
