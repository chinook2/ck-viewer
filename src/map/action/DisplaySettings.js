/**
 * Basic action to zoom in the map (zoom level + 1).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 * 
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomin"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.DisplaySettings', {
	extend: 'Ck.Action',
	alias: "widget.ckmapDisplaySettings",
	
	tooltip: 'Open display settings window',
	
	/**
	 * Create and display a windows with print form
	 */
	doAction: function() {
		this.map = Ck.getMap();
		
		if(!this.win) {
			this.createSettingsPanel();
			this.win = Ext.create('Ext.window.Window', {
				title: "Display settings",
				resizable: true,
				width: 400,
				// height: "auto",
				layout: "fit",
				closeAction: "hide",
				items: this.panel,
				bodyPadding: 15,
				listeners: {
					close: function() {
						this.button.setPressed(false);
						this.toggleAction(this.button, false);
					},
					scope: this
				}
			});
		}
		
		this.win.show();
	},
	
	createSettingsPanel: function() {
		var effectStore = new Ck.create("Ext.data.Store", {
			fields: ["id", "label"],
			data: [
				{"id": "none", "label": "None"},
				{"id": "sharpen", "label": "Sharpen"},
				{"id": "sharpenless", "label": "Sharpen less"},
				{"id": "blur", "label": "Blur"},
				{"id": "shadow", "label": "Shadow"},
				{"id": "emboss", "label": "Emboss"},
				{"id": "edge", "label": "Edge detect"}
			]
		});
		
		var layers = this.map.getLayersStore();
		layers.unshift({"id": "All", "data": 0})
		var layerStore = new Ck.create("Ext.data.Store", {
			fields: ["id", "data"],
			data: layers
		});
		
		this.layerCombo = Ck.create("Ext.form.ComboBox", {
			fieldLabel: "Layer",
			xtype: "combo",
			store: layerStore,
			queryMode: "local",
			displayField: "id",
			valueField: "data",
			value: 0
		});
		
		this.settingsFieldSet = Ck.create("Ext.form.FieldSet", {
			title: "Settings",
			hidden: (this.map.getOlMap().getRenderer().getType() != "webgl"),
			defaults: {
				value: 50,
				increment: 1,
				minValue: 1,
				maxValue: 100,
				width: "100%",
				listeners: {
					change: this.valueChange,
					scope: this
				}
			},
			items: [{
				fieldLabel: "Brightness",
				fct: "setBrightness"
			},{
				fieldLabel: "Contrast",
				fct: "setContrast"
			},{
				fieldLabel: "Hue",
				fct: "setHue"
			},{
				fieldLabel: "Saturation",
				fct: "setSaturation"
			}]
		});
		
		this.effectsFieldSet = Ck.create("Ext.form.FieldSet", {
			title: "Effects",
			defaults: {
				width: "100%"
			},
			items: [{
				fieldLabel: "Effect",
				xtype: "combo",
				store: effectStore,
				queryMode: "local",
				displayField: "label",
				valueField: "id",
				value: "none",
				listeners: {change: this.effectChange, scope: this}
			}]
		});
		
		this.panel = new Ext.FormPanel({
			defaultType: "slider",
			defaults: {
				width: "100%"
			},
			items: [this.layerCombo, this.settingsFieldSet, this.effectsFieldSet]
		});
	},
	
	valueChange: function(slider, newValue) {
		var settingsFct = slider.fct;
		var fct = function(layer) {
			if(layer[settingsFct]) {
				layer[settingsFct](newValue);
			}
		}			
		this.map.applyFunction(fct);
	},
	
	effectChange: function(combo, newValue) {
		var lyr = this.layerCombo.getValue();
		this.map.applyEffect(newValue, (lyr == 0)? undefined : lyr);
		this.map.getOlMap().render();
	},
	
	close: function() {
		this.win.hide();
		this.button.setPressed(false);
	}
});
