/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 */
Ext.define('Ck.print.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckprint',

	data: {
		printParam: {
			title: "",
			resolution: null,
			layout: "default-layout",
			outputFormat: "pdf",
			dpi: 192,
			format: "a4",
			shape: {shape: 'r'},
			orientation: {orientation: 'p'}
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
		resolutions: {
			fields: ["scale", "res"],
			data: []
		},
		
		layouts: {
			fields: ["id", "label", "packageName"],
			data: [
				{id: "default-layout", label: "Default"},
				{id: "default-layout-p-c", label: "Portrait Carré"},
				{id: "default-layout-p-r", label: "Portrait Rectangle"},
				{id: "default-layout-l-c", label: "Landscape Carré"},
				{id: "default-layout-l-r", label: "Landscape Rectangle"}
			],
		},
		outputFormats: {
			fields: ["id", "label"],
			data: [
				{id: "jpg", label: "JPG"},
				{id: "png", label: "PNG"},
				{id: "pdf", label: "PDF"}
			]
		},
		formats: {
			fields: ["id", "label", "ratio"],
			data: [
				{id: "a4", label: "A4", ratio: 1.00},
				{id: "a3", label: "A3", ratio: 1.41},
/* 				{id: "a2", label: "A2", ratio: 2.00},
				{id: "a1", label: "A1", ratio: 2.83} */
			]
		},
		dpis: {
			fields: ["id", "dpi"],
			data: [
				{id:72, dpi: 72}, 
				{id:96, dpi: 96}, 
				{id:150, dpi: 150}, 
				{id:300, dpi: 300}, 
				{id:600, dpi: 600}, 
				{id:900, dpi: 900}, 
				{id:1200, dpi: 1200}
			]
		}
	}
});
