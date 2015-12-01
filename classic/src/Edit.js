/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.Edit", {
	extend: "Ext.Panel",
	alias: "widget.ckedit",
	
	controller: "ckedit",
	
	cls: "ck-edit",

	requires: [
		"Ck.edit.*",
		"Ck.edit.action.*"
	],
	
	editConfig: {
		layerId: "ckedit-layer",
		snapLayer: "",
		tolerance: 10000,
		deleteConfirmation: true
	},
	
	layout: {
		type: "fit"
	},
	
	items: [{
		id: "edit-historypanel",
		tbar: [{
			action: "ckEditCreate",
			enableToggle: true,
			toggleGroup: "edit-tools"
		},{
			action: "ckEditAttribute",
			enableToggle: true,
			toggleGroup: "edit-tools"
		},{
			action: "ckEditGeometry",
			enableToggle: true,
			toggleGroup: "edit-tools"
		},{
			action: "ckEditDelete",
			enableToggle: true,
			toggleGroup: "edit-tools"
		},{
			xtype: "splitbutton",
			itemId: "vertex-live-edit",
			iconCls: "fa fa-list",
			tooltip: "Advance operation",
			dock: "right",
			menu: [{
				action: "ckEditCrop",
				xtype: "button",
				text: "Cut",
				enableToggle: true,
				toggleGroup: "edit-tools",
				iconCls: "fa fa-crop"
			},{
				action: "ckEditUnion",
				xtype: "button",
				text: "Gather",
				enableToggle: true,
				toggleGroup: "edit-tools",
				iconCls: "fa fa-compress"
			}]
		}]
	}],
	

	buttons: [{
		text: "Close",
		itemId: "close"
	}]
	
});
