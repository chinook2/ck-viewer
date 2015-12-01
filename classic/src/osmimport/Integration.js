/**
 * View for the Integration Panel of the OSM Import.
 * @author Florent RICHARD
 */
Ext.define("Ck.osmimport.Integration", {
	extend: "Ext.form.Panel",
	alias: "widget.ckosmimportintegration",
	
	requires: [
		"Ck.osmimport.integration.*"
	],
	controller: "ckosmimportintegration",
	viewModel: {
		type: "ckosmimportintegration"
	},

	layout: 'anchor',
	config: {
		bodyPadding: 10
	},
	items: [{ // Layer Selection
		xtype: "fieldcontainer",
		fieldLabel: "Select the integration layer",
		labelAlign: "top",
		labelStyle: 'font-weight: bold',
		layout: {
			type: "hbox",
			align: "middle"
		},
		items: [{
			xtype: "combobox",
			reference: "layerselection",
			itemId: "layerselection",
			width: 300,
			bind: {
				store: {
					data:"{layersList}",
					fields: ["title", "id"]
				}
			},
			displayField: "title",
			valueField: "id",
			editable: false
		},{
			xtype: "label",
			margin: "0 0 0 10",
			style: {
				"font-style": "italic"
			},
			reference: "geometrylabel"
		}]	
	},{  // Geometry to integrate
		xtype: "fieldcontainer",
		fieldLabel: "Select the geometry to integrate",
		labelAlign: "top",
		labelStyle: "font-weight: bold",
		items: [{
			xtype: "radiogroup",
			vertical: true,
			columns: 1,
			defaults: {
				xtype: "radio"
			},
			id: "geometrytointegrate",
			items: [{
				checked: true,
				boxLabel: "Selected layer's geometry",
				inputValue: 'selectedone'
			},{
				boxLabel: 'All geometries',
				inputValue: 'all',
				reference: "selectAllGeometries"
			}]
		},{
			xtype: "label",
			cls: Ext.baseCSSPrefix + "fa fa-warning",
			data: "Some data need a conversion.",
			style: {
				"color": "orange"
			},
			bind: {
				hidden: "{!selectAllGeometries.checked}"
			}
		}]
	},{  // Informations to integrate
		xtype: "fieldcontainer",
		fieldLabel: "Select informations to integrates",
		labelAlign: "top",
		labelStyle: "font-weight: bold",
		items: [{
			xtype: "radiogroup",
			vertical: true,
			columns: 1,
			defaults: {
				xtype: "radio",
				name: "information-level"
			},
			id: "informationtointegrate",
			items: [{
				checked: true,
				boxLabel: "Only coordinates",
				inputValue: "coords"
			},{
				boxLabel: "Coordinates + Tags",
				inputValue: "coordstags",
				reference: "coordstags"
			}]
		},{  // Panel Attributes / Tags
			xtype: "panel",
			layout: "hbox",
			border: true,
			bodyPadding: 10,
			bind: {
				hidden: "{!coordstags.checked}"
			},
			defaults: {
				height: 200
			},
			items: [{
				xtype: "panel",
				layout: {
					type: "vbox",
					align: "middle"
				},
				items: [{
					xtype: "label",
					text: "Integration Layer"
				},{
					xtype: "grid",
					border: true,
					width: 400,
					height: 180,
					enableColumnHide: false,
					enableColumnMove: false,
					enableColumnResize: false,
					selModel: {mode: "MULTI"},
					columns: {
						items: [
							{
								text: "Attributes",
								dataIndex: "attr"
							},{
								text: "Associated OSM Tag",
								dataIndex: "tag"
							}
						],
						defaults: {
							width: 180
						}
					},
					bind: {
						store: {data: "{layersAttributes}"}
					}
				}]
			},{
				xtype: "panel",
				layout: {
					type: "vbox",
					align: "middle",
					pack: "center"
				},
				flex:1,
				defaults: {
					xtype: "button",
					margin: "10"
				},
				items: [{
					iconCls: "fa fa-caret-left"
				},{
					iconCls: "fa fa-caret-right"
				}]
			},{
				xtype: "panel",
				layout: {
					type: "vbox",
					align: "middle"
				},
				items: [{
					xtype: "label",
					text: "OSM Layer"
				},{
					xtype: "grid",
					width: 200,
					height: 180,
					border: true,
					enableColumnHide: false,
					enableColumnMove: false,
					enableColumnResize: false,
					columns: [
						{
							xtype: "gridcolumn",
							text: "OSM Tag",
							dataIndex: "tag",
							width: 180
						}
					],
					bind: {
						store: {data: "{tagsOsm}"}
					}
				}]
			}]
		}]
	}],
	
	buttons: [{
		text: "Integration",
		itemId: "integration"
	},{
		text: "Integration Finished",
		itemId: "integrationfinished"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-integration"
});
