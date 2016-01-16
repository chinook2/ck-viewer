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
				width: 300,
				bind:{
					store: "{osmtags}"
				},
				listeners: {
					checkchange: "onTreeOsmTagsChange"
				}
			},{
				xtype: "grid",
				width: 230,
				height: 200,
				margin: "0 0 0 10",
				border: true,
				enableColumnHide: false,
				enableColumnMove: false,
				enableColumnResize: false,
				sortableColumns: false,
				columns: [{
					xtype: "gridcolumn",
					text: "Selected Tags",
					dataIndex: "text",
					flex: 1
				}],
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
					xtype: "radio",
					name: 'selection-mode'
				},
				reference: "selectionMode",
				items:[{
					checked: true,
					boxLabel: 'Rectangle',
					inputValue: 'rectangle'
				}, {
					boxLabel: 'Polygon',
					inputValue: 'polygon'
				}, {
					boxLabel: 'Polygon Feature from layer',
					inputValue: 'feature'
				}]
			},{
				xtype: "button",
				text: "Selection",
				listeners: {
					click: "onSelectionClick"
				}
			}]
		}]
	},{  // Options
		xtype: "fieldset",
		title: "Options",
		collapsible: true,
		collapsed: true,
		layout: {
			type: "table",
			columns: 2
		},
		items: [{  // Date Selection
			xtype: "checkbox",
			boxLabel: "Modifications since",
			reference: "sincedate",
			margin: "0 10 0 0"
		},{
			xtype: "datefield",
			reference: "datemin",
			maxValue: new Date(),
			format: 'd/m/Y',
			bind: {
				disabled: "{!sincedate.checked}"
			}
		},{
			xtype: "label",
			text: "Rendering Style"
		}, {
			xtype: "combobox",
			reference: "rendering",
			bind: {
				store: "{renderings}"
			},
			displayField: "name"
		}]
	}],
	
	buttons: [{
		text: "Import",
		formBind: true,
		listeners: {
			click: "onImportClick"
		}
	},{
		text: "Cancel",
		listeners: {
			click: "cancel"
		}
	}],

	cls: "ck-osmimport-import"
});
