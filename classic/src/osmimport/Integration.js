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
		fieldLabel: "Sélectionner la couche d'intégration",
		labelAlign: "top",
		labelStyle: 'font-weight: bold',
		layout: {
			type: "hbox",
			align: "middle"
		},
		items: [{
			xtype: "combobox",
			reference: "layerselection",
			width: 300,
			bind: {
				store: "{layersList}"
			}
		},{
			xtype: "label",
			margin: "0 0 0 10",
			style: {
				"font-style": "italic"
			},
			bind: {
				text: "Géométrie: "
			}
		}]	
	},{  // Geometry to integrate
		xtype: "fieldcontainer",
		fieldLabel: "Selectionner la géométrie à intégrer",
		labelAlign: "top",
		labelStyle: "font-weight: bold",
		items: [{
			xtype: "radiogroup",
			vertical: true,
			columns: 1,
			defaults: {
				xtype: "radio",
				name: 'selection-geometry'
			},
			id: "geometrytointegrate",
			items: [{
				checked: true,
				boxLabel: 'Géométrie de la couche sélectionnée',
				inputValue: 'selectedone'
			}, {
				boxLabel: 'Toutes les géométries',
				inputValue: 'all'
			}]
		}]
	},{  // Informations to integrate
		xtype: "fieldcontainer",
		fieldLabel: "Sélectionner les informations à intégrer",
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
				boxLabel: "Seulement les coordonnées",
				inputValue: "coords"
			},{
				boxLabel: "Coordonnées + Tags",
				inputValue: "coordstags",
				reference: "coordstags"
			}]
		},{  // Panel Attributes / Tags
			xtype: "panel",
			layout: "hbox",
			border: true,
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
					text: "Couche d'intégration"
				},{
					xtype: "grid",
					width: 400,
					height: 180,
					enableColumnHide: false,
					enableColumnMove: false,
					enableColumnResize: false,
					selModel: {mode: "MULTI"},
					columns: {
						items: [
							{
								text: "Attributs",
								dataIndex: "attr"
							},{
								text: "Tag OSM associé",
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
				width: 60,
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
					text: "Couche OSM"
				},{
					xtype: "grid",
					width: 200,
					height: 180,
					enableColumnHide: false,
					enableColumnMove: false,
					enableColumnResize: false,
					columns: [
						{
							xtype: "gridcolumn",
							text: "Tag OSM",
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
		text: "Integration Terminée",
		itemId: "integrationfinished"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-osmimport-integration"
});
