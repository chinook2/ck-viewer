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
				header: {xtype: "container", height: 0},
				border: true,
				height: 200,
				flex: 0.5,
				bind:{
					store: "{osmtags}"
				},
				itemId: 'osmtags-tree'
			},{
				xtype: "grid",
				flex: 0.4,
				height: 200,
				margin: "0 0 0 10",
				border: true,
				enableColumnHide: false,
				enableColumnMove: false,
				enableColumnResize: false,
				sortableColumns: false,
				columns: [
					{
						xtype: "gridcolumn",
						text: "Selected Tags",
						dataIndex: "text",
						flex: 1
					}
				],
				bind: {
					store: {
						data: "{checkedTags}" 
					}
				},
				reference: "checkedtagslist"
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
					boxLabel: 'Polygon',
					name: 'selection-mode',
					inputValue: 'polygon',
					height: 20
				}, {
					boxLabel: 'Administrative limit from layer',
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
	},{  // Options
		xtype: "fieldset",
		title: "Options",
		collapsible: true,
		collapsed: true,
		items: [{  // Date Selection
			xtype: 'panel',
			layout: 'hbox',
			items: [{
				xtype: "checkbox",
				boxLabel: "Modifications since",
				reference: "sincedate"
			},{
				xtype: "component",
				width: 10
			},{
				xtype: "datefield",
				reference: "datemin",
				maxValue: new Date(),
				format: 'd/m/Y',
				bind: {
					disabled: "{!sincedate.checked}"
				}
			}]
		},{  // Rendering selection
			xtype: "combobox",
			reference: "rendering",
			fieldLabel: "Rendering style",
			bind: {
				store: "{renderings}"
			},
			displayField: "name",
			editable: false
		}]
	}],
	
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
