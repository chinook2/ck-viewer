/**
 *
 *
 */
Ext.define('Ck.form.field.Map', {
	extend: 'Ext.form.field.Base',
	alias: 'widget.mapfield',

	requires: [
		'Ext.XTemplate'
	],

	fieldSubTpl: [
		'<div id="{id}">\n',
		'</div>',
		{
			disableFormats: true
		}
	],

	inputCls: Ext.baseCSSPrefix + 'form-map',

	// Map Controller instance for the mapfield
	ckmap: null,

	// Internal geometry to show and edit with the map widget
	geometry: null,

	afterRender: function () {
		this.callParent(arguments);

		// Add map in the form.
		var map = Ext.create(Ext.applyIf({
			xtype: 'ckmap',
			renderTo: this.id + '-bodyEl'
		}, this.initialConfig));
		this.ckmap = map.getController();
	},

	getValue: function(){
		return this.geometry;
	},

	setValue: function (geojsonObject) {
		this.geometry = geojsonObject;

		if(!geojsonObject) return;

		// Need to add the layer after map loaded...
		this.ckmap.on({
			loaded: function(){
				var geojson = new ol.format.GeoJSON();
				var vectorSource = new ol.source.Vector({
					features: geojson.readFeatures(geojsonObject, {
						featureProjection: this.ckmap.getProjection()
					})
				});
				//vectorSource.addFeature(new ol.Feature((new ol.format.GeoJSON()).readGeometry(geomObject) ));

				var vectorLayer = new ol.layer.Vector({
					source: vectorSource,
					style: Ck.map.Style.style
				});

				this.ckmap.getOlMap().addLayer(vectorLayer);

				// Zoom on features
				this.ckmap.setExtent(vectorSource.getExtent());
			},
			scope: this
		})
	},

	beforeDestroy: function(){
		// TODO : destroy map, layer ?
		this.callParent();
	}
});
