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
					style: Ck.Style.style
				});
				this.ckmap.addSpecialLayer(this.layer);
			},
			addlayer: function(lyr){
				if(!lyr.getSource()) return;
				if(!lyr.getSource().getParams || !lyr.getSource().updateParams) return;
				
				// Try apply fid value to params
				var lyrParams = lyr.getSource().getParams();
				if(lyrParams){
					var params = Ext.Object.toQueryString(lyrParams);
					// need to preserve { } for template
					params = params.replace('%7B','{').replace('%7D','}');
					
					var fid = this.lookupController().getView().getDataFid();
					var tpl = new Ext.Template(params);
					if(Ext.isString(fid)) fid = [fid];
					params = tpl.apply(fid);
					
					lyrParams = Ext.Object.fromQueryString(params);
					
					lyr.getSource().updateParams(lyrParams);
				}
			},
			scope: this
		})
		
		this.callParent(arguments);
	},
	
	afterRender: function () {
		this.callParent(arguments);

		this.map.render(this.inputEl);
		
		// Init size
		this.resize();
		// Update size
		this.on('resize', this.resize, this);
	},
	
	resize: function() {
		var size = this.getSize();
		// minimize for border (for allowBlank...)
		size.width-=2;
		size.height-=2;
		this.inputEl.setSize(this.getSize());
		this.map.setSize(size);
		this.ckmap.resize();
	},
	
	getOlMap: function(){
		if(!this.ckmap) return;
		return this.ckmap.getOlMap()
	},
	
	getValue: function(){
		if(!this.layer) return;

		var geojson = new ol.format.GeoJSON();
		var features = this.layer.getSource().getFeatures();
		var json = geojson.writeFeaturesObject(features, {
			// Proj in
			featureProjection: this.ckmap.getProjection(),
			// Proj out (Projection of the data we are writing)
			dataProjection:  this.ckmap.getProjection()
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
	
	getRawValue: function() {
		if(!this.layer) return;
		return this.layer.getSource().getFeatures();
	},
	
	setValue: function (geojsonObject) {
		this.geometry = geojsonObject;

		if(!geojsonObject) return;
		if(!this.ckmap) return;
		
		// Map not loaded... and layer not available yet. waiting for it and recall setValue !
		if(!this.layer) {
			this.ckmap.on({
				loaded: function() {
					this.setValue(geojsonObject);
				},
				scope: this
			});
			return;
		}
		
		// TODO : read Proj in from geojson...
		
		var geojson = new ol.format.GeoJSON();
		var features = geojson.readFeatures(geojsonObject, {
			// Proj in (Projection of the data we are reading)
			dataProjection:  this.ckmap.getProjection(),
			// Proj out
			featureProjection: this.ckmap.getProjection()
		})
		
		this.layer.getSource().addFeatures(features);
		
		// Zoom on features
		this.ckmap.setExtent(this.layer.getSource().getExtent());
	},

	reset: function() {
		var me = this;
		me.beforeReset();

		// Clear map data
		if(this.layer) this.layer.getSource().clear();
		//

		me.clearInvalid();
		// delete here so we reset back to the original state
		delete me.wasValid;
	},
	
	beforeDestroy: function(){
		// TODO : destroy layer ... ?
		this.map.destroy();
		
		this.callParent();
	},
	
	getErrors: function(value) {
		value = arguments.length ? (value == null ? '' : value) : this.processRawValue(this.getRawValue());
		
		if(Ext.isArray(value) && value.length==0) value = null;

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
