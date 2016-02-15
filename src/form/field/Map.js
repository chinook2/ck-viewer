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
		'<div id="{id}" class="{fieldCls}"></div>',
		{
			compiled: true,
			disableFormats: true
		}
	],

	inputCls: Ext.baseCSSPrefix + 'form-map',

	allowBlank: true,
	blankText: 'This field is required',
	invalidCls: 'ck-form-mapfield-invalid',
	
	map: null,
	
	// Map Controller instance for the mapfield
	ckmap: null,

	// Internal geometry to show and edit with the map widget
	geometry: null,
	
	initComponent: function() {
		this.map = Ext.create(Ext.applyIf({
			xtype: 'ckmap'
		}, this.initialConfig));
		this.ckmap = this.map.getController();

		this.on('resize', function(){
			this.map.setSize(this.getSize());
		}, this);
		
		this.callParent(arguments);
	},
	
	afterRender: function () {
		this.callParent(arguments);
		this.map.render(this.inputEl);
	},

	getValue: function(){
		return this.geometry;
	},

	setValue: function (geojsonObject) {
		this.geometry = geojsonObject;

		if(!geojsonObject) return;
		if(!this.ckmap) return;

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
	},
	
	getErrors: function(value) {
		value = arguments.length ? (value == null ? '' : value) : this.processRawValue(this.getRawValue());

		var me = this,
			errors = me.callParent(arguments),
			validator = me.validator,
			vtype = me.vtype,
			vtypes = Ext.form.field.VTypes,
			regex = me.regex,
			msg;

		if (Ext.isFunction(validator)) {
			msg = validator.call(me, value);
			if (msg !== true) {
				errors.push(msg);
			}
		}

		if (!value) {
			if (!me.allowBlank) {
				errors.push(me.blankText);
			}
			// If we are not configured to validate blank values, there cannot be any additional errors
			if (!me.validateBlank) {
				return errors;
			}
		}

		if (vtype) {
			if (!vtypes[vtype](value, me)) {
				errors.push(me.vtypeText || vtypes[vtype +'Text']);
			}
		}

		if (regex && !regex.test(value)) {
			errors.push(me.regexText || me.invalidText);
		}

		return errors;
	}
});
