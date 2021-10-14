/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 */
Ext.define('Ck.print.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckprint',

	data: {
		printParam: {
			affleg: "naleg",
			cpr: "nacpr",
			crtref: 0,
			resolution: 1,
			printLayout: "default-layout",
			outputFormat: "png",
			dpi: 150,
			format: "a4",
			orientation: 'p'
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
		outputformats: {
			fields: ["id", "label"],
			data: [
				{id: "jpg", label: "JPG"},
				{id: "png", label: "PNG"},
				{id: "pdf", label: "Pdf"}
			]
		},
		formats: {
			fields: ["id", "label"],
			data: [
				{id: "a4", label: "A4"},
				{id: "a3", label: "A3"},
				{id: "a2", label: "A2"},
				{id: "a1", label: "A1"},
				{id: "a0", label: "A0"}
			]
		},
		dpi: {
			fields: ["dpi"],
			// data: [{dpi: 72}, {dpi: 96}, {dpi: 150}, {dpi: 300}, {dpi: 600}, {dpi: 900}, {dpi: 1200}]
			data: [{dpi: 150}]
		}
	}
});