/**
 * Data binding for map view. Allow to display parameters in the view and change parameters (two-way).
 */
Ext.define('Ck.draw2.Model', {
	extend: 'Ext.app.ViewModel',

	alias: 'viewmodel.ckdraw2',

	data: {
		defaultParam: {
			operation: "select",
			type: "",
			point: {
				color: "#c8c818",
				radius: 1,
				opacity: 100
			},
			line: {
				color: "#c8c818",
				width: 1,
				opacity: 100
			},
			polygon: {
				backgroundColor: '#c8c818',
				backgroundOpacity: 100,
				borderColor: "#c8c818",
				borderWidth: 1,
				borderOpacity: 100
			}
		}
	},
	
	/**
	 *
	 */
	stores: {
		operation: {
			fields: ["id", "label"],
			data: [
				{ id: "select", label: "Add object" },
				{ id: "modify", label: "Edit object" }
			]
		},
		type: {
			fields: ["type"],
			data: [
				{ type: "" },
				{ type: "point" },
				{ type: "line" }, 
				{ type: "polygon" }
			]
		}
	}
});
