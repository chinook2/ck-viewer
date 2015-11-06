/**
 * View for the Import Panel of the OSM Import.
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.Import", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportimport",
	
	requires: [
		"Ck.osmimport.import.*"
	],
	controller: "ckosmimportimport",
	viewModel: {
		type: "ckosmimportimport"
	},

	layout: 'anchor',
	config: {
		bodyPadding: 10
	},

	items: [{ // Tags OSM Selection
		xtype: "fieldset",
		title: "OSM Tags Selection",
		items: [{
			xtype: "panel",
			layout: "hbox",
			items: [{
				xtype: "treepanel",
				rootVisible: false,
				scrollable: true,
				border: true,
				height: 200,
				flex: 0.6,
				margin: "10",
				bind:{
					store: "{osmtags}"
				},
				itemId: 'osmtags-tree'
			},{
				xtype: "grid",
				flex: 0.2,
				margin: "10"
			}]
		},{
			xtype: "checkbox",
			boxLabel: "Expert Mode",
			reference: "tagsexpert"
		},{
			xtype: "textareafield",
			anchor: '100%',
			bind: {
				hidden: "{!tagsexpert.checked}"
			},
			reference: "tagsexpert"
		}]
	}/*,{ // Selection zone
		
	},{ // Selection Date
		
	},{ // Selection rendering
		
	}*/],
	
	buttons: [{
		text: "Import",
		itemId: "import"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-import"
});
