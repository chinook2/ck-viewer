/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 */
Ext.define('Ck.printbook.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckprintbook',

	data: {
		printbookParam: {
			title: '',
			etablissement: '',
			niveau: '',
			zone: '',
			thematics: '',
			iterateField: ''
		},
		previewParam: {
			fill: {},
			stroke: {
				color: "#ff8d00",
				width: 5
			}
		}
	},

	/**
	 * @ignore
	 */
	stores: {
		pbEtablissementStore: {
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: Ck.getOption('api') + 's=bim&r=listetablissement'
			},
			reader: {
				type: 'json',
				rootProperty: 'etablissement',
				record: 'etablissement'
			},sorters:[{
				property: "etablissement",
				direction:'ASC'
			}]
		},
		pbNiveauStore: {
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: Ck.getOption('api') + 's=bim&r=listniveau'
			},
			reader: {
				type: 'json',
				rootProperty: 'niveau',
				record: 'niveau'
			},sorters:[{
				property: "niveau",
				direction:'ASC'
			}]
		},
		pbZoneStore: {
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: Ck.getOption('api') + 's=bim&r=listzone'
			},
			reader: {
				type: 'json',
				rootProperty: 'zone',
				record: 'zone'
			},sorters:[{
				property: "zone",
				direction:'ASC'
			}]
		},
		pbThematicsStore: {
			fields: ["thematics"],
			proxy: {
				type: 'ajax',
				url: Ck.getOption('api') + 's=printbook&r=listThematics'
			},
			reader: {
				type: 'json',
				rootProperty: 'thematics',
				record: 'thematics'
			},sorters:[{
				property: "thematics",
				direction:'ASC'
			}]
		},
		pbThematicsValuesStore: {
			proxy: {
				type: 'ajax',
				url: Ck.getOption('api') + 's=printbook&r=listThematicsValues', 
			},
			reader: {
				type: 'json',
				rootProperty: 'thematiques_values',
				record: 'thematiques_values'
			},sorters:[{
				property: "thematiques_values",
				direction:'ASC'
			}]
		},
		resolutions: {
			fields: ["scale", "res"],
			data: []
		},
		formats: {
			fields: ["id", "label", "ratio"],
			data: [
				{id: "a4", label: "A4", ratio: 1.00},
				{id: "a3", label: "A3", ratio: 1.41},
			]
		},
		outputFormats: {
			fields: ["id", "label"],
			data: [
				{id: "pdf", label: "PDF"}
			]
		},
	}
});
