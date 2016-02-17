/**
 *
 */

Ext.define("Ck.result.Feature", {
	extend: "Ext.grid.Panel",
	alias: "widget.ckresult-feature",
	
	controller: "ckresult.feature",
	
	title: "Features",
	flex: 1,
	
	config: {
		/**
		 * @param {Object[]}
		 */
		extraMenu: []
	},
	
	bbar: [{
		xtype: "pagingtoolbar",
		itemId: "feature_paging",
		displayInfo: true,
		displayMsg: "Displaying features {0} - {1} of {2}",
		emptyMsg: "No features to display"
	}]
});
