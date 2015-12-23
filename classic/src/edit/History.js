/**
 * This panel contains tools to edit layer attributes and layer geometries
 */

Ext.define("Ck.edit.History", {
	extend: "Ext.grid.Panel",
	alias: "widget.ckedit-history",
	
	controller: "ckedit.history",
	
	cls: "ck-edit-history",
	itemId: "edit-history",
	
	columns: [
		{ text: "#", dataIndex: "number", width: 35 },
		{ text: "FeatureID", dataIndex: "featureId" },
		{ text: "Action", dataIndex: "action" }
	],
	store: {
		storeId: "editHistoryStore",
		fields: ["number", "featureId", "action", "id", "actionId",  "feature"]
	}
	
});
