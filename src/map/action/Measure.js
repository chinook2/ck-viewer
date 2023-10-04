/**
 * Base class for measure actions.
 *
 * See : Ck.map.action.measure.Length, Ck.map.action.measure.Area ...
 *
 * Code from : http://openlayers.org/en/master/examples/measure.html?q=measure
 */
Ext.define('Ck.map.action.Measure', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapMeasure',

	itemId: 'measure',
	text: '',
	iconCls: 'ckfont ck-measures',
	tooltip: '',

	toggleGroup: 'ckmapAction',
	
	requires: ["Ck.Measure"],
	
	/**
	 * The type of the measure. Possible value : length, area, radius
	 */
	type: 'length',
	
	/**
	 * @type {Ck.Measure}
	 */
	measure: null,

	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */
	sketch: null,

	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	measureTooltipElement: null,

	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	measureTooltip: null,

	/**
	 * @var {ol.interaction.Draw}
	 */
	draw: null,

	/**
	 * Measure type -> ol.interaction.Draw type association
	 */
	typeAssoc: {
		area: "Polygon",
		length: "LineString",
		radius: "Circle"
	},
	
	helpMessages: {
		/**
		 * Message to show when the user start measure.
		 */
		startMsg : 'Click to start measuring (shift and hold click for free measure)',

		/**
		 * Message to show when the user is measuring.
		 */
		continueMsg: 'Click to continue measuring'
	},

	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.measure = Ck.Measure.getInstance({map: map});

		// Create draw interaction for measure drawing
		var gtype = this.typeAssoc[this.type];

		this.draw = new ol.interaction.Draw({
			source: this.measure.getSource(),
			type: gtype,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.5)',
					lineDash: [10, 10],
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 0, 0.7)'
					}),
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					})
				})
			})
		});
		this.olMap.addInteraction(this.draw);
		this.draw.setActive(false);

		// Tooltip and label managment
		this.measure.createMeasureTooltip();
		this.draw.on('drawstart', function(evt) {
			this.setHelpMsg(this.helpMessages.continueMsg);
			this.measure.measureStart(evt);
		}.bind(this));
		this.draw.on('drawend', function(evt) {
			this.setHelpMsg(this.helpMessages.startMsg);
			this.measure.measureEnd(evt);
		}.bind(this));
		
		// Update snap interaction
		this.measure.updateMeasureSnapping();
	},

	/**
	 *
	 */
	toggleAction: function(btn, pressed) {
		var me = this;
		if(!this.draw) return;
		this.draw.setActive(pressed);
		if(this.tip) this.tip.setVisible(pressed);
		if(pressed) {
			if (!this.measureTooltipElement) {
				this.measure.createMeasureTooltip();
			}
            this.olMap.on('pointermove', function(evt) {
				this.measure.pointerMoveHandler(evt);
			}.bind(this));
			// fix for touch device
			this.olMap.on('singleclick', function(evt) {
				this.measure.pointerMoveHandler(evt);
			}.bind(this));
			this.setHelpMsg(this.helpMessages.startMsg);
		} else {
            this.olMap.un('pointermove', function(evt) {
				this.measure.pointerMoveHandler(evt);
			}.bind(this));
			this.olMap.un('singleclick', function(evt) {
				this.measure.pointerMoveHandler(evt);
			}.bind(this));
			this.setHelpMsg(null);

			// Force clear tooltip if toggle off measure tool when drawing
			this.measure.clearTooltip();
			
			this.measureTooltipElement = null;
			this.sketch = null;
		}
	}
});
