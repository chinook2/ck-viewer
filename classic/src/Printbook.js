/**
 *
 */

Ext.define("Ck.Printbook", {
	extend: "Ext.form.Panel",
	alias: "widget.ckprintbook",
	xtype: 'form-multicolumn',
	requires: [
		"Ck.printbook.*"
	],
	controller: "ckprintbook",
    resizable: true,
	viewModel: {
		type: "ckprintbook"
	},
	config: {
		width:"100%"
	},
	bodyPadding: 0,
    layout: 'column',
    defaults: {
        layout: 'form',
        xtype: 'container',
        defaultType: 'combo',
		queryMode: "local",
		editable:false
    },
	/**
	 * itemId needed for field getCmp, name needed for getValues
	 */
	items: [{
		columnWidth:1,
			items: [{
				itemId: "pbLabelIntro",
				name: "pbLabelIntro",
				xtype: "label",
				width: '100%',
				html: "<p style='margin:0px'>La thématique utilisée dans l'application sera reprise lors de l'impression.</p>",
			}]
	},{
		columnWidth:0.5,
		items: [{
			itemId: "reportName",
			name: "reportName",
			xtype: "textfield",
			fieldLabel: "Titre du carnet de plan...",
			editable: true,
			allowBlank: false
		},{
			xtype: "radiogroup",
			name: "pbOutputFormat",
			itemId: "pbOutputFormat",
			fieldLabel: "Format d'impression",
			columns: 2,
			vertical: true,
			items: [
				{boxLabel: "A4", name: "pbOutputFormat", inputValue: "A4", checked: true, padding: "0 20 0 0"},
				{boxLabel: "A3", name: "pbOutputFormat", inputValue: "A3"}
			],
			bind: { value: "{printbookParam.pbOutputFormat}" }
		},{
			itemId: "pbLabelFilters",
			name: "pbLabelFilters",
			xtype: "label",
			width: '100%',
			html: "<h3 style='margin-bottom:0px'>Filtrer l'impression par :</h3>",
		},{
			itemId: "pbEtablissementFilter",
			name: "pbEtablissementFilter",
			reference: "pbEtablissementFilter",
			fieldLabel: "Etablissement",
			displayField: "etablissement",
			valueField: "bbetablissement",
			width: '100%',
			bind: {
				store: "{pbEtablissementStore}",
				value: "{printbookParam.pbEtablissementStore}"
			}
		},{
			itemId: "pbNiveauFilter",
			name: "pbNiveauFilter",
			reference: "pbNiveauFilter",
			fieldLabel: "Niveau",
			displayField: "niveau",
			valueField: "bbniveau",
			width: '100%',
			bind: {
				store: "{pbNiveauStore}",
				value: "{printbookParam.pbNiveauStore}"
			}
		},{
			itemId: "pbZoneFilter",
			name: "pbZoneFilter",
			reference: "pbZoneFilter",
			fieldLabel: "Zone",
			displayField: "zone",
			valueField: "bbzone",
			width: '100%',
			bind: {
				store: "{pbZoneStore}",
				value: "{printbookParam.pbZoneStore}",
				disabled: "{disabledFilter}"
			},
			disabled: false
		}]
	},{
		columnWidth:0.5,
		items: [{
			xtype: "radiogroup",
			name: "iterateField",
			itemId: "iterateField",
			fieldLabel: "Objet d'itération",
			columns: 2,
			vertical: true,
			items: [
				{boxLabel: "Zone", name: "iterateField", inputValue: "zone", checked: true, padding: "0 20 0 0"},
				{boxLabel: "Local", name: "iterateField", inputValue: "pre_code_local_gmao"}
			],
			bind: { value: "{printbookParam.iterateField}" }
		},{
			itemId: "pbLabelThematics",
			name: "pbLabelThematics",
			xtype: "label",
			html: "<h3 style='margin-bottom:0px'>Filtres supplémentaires :</h3>",
		},{
			itemId: "pbThematics",
			name: "pbThematics",
			reference:"pbThematics",
			fieldLabel: "Filtres supplémentaires",
			displayField: "thematics",
			valueField: "thematics",
			width: '100%',
			bind: {
				store: "{pbThematicsStore}",
				value: "{printbookParam.pbThematicsStore}"
			}
		},{
			xtype: "tagfield",
			itemId: "tagThematicsValues",
			reference: "tagThematicsValues",
			name: "tagThematicsValues",
			padding : "7px",
			width: "100%",
			fieldLabel: "Valeurs du filtre supplémentaire",
			displayField: "thematiques_values",
			valueField: "thematiques_values",
			typeAhead: true,
			minChars: 0,
			queryParam: "searchStr",
			emptyText: "Tous",
			queryMode: "local",
			bind: {
				store: "{pbThematicsValuesStore}",
				value: "{printbookParam.pbThematicsValuesStore}"
			},
			filterPickList: true,
			publishes: "value",
			allowBlank: true,
			multiselect: true
		}]
	}],
		/* ,{
		columnWidth:0.5,
		items: [{
			itemId: "outputFormat",
			name: "outputFormat",
			fieldLabel: "Format de sortie",
			displayField: "label",
			valueField: "id",
			bind: {
				store: "{outputFormats}",
				value: "{printParam.outputFormat}"
			},
			hidden: true
		}]} */


	buttons: [{
		text: "Imprimer",
		handler: "beforePrintbook"
	},{
		text: "Cancel",
		itemId: "cancelPrintbook",

	}],

	cls: "ckprint"
});
