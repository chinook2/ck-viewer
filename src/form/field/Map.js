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

	// Internal vector layer
	layer: null,
	
	// Internal geometry to show and edit with the map widget
	geometry: null,
	
	initComponent: function() {
		this.map = Ext.create(Ext.applyIf({
			xtype: 'ckmap'
		}, this.initialConfig));
		this.ckmap = this.map.getController();

		// Need to add the layer after map loaded...
		this.ckmap.on({
			loaded: function(){
				this.layer = new ol.layer.Vector({
					id: 'mapfieldLayer',
					source: new ol.source.Vector(),
					style: Ck.map.Style.style
				});
				this.ckmap.getOlMap().addLayer(this.layer);
			},
			scope: this
		})
		
		this.callParent(arguments);
	},
	
	afterRender: function () {
		this.callParent(arguments);

		//Ext.defer(function(){
			this.map.render(this.inputEl);
		//}, 50, this);
		
		this.on('resize', function(){
			var size = this.getSize();
			size.width-=2;
			size.height-=2;
			this.inputEl.setSize(this.getSize());
			this.map.setSize(size);
			//this.map.setSize(this.getSize());
		}, this);
	},

	getValue: function(){
		if(!this.layer) return;

		var geojson = new ol.format.GeoJSON();
		var features = this.layer.getSource().getFeatures();
		var json = geojson.writeFeaturesObject(features, {
			featureProjection: this.ckmap.getProjection()
		});
		
		// Add CRS...
		json.crs = {
			type: "name",
			properties : {
				name: "urn:ogc:def:crs:" + this.ckmap.getProjection().getCode()
			}
		}
		
		return json
	},

	setValue: function (geojsonObject) {
		this.geometry = geojsonObject;

		if(!geojsonObject) return;
		if(!this.ckmap) return;
		if(!this.layer) return;
		
		var geojson = new ol.format.GeoJSON();
		var feature = geojson.readFeatures(geojsonObject, {
			featureProjection: this.ckmap.getProjection()
		})
		
		this.layer.getSource().addFeature(feature);
		
		// Zoom on features
		this.ckmap.setExtent(this.layer.getSource().getExtent());
	},

	beforeDestroy: function(){
		// TODO : destroy map, layer ?
		this.callParent();
	},
	
	getErrors: function(value) {
		value = arguments.length ? (value == null ? '' : value) : this.processRawValue(this.getRawValue());

		var me = this,
			errors = me.callParent([value]),
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
