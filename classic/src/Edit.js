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
			ckAction: "ckEditCreate",
			enableToggle: true,
			toggleGroup: "ckmapAction"
		},{
			ckAction: "ckEditAttribute",
			enableToggle: true,
			toggleGroup: "ckmapAction"
		},{
			ckAction: "ckEditGeometry",
			enableToggle: true,
			toggleGroup: "ckmapAction"
		},{
			ckAction: "ckEditDelete",
			enableToggle: true,
			toggleGroup: "ckmapAction"
		},{
			xtype: "splitbutton",
			itemId: "vertex-live-edit",
			iconCls: "fa fa-list",
			tooltip: "Advance operation",
			dock: "right",
			menu: [{
				ckAction: "ckEditCrop",
				xtype: "button",
				text: "Cut",
				enableToggle: true,
				toggleGroup: "ckmapAction",
				iconCls: "fa fa-crop"
			},{
				ckAction: "ckEditUnion",
				xtype: "button",
				text: "Gather",
				enableToggle: true,
				toggleGroup: "ckmapAction",
				iconCls: "fa fa-compress"
			}]
		}]
	}],


	buttons: [{
		text: "Save",
		itemId: "save"
	},{
		text: "Cancel",
		itemId: "cancel"
	},{
		text: "Close",
		itemId: "close"
	}]

});
