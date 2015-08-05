/**
 * The most important view in the application the Ck.Map view (ckmap) load the <a href="http://www.openlayers.org">OpenLayers</a> librarie to display the map.
 *
 * To add a map simply add a ckmap in the UI  layout.
 *
 *     {
 *         "xtype": "ckmap",
 *         "center": [260000, 5900000],
 *         "zoom": 6
 *     }
 * 
 * See also the Ck.map.Model and Ck.map.Controller to interact with the map and OpenLayers.
 */
Ext.define("Ck.Map", {
	extend: "Ext.panel.Panel",
	alias: "widget.ckmap",
	
	requires: [
		'Ck.map.*'
	],

	controller: "ckmap",
	
	viewModel: {
		type: "ckmap"
	},

	layout: {
		type: 'fit'
	},
	
	config: {
		map: null,
		
		/**
		 * @cfg {Array} center
		 * The initial center of the map [x, y]
		 */
		center: [0, 0],
		
		/**
		 * The initial zoom level of the map.
		 */
		zoom: 2,
		
		/**
		 * The decimal precision of the coordinates when displaying the center or extent of the map.
		 */
		coordPrecision: 2,
		
		/**
		 * The initial context to load.
		 */
		context: 'default'
	},

	/* TODO : voir si peut simplifier des choses ?
	publishes: [
		'center',
		'zoom',
		'coordPrecision'
	],
	*/
	
	/**
	 * @private
	 * Base class name for the map. DO NOT EDIT !
	 *
	 * This class name is used to find a ckmap in the DOM.
	 */
	cls: 'ck-map',
	
	listeners: {
		resize: 'resize' // The resize handle is necessary to set the map!
	}
});