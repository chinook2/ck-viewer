/**
 * View for the Integration Panel of the OSM Import.
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.Integration", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportintegration",
	
	/*requires: [
		"Ck.osmimport.integration.*"
	],
	controller: "ckosmimportintegration",
	viewModel: {
		type: "ckosmimportintegration"
	},*/

	layout: 'anchor',
	config: {
		bodyPadding: 10
	},
	items: [{xtype: "container",
			 html: "<p>Panel Integration</p>"
		}],
	
	buttons: [{
		text: "Integration",
		itemId: "integration",
		formBind: true
	},{
		text: "Integration Terminée",
		itemId: "integrationfinished"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-integration"
});
