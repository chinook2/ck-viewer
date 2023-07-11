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

	plugins: [
		'mapprogress',
		'maptooltip'
	],

	layout: {
		type: 'fit'
	},

	config: {
		map: null,

		/**
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
		context: 'ck-default',

		urlTemplate: {
			st: '{0}/context/{1}.json',
			ws: '{0}/context/{1}'
		},

		/**
		 * List of ol.control.
		 */
		controls: {
			/**
			 * Default control. + and - buttons to zoom in and zoom out.
			 */
			Zoom: {
				zoomInTipLabel: Ck.text('action_zoom_in'),
				zoomOutTipLabel: Ck.text('action_zoom_out')
			},

			/**
			 * Control to display layers attributions.
			 */
			Attribution: {},

			/**
			 * Display scale line. False to hide, true to show and object to show with specified parameters.
			 */
			ScaleLine: {},

			/**
			 * Display zoom slider. False to hide, true to show and object to show with specified parameters.
			 *
			 * A parameter is added over openlayers : style. It can take 3 values :
			 * - zoomslider-style1 (default)
			 * - zoomslider-style2
			 * - zoomslider-style3
			 */
			ZoomSlider: {},

			/**
			 * Button to switch between full screen and window mode.
			 */
			FullScreen: {
				className: "ck-full-screen"
			},

			/**
			 * Button to set the north at the top of the screen.
			 */
			Rotate: {
				className: "ck-rotate",
				tipLabel: "Click + AltShift to rotate"
			}
		},

		/**
		 * List of ol.interaction to add to the map.
		 * Pinch interactions is for touch screen devices.
		 */
		interactions: {
			DragRotate: {},
			DragPan: {},
			DoubleClickZoom: {},
			PinchRotate: {},
			PinchZoom: {},
			KeyboardPan: {},
			KeyboardZoom: {},
			MouseWheelZoom: {}
			// DragZoom: {}
		},
        
        disabledTooltip: false // permits to disable displaying tooltip in some cases.
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
