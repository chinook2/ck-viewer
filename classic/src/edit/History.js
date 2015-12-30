/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.edit.History", {
	extend: "Ext.grid.Panel",
	alias: "widget.ckedit-history",
	
	controller: "ckedit.history",
	
	cls: "ck-edit-history",
	itemId: "edit-history",
	
	columns: [{
		text: "#",
		dataIndex: "number",
		width: 35,
		menuDisabled: true,
		sortable: false,
		resizable: false
	},{
		text: "FeatureID",
		dataIndex: "featureId",
		width: 250,
		menuDisabled: true,
		sortable: false
	},{
		text: "Action",
		dataIndex: "action",
		menuDisabled: true,
		sortable: false,
		flex: 1
	}],
	store: {
		storeId: "editHistoryStore",
		fields: ["number", "featureId", "action", "id", "actionId",  "feature"]
	}
	
});
