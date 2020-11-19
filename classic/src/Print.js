/**
 *
 */

Ext.define("Ck.Print", {
	extend: "Ext.form.Panel",
	alias: "widget.ckprint",
	
	requires: [
		"Ck.print.*"
	],

	controller: "ckprint",
	
	viewModel: {
		type: "ckprint"
	},
	
	config: {
		bodyPadding: 10,
		defaultType: "textfield",
		defaults: {
			width: "100%"
		}
	},
	
	items: [{
		fieldLabel: "<b>Titre&nbsp;</b>",
		itemId: "title",
		name: "title"
	},{
		xtype: "combo",
		itemId: "resolution",
		fieldLabel: "<b>Echelle&nbsp;</b>",
		name: "resolution",
		displayField: "scale",
		valueField: "res",
		editable: false
	}/*,{
		xtype: "combo",
		itemId: "printLayout",
		fieldLabel: "<b>Modèle</b>",
		name: "printLayout",
		editable: false,
		store: ["default-layout"]
	}*/,{
		xtype: "combo",
		itemId: "outputFormat",
		fieldLabel: "<b>Type&nbsp;</b>",
		name: "outputFormat",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{outputformats}"
		}
	}/*,{
		xtype: "combo",
		itemId: "dpi",
		fieldLabel: "Dot Per Inch",
		name: "dpi",
		displayField: "dpi",
		valueField: "dpi",
		editable: false,
		bind: {
			"store": "{dpi}"
		}
	}*/,{
		xtype: "combo",
		itemId: "format",
		fieldLabel: "<b>Format&nbsp;</b>",
		name: "format",
		displayField: "label",
		valueField: "id",
		editable: false,
		bind: {
			"store": "{formats}"
		}
	},{
		xtype: "radiogroup",
		itemId: "orientation",
		fieldLabel: "<b>Orientation&nbsp;</b>",
		columns: 2,
		vertical: true,
		name: "orientation",
		items: [
			{boxLabel: "Portrait", name: "orientation", inputValue: "p"},
			{boxLabel: "Paysage", name: "orientation", inputValue: "l"}
		]
	},{
		xtype: "radiogroup",
		itemId: "affleg",
		columns: 3,
		vertical: true,
		fieldLabel:"<b>Légende&nbsp;</b>",
		name: "affleg",
		items: [
			{boxLabel: "Cacher", name: "affleg", inputValue: "naleg",value:1},
			{boxLabel: "Intégrer", name: "affleg", inputValue: "itgleg"},
			{boxLabel: "Séparer", name: "affleg", inputValue: "sprleg"}
		]
	},{
		xtype: "checkbox",
		itemId: "cpr",
		labelWidth:150,
		fieldLabel:"<b>Copyright&nbsp;</b>",
		name: "cpr"
	},{
		xtype: "checkbox",
		itemId: "crtref",
		labelWidth:150,
		name: "crtref",
		fieldLabel: "<b>Carte de référence&nbsp;</b>"
	},{
		xtype: "checkbox",
		itemId: "lstressel",
		labelWidth:150,
		name: "lstressel",
		fieldLabel: "<b>Liste résultat Séléction&nbsp;</b>"
	},{
        xtype: 'numberfield',
        name: 'rotate',
		itemId: "rotate",
        fieldLabel: 'Tourner la carte&nbsp;',
        value: 0,
        maxValue: 360,
        minValue: 0
    }],
	
	buttons: [{
		text: "Print",
		itemId: "print"
	},{
		text: "Cancel",
		itemId: "cancel"
	}],

	cls: "ck-print"
});
