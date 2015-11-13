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
				bind:{
					store: "{osmtags}"
				},
				itemId: 'osmtags-tree'
			},{
				xtype: "grid",
				flex: 0.2,
				margin: "0 0 0 10"
			}]
		},{
			xtype: "checkbox",
			boxLabel: "Expert Mode",
			reference: "tagsexpert"
		},{
			xtype: "textarea",
			anchor: '100%',
			bind: {
				hidden: "{!tagsexpert.checked}"
			},
			reference: "tagsexperttext"
		}]
	},{ // Selection zone
		xtype: "fieldset",
		title: "Selection Mode",
		items: [{
			xtype: "panel",
			layout: "hbox",
			items: [{
				xtype: "radiogroup",
				vertical: true,
				columns: 1,
				defaults: {
					xtype: "radio"
				},
				id: "selectionMode",
				items:[{
					checked: true,
					boxLabel: 'Rectangle',
					name: 'selection-mode',
					inputValue: 'rectangle',
					height: 20
				}, {
					boxLabel: 'Polygone',
					name: 'selection-mode',
					inputValue: 'polygone',
					height: 20
				}, {
					boxLabel: 'Administrative limite from layer',
					name: 'selection-mode',
					inputValue: 'admin',
					height: 20,
					bind: {
						disabled: "{!adminSelectAvailable}"
					}
				}]
			},{
				xtype: "button",
				text: "Selection",
				itemId: "btnSelection"
			}]
		}]
	},{
		xtype: "fieldset",
		title: "Options",
		collapsible: true,
		collapsed: true,
		items: [{
			xtype: 'panel',
			layout: 'hbox',
			items: [{
				xtype: "checkbox",
				boxLabel: "Modifications since",
				reference: "sincedate",
				itemId: "sincedate"
			},{
				xtype: "component",
				width: 10
			},{
				xtype: "datefield",
				itemId: "date-min",
				maxValue: new Date(),
				format: 'd/m/Y',
				bind: {
					disabled: "{!sincedate.checked}"
				}
			}]
		}]}
	/*,{ // Selection Date
		
	},{ // Selection rendering
		
	}*/],
	
	buttons: [{
		text: "Import",
		itemId: "import",
		formBind: true
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-import"
});
