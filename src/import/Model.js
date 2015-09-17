/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 */
Ext.define('Ck.import.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckimport',

	data: {
		importParam: {
			format: "shp",
			projection: "4326"
		},
		layerParam: {
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
		format: {
			fields: ["id", "label"],
			data: [
				{id: "shp", label: "ShapeFile"},
				{id: "mif", label: "MapInfo MIF/MID"},
				{id: "gpx", label: "GPX"},
			]
		},
		projection: {
			fields: ["id", "label"],
			data: [
				{id: "4326", label: "WGS 84"},
				{id: "2154", label: "Lambert 93"}
			]
		}
	}
});