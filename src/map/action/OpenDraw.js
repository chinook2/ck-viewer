/**
 * Basic action to draw on the map.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 * 
 *		{
 *			xtype: "button",
 *         	ckAction: "ckmapZoomin"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.OpenDraw', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenDraw",
		
	itemId: 'opendraw',
	text: '',
	
	iconCls: 'ckfont ck-draw',
	tooltip: 'Drawing tools',

	winTitle: "Drawing tools",

	currentOperation: "add",		// valid operations are "add" or "edit"
	selectedFeature: null,			// feature selection in modification mode

	defaultAction: "ckmapDrawPoint",
	currentAction: null,

	// point config
	pointConfig: {
		color: "#ea7304",
		radius: Ck.Style.minorRadius,
		opacity: 70
	},

	// linestring config
	linestringConfig: {
		color: "#ea7304",
		width: Ck.Style.minorRadius,
		opacity: 70
	},

	// circle config
	circleConfig: {
		borderColor: "#ea7304",
		borderWidth: Ck.Style.minorRadius,
		borderOpacity: 70,
		backgroundColor: Ck.Style.fill.color,
		backgroundOpacity: 30
	},

	// polygon config
	polygonConfig: {
		borderColor: "#ea7304",
		borderWidth: Ck.Style.minorRadius,
		borderOpacity: 70,
		backgroundColor: Ck.Style.fill.color,
		backgroundOpacity: 30
	},

	textConfig: {
		color: '#333333',
		radius: Ck.Style.minorRadius,
		opacity: 90,
        text: 'Texte',
        taille: 24,
        police: 'Arial'        
	},
	
	ckLoaded: function(map) {
		this.draw = Ck.Draw.getInstance({
			map: this.getMap(),
			id: 'default'
		});	
	},

	/**
	 * Create and display a windows with print form
	 * @param  {Ext.button.Button} btn [description]
	 */
	doAction: function(btn) {
		if (!this.win) {
			this.createInnerPanels();

			this.win = Ext.create(this.classWindow, {
				title: this.winTitle,
				width: 450,
				height: 450,
				cls: "ck-draw-window",
				currentType: 'Point',
				layout: 'card',
				closeAction: 'hide',
				bodyStyle: {
					padding: "40px 5px 5px"
				},
				viewModel: {
					hasSelectedFeature: false
				},
				items: [
					//{ html: "" },
					this.pointPanel, 
					this.lineStringPanel,
					this.circlePanel,
					this.polygonPanel,
					this.textPanel //,
					//this.modifyPanel
				],
				buttons:[{
					text: "Delete",
					scope: this,
					handler: this.removeFeature,
					bind: {
						hidden: "{!hasSelectedFeature}"
					}
				}],
				listeners: {
					scope: this,
					render: this.onWinRender,
					close: this.onWinClose,
					show: this.onWinShow
				}
			});
			this.win.getViewModel().set('hasSelectedFeature', false);
		}

		this.win.show();
	},

	destroy: function() {
		if(this.win) this.win.destroy();
	},

	/**
	 * [createInnerPanels description]
	 */
	createInnerPanels: function() {
		this.pointPanel = this.createPointPanel();
		this.lineStringPanel = this.createLineStringPanel();
		this.circlePanel = this.createCirclePanel();
		this.polygonPanel = this.createPolygonPanel();
		this.textPanel = this.createtextPanel();
	},	
	
	/**
	 * [createPointPanel description]
	 */
	createPointPanel: function(opt) {
		var pointColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'color',
	        width: 160,
	        fieldLabel: 'Color',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var pointRadius = Ext.create('Ext.slider.Single', {
			name: "radius",
			fieldLabel: 'Radius',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var pointOpacity = Ext.create('Ext.slider.Single', {
			name: "opacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.form.Panel', {
			layout: 'form',
			itemId: 'Point',
			items: [
				pointColorField,
				pointRadius,
				pointOpacity
			]
		});

		if (!opt) opt = this.pointConfig;
		panel.getForm().setValues(opt);

		return panel;
	},

	/**
	 * [createLineStringPanel description]
	 */
	createLineStringPanel: function(opt) {
		var lineStringColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'color',
	        width: 160,
	        fieldLabel: 'Color',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var lineStringWidth = Ext.create('Ext.slider.Single', {
			name: "width",
			fieldLabel: 'Width',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var lineStringOpacity = Ext.create('Ext.slider.Single', {
			name: "opacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.form.Panel', {
			layout: 'form',
			itemId: 'LineString',
			items: [
				lineStringColorField,
				lineStringWidth,
				lineStringOpacity
			]
		});

		if (!opt) opt = this.linestringConfig;
		panel.getForm().setValues(opt);

		return panel;
	},

	/**
	 * [createCirclePanel description]
	 */
	createCirclePanel: function(opt) {
		if (!opt) {
			opt = this.circleConfig;
		}
		var circleBorderColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'borderColor',
	        width: 160,
	        fieldLabel: 'Stroke',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var circleBorderWidth = Ext.create('Ext.slider.Single', {
			name: "borderWidth",
			fieldLabel: 'Width',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var circleBorderOpacity = Ext.create('Ext.slider.Single', {
			name: "borderOpacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var circleBackgroundColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'backgroundColor',
	        width: 160,
	        fieldLabel: 'Fill',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var circleBackgroundOpacity = Ext.create('Ext.slider.Single', {
			name: "backgroundOpacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.form.Panel', {
			layout: 'form',
			itemId: 'Circle',
			items: [
				circleBorderColorField,
				circleBorderWidth,
				circleBorderOpacity,
				circleBackgroundColorField,
				circleBackgroundOpacity
			]
		});

		if (!opt) opt = this.circleConfig;
		panel.getForm().setValues(opt);

		return panel;
	},

	/**
	 * [createPolygonPanel description]
	 */
	createPolygonPanel: function(opt) {
		if (!opt) {
			opt = this.polygonConfig;
		}
		var polygonBorderColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'borderColor',
	        width: 160,
	        fieldLabel: 'Stroke',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var polygonBorderWidth = Ext.create('Ext.slider.Single', {
			name: "borderWidth",
			fieldLabel: 'Width',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var polygonBorderOpacity = Ext.create('Ext.slider.Single', {
			name: "borderOpacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var polygonBackgroundColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'backgroundColor',
	        width: 160,
	        fieldLabel: 'Fill',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var polygonBackgroundOpacity = Ext.create('Ext.slider.Single', {
			name: "backgroundOpacity",
			fieldLabel: 'Opacity',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.form.Panel', {
			layout: 'form',
			itemId: 'Polygon',
			items: [
				polygonBorderColorField,
				polygonBorderWidth,
				polygonBorderOpacity,
				polygonBackgroundColorField,
				polygonBackgroundOpacity
			]
		});

		if (!opt) opt = this.polygonConfig;
		panel.getForm().setValues(opt);

		return panel;
	},

	/**
	 * [createtextPanel description]
	 */
	createtextPanel: function(opt) {
		var textlabelField = Ext.create('Ext.form.field.Text', {
	        name: 'text',
	        width: 160,
	        fieldLabel: 'Label',
	        allowBlank: false,
            listeners: {
	        	scope: this,	        	
	        	change: this.onLabelChange
	        }
		});
		
		var textColorField = Ext.create('Ext.ux.colorpick.Field', {
	        name: 'color',
	        width: 160,
	        fieldLabel: 'Color',
	        allowBlank: false,
	        listeners: {
	        	scope: this,
	        	change: this.onColorChange
	        }
		});

		var FONTS = [
            ["Arial","Arial"],
            ["Verdana","Verdana"],
            ["Times","Times"],
            ["Tahoma","Tahoma"]
        ];
	    var textfontField =  Ext.create('Ext.form.field.ComboBox', {
			width:160,
			name: "police",
            fieldLabel: "Police",
            listeners: {
	        	scope: this,
	        	change: this.onPoliceChange
	        },
            store: new Ext.data.SimpleStore({
				fields: ['value','display'],
				data : FONTS
			}),
            mode: 'local',
            displayField:'display',
            triggerAction: 'all',
            selectOnFocus:true
        });
		
        var texttailleField = Ext.create('Ext.slider.Single', {
			name: "taille",
			fieldLabel: 'Size',
			labelSeparator: '',
	        width: 200,
			increment: 1,
		    minValue: 8,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});
        
		var panel = Ext.create('Ext.form.Panel', {
			layout: 'form',
			itemId: 'Text',
			items: [
				textlabelField,
				textColorField,
				textfontField,
				texttailleField
			]
		});

		if (!opt) opt = this.textConfig;
		panel.getForm().setValues(opt);

		return panel;
	},



	/**
	 * [updateStyle description]
	 * @param  {[type]} config [description]
	 */
	updateStyle: function(feature) {
		var style, tool, type = this.win.currentType;
		var drawQuery = /^line/i.test(type) ? '#drawLine' : '#draw'+type;
		tool = this.toolbar.query(drawQuery)[0] || null;

		var key = type.toLowerCase()+"Config";
		switch (type.toLowerCase()) {
			case 'point':
				style = new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: this.hexToRgb(this[key].color, this[key].opacity)
						}),
						radius: this[key].radius,
						stroke: new ol.style.Stroke({
							color: 'rgba(25, 25, 25, 0.9)',
							width: 1
						})
					})
				});
				break;

			case 'linestring':
			case 'line':
				style = new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: this.hexToRgb(this[key].color, this[key].opacity),
						width: this[key].width
					})
				});
				break;

			case 'circle':
			case 'polygon':
				style = new ol.style.Style({
					fill: new ol.style.Fill({
						color: this.hexToRgb(this[key].backgroundColor, this[key].backgroundOpacity)
					}),
					stroke: new ol.style.Stroke({
						color: this.hexToRgb(this[key].borderColor, this[key].borderOpacity),
						width: this[key].borderWidth
					})
				});
				break;
			case 'text':
				style = new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: this.hexToRgb(this[key].color, '0.01')
						}),
						radius: 20
					})
                    ,
                    text:new ol.style.Text({
                        textAlign: 'center',
                        textBaseline: 'middle',
                        font: 'Normal ' + this[key].taille + 'px ' + this[key].police,
                        text: this[key].text,
                        fill: new ol.style.Fill({
							color: this.hexToRgb(this[key].color, this[key].opacity)
						}),
                        placement: 'point'
                      })
				});
				break;
		}
		
		if (feature) {
			feature.setStyle([style]);
		} 
		if (tool) {
			tool.baseAction.updateInteraction(style);
		}

		return style;
	},

	modifyFeature: function(feature) {
		if(!feature) {
			this.win.getViewModel().set('hasSelectedFeature', false);
			return;
		}

		this.selectedFeature = feature;
		this.currentOperation = "edit";
		this.win.getViewModel().set('hasSelectedFeature', true);

		var type = this.getFeatureType(feature);
		if (!type) return;

		this.win.currentType = type;

		var style = this.getFeatureStyle(feature);

		this.draw.activeDraw(type, true);

		var p = this.win.query('#'+type)[0];
		if(p) p.getForm().setValues(style);
	},

	getFeatureStyle: function(feature) {
		var color, borderColor, backgroundColor, 
		    hexColor, kexBorderColor, hexBackgroundColor, 
			rgba, borderRGBA, backgroundRGBA, 
			opacity, borderOpacity, backgroundOpacity,
			font, widthOrRadius,
			opt = {};
		
		var type = this.getFeatureType(feature);

		var style = feature.getStyle();
		if (!style) return false;
		style = style[0];

		switch (type.toLowerCase()) {
			case 'point':
				color = style.getImage().getFill().getColor();
				rgba = this.parseRGBColor(color);
				hexColor = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
				opacity = this.parseOpacity(color);
				widthOrRadius = style.getImage().getRadius();

				opt.color = hexColor;
				opt.opacity = opacity;
				opt.radius = widthOrRadius;
				break;
			case 'linestring':
				color = style.getStroke().getColor();
				rgba = this.parseRGBColor(color);
				hexColor = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
				opacity = this.parseOpacity(color);
				widthOrRadius = style.getStroke().getWidth();

				opt.color = hexColor;
				opt.opacity = opacity;
				opt.width = widthOrRadius;			
				break;
			case 'circle':
				borderColor = style.getStroke().getColor();
				borderRGBA = this.parseRGBColor(borderColor);
				kexBorderColor = this.rgbToHex(borderRGBA[0], borderRGBA[1], borderRGBA[2]);
				borderOpacity = this.parseOpacity(borderColor);
				backgroundColor = style.getFill().getColor();
				backgroundRGBA = this.parseRGBColor(backgroundColor);
				hexBackgroundColor = this.rgbToHex(backgroundRGBA[0], backgroundRGBA[1], backgroundRGBA[2]);
				backgroundOpacity = this.parseOpacity(backgroundColor);

				opt.borderColor = kexBorderColor;
				opt.borderOpacity = borderOpacity;
				opt.backgroundColor = hexBackgroundColor;
				opt.backgroundOpacity = backgroundOpacity;			
				break;
			case 'polygon':
				borderColor = style.getStroke().getColor();
				borderRGBA = this.parseRGBColor(borderColor);
				kexBorderColor = this.rgbToHex(borderRGBA[0], borderRGBA[1], borderRGBA[2]);
				borderOpacity = this.parseOpacity(borderColor);
				backgroundColor = style.getFill().getColor();
				backgroundRGBA = this.parseRGBColor(backgroundColor);
				hexBackgroundColor = this.rgbToHex(backgroundRGBA[0], backgroundRGBA[1], backgroundRGBA[2]);
				backgroundOpacity = this.parseOpacity(backgroundColor);

				opt.borderColor = kexBorderColor;
				opt.borderOpacity = borderOpacity;
				opt.backgroundColor = hexBackgroundColor;
				opt.backgroundOpacity = backgroundOpacity;
				break;
			case 'text':
				color = style.getImage().getFill().getColor();
				widthOrRadius = style.getImage().getRadius();
				rgba = this.parseRGBColor(color);
				opacity = this.parseOpacity(color);
				hexColor = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
				text = style.getText().getText();
				font = style.getText().getFont();

				opt.color = hexColor;
				opt.opacity = opacity;
				opt.radius = widthOrRadius;
				opt.text = text;
				opt.taille = font.split(' ')[1].replace('px','');
				opt.police = font.split(' ')[2];
				break;
		}
		
		return opt;
	},


	/**
	 * [removeFeature description]
	 * @param  {[type]} cmp [description]
	 */
	removeFeature: function(cmp) {
		var drawQuery = '#drawModify';
		var tool = this.toolbar.query(drawQuery)[0] || null;
		if (tool) {
			tool.baseAction.removeSelectedFeature();
		}
	},

	/**
	 * [selectFeature description]
	 * @param  {[type]} cmp [description]
	 */
	selectFeature: function(cmp) {
		var item = this.modifyPanel.getLayout().getActiveItem(),
			radiogroup = item.child('radiogroup'),
			key = item.itemId.toLowerCase().replace(/^(modify)(.*)$/i, '$2-$1'),
			type = key.split('-')[0];

		if (radiogroup && type) {
			var value = {};
			value[key] = type+'-nothing';
			radiogroup.setValue(value);
		}

		var drawQuery = '#drawModify';
		var tool = this.toolbar.query(drawQuery)[0] || null;
		if (tool) {
			tool.baseAction.createInteraction();
		}
	},

	/**
	 * [updateFeature description]
	 * @param  {[type]} attribute [description]
	 */
	updateFeature: function(attribute, val) {
		//this.updateFeatureConfig(attribute, val);
		var feature = (this.selectedFeature && (this.currentOperation === "edit")) ? this.selectedFeature : null;
		this.updateStyle(feature);
	},

	/**
	 * [onColorChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onColorChange: function(cmp, val) {
		if(!this.win) return;
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";

		if(cmp.config.name == 'borderColor'){
			this[key].borderColor = val;
		}else if(cmp.config.name == 'backgroundColor'){
			this[key].backgroundColor = val;
		}else if(cmp.config.name == 'color'){
			this[key].color = val;
		}else if(cmp.config.name == 'color'){
			this[key].color = val;
		}else if(cmp.config.name == 'borderColor'){
			this[key].borderColor = val;
		}else if(cmp.config.name == 'backgroundColor'){
			this[key].backgroundColor = val;
		}else if(cmp.config.name == 'textColor'){
			this[key].color = val;
		}

		this.updateFeature(cmp.config.name, val);
	},

    
    /**
	 * [onLabelChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onLabelChange: function(cmp, val) {	
		if(!this.win) return;			
    	type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		this[key].text = val;	

        this.updateFeature(cmp.config.name, val);
	},

    
    /**
	 * [onPoliceChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onPoliceChange: function(cmp, val) {
		if(!this.win) return;				
    	type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		this[key].police= val;	

        this.updateFeature(cmp.config.name, val);
	},


	/**
	 * [onWidthOrRadiusChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onWidthOrRadiusChange: function(cmp, val) {
		if(!this.win) return;	
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		if(cmp.config.name == 'borderWidth'){
			this[key].borderWidth = val;
		}else if(cmp.config.name == 'radius'){
			this[key].radius = val;
		}else if(cmp.config.name == 'width'){
			this[key].width = val;
		}else if(cmp.config.name == 'borderWidth'){
			this[key].borderWidth = val;
		}else if(cmp.config.name == 'taille'){
			this[key].taille = val;
		}
	
		this.updateFeature(cmp.config.name, val);
	},  

	/**
	 * [onOpacityChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onOpacityChange: function(cmp, val) {
		if(!this.win) return;	
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		if(cmp.config.name == 'borderOpacity'){
			this[key].borderOpacity = val/100;
		}else if(cmp.config.name == 'backgroundOpacity'){
			this[key].backgroundOpacity = val/100;
		}else if(cmp.config.name == 'opacity'){
			this[key].opacity = val/100;
		}else if(cmp.config.name == 'opacity'){
			this[key].opacity = val/100;
		}else if(cmp.config.name == 'borderOpacity'){
			this[key].borderOpacity = val/100;
		}else if(cmp.config.name == 'backgroundOpacity'){
			this[key].backgroundOpacity = val/100;
		}

		this.updateFeature(cmp.config.name, val);
	},


	/**
	 * [onInnerPanelDeactivate description]
	 * @param  {[type]} cmp [description]
	 */
	onInnerPanelDeactivate: function(cmp) {
		var key = cmp.itemId.toLowerCase().replace(/^(modify)(.*)$/i, '$2-$1'),
			type = key.split('-')[0];
		var radiogroup = cmp.items.getAt(0);		// or cmp.child('radiogroup')
		if (radiogroup) {
			var value = {};
			value[key] = type+'-nothing';
			radiogroup.setValue(value);
		}
	},

	/**
	 * [onWinRender description]
	 * @param  {[type]} cmp [description]
	 */
	onWinRender: function(cmp) {
		this.toolbar = Ext.create({
			xtype: "cktoolbar",
			cls: "ck-draw-tbar",
			dock: "top",
			listeners: {
				scope: this,
				render: this.onToolbarRender
			},
			items: [{
				ckAction: "ckmapDrawPoint",
				win: cmp,
				objprt: this
			},{
				ckAction: "ckmapDrawLine",
				win: cmp,
				objprt: this
			},{
				ckAction: "ckmapDrawCircle",
				win: cmp,
				objprt: this
			},{
				ckAction: "ckmapDrawPolygon",
				win: cmp,
				objprt: this
			},{
				ckAction: "ckmapDrawText",
				win: cmp,
				objprt: this
			},"->",{
				ckAction: "ckmapDrawClear",
				win: cmp
			},{
				ckAction: "ckmapDrawModify",
				win: cmp,
				objprt: this,
				//choicePanel: this.modifyPanel
			}]
		});

		cmp.addDocked(this.toolbar);
	},

	/**
	 * [onWinClose description]
	 * @param  {[type]} cmp [description]
	 */
	onWinClose: function(cmp) {
		var type = this.win.currentType;
		this.currentAction = 'draw'+type;

		var tool = this.toolbar.query('#'+this.currentAction)[0] || null;
		//cmp.setActiveItem(0);
		if (tool) {
			tool.toggle(false);
		}
	},
		
	/**
	 * [onWinShow description]
	 * @param  {[type]} cmp [description]
	 */
	onWinShow: function(cmp) {
		if(!this.currentAction) return;
		var tool = this.toolbar.query('#'+this.currentAction)[0] || null;
		//cmp.setActiveItem(0);
		if (tool) {
			tool.toggle(true);
		}
	},
	
	/**
	 * 
	 */
	onToolbarRender: function(cmp) {
		var map = Ck.getMap();
		cmp.items.each(function(tool) {
			if (tool.baseAction) {
				if (typeof(tool.baseAction.ckLoaded) !== undefined) {
					tool.baseAction.ckLoaded(map);
				}

				// Init default tool
				if (this.defaultAction && this.defaultAction == tool.ckAction) {
					tool.toggle(true);
					this.win.currentType = tool.baseAction.type;
				}
			}
		}, this);
	},

	getFeatureType: function(feature) {
		if(!feature) return false;
		if(!feature.getGeometry()) return false;

		var type = feature.getGeometry().getType();
			
		// !! specify a style interaction - otherwise getStyle can return a function !
		var style = feature.getStyle()
		if(!style) return type;
		
		style = style[0];
		if(!style) return type;

		var text = style.getText();
		if (text != null) {
			type='Text';
		}

		return type;
	},


	/**
	 * parse rgba color string to array containing : r, g, b, alpha
	 * @param  {string} color [description]
	 * @return {array}       [r, g, b, alpha]
	 */
	parseRGBColor: function(color) {
		if(Ext.isArray(color)) return color;
		return color.replace(/(rgba?\(|\))/g, '').split(/,\s*/);
	},

	parseOpacity: function(color) {
		if(!Ext.isArray(color)) {
			color = this.parseRGBColor(color);
		}
		var opacity = /^[0-9\.]+$/g.test(color[3]) ? (color[3] <= 1 ? parseInt(color[3]*100) : parseInt(color[3])) : 100;
		return opacity;
	},

	/**
	 * get the hexdecimal inverted color
	 * @param  {[type]} hex [description]
	 * @return {string}     hexadecimal inverted color
	 */
	invertColor: function(hex) {
	    if (hex.indexOf('#') === 0) {
	        hex = hex.slice(1);
	    }
	    // convert 3-digit hex to 6-digits.
	    if (hex.length === 3) {
	        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	    }
	    if (hex.length !== 6) {
	        return "#000000";
	    }
	    var r = parseInt(hex.slice(0, 2), 16),
	        g = parseInt(hex.slice(2, 4), 16),
	        b = parseInt(hex.slice(4, 6), 16);
	    // invert color components
	    r = (255 - r).toString(16);
	    g = (255 - g).toString(16);
	    b = (255 - b).toString(16);

	    // pad each with zeros and return
	    return "#" + this.padZero(r) + this.padZero(g) + this.padZero(b);
	},

	/**
	 * [hexToRgb description]
	 * @param  {[type]} hex   [description]
	 * @param  {[type]} alpha [description]
	 * @return {[type]}       [description]
	 */
	hexToRgb: function(hex, alpha) {
		if (/^rgba?\(/i.test(hex) || (typeof(hex) !== "string")) {
			return hex;
		}

		hex = hex.replace('#', '');
		var r = parseInt(hex.length == 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
		var g = parseInt(hex.length == 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
		var b = parseInt(hex.length == 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
		/*var h = "0123456789ABCDEF";
		var r = h.indexOf(hex[1])*16 + h.indexOf(hex[2]);
		var g = h.indexOf(hex[3])*16 + h.indexOf(hex[4]);
		var b = h.indexOf(hex[5])*16 + h.indexOf(hex[6]);*/
		if (!alpha) {
			alpha = 100;
		}
		return "rgba("+r+", "+g+", "+b+", "+alpha+")";
	},

	/**
	 * [rgb2hex description]
	 * @param  {[type]} red   [description]
	 * @param  {[type]} green [description]
	 * @param  {[type]} blue  [description]
	 * @return {[type]}       [description]
	 */
	rgbToHex: function(red, green, blue) {
        var rgb = blue | (green << 8) | (red << 16);
        return '#' + (0x1000000 + rgb).toString(16).slice(1);
  	},

	/**
	 * [padZero description]
	 * @param  {[type]} str [description]
	 * @param  {[type]} len [description]
	 * @return {[type]}     [description]
	 */
	padZero: function(str, len) {
	    len = len || 2;
	    var zeros = new Array(len).join('0');
	    return (zeros + str).slice(-len);
	},
	
	/**
	 * [close description]
	 */
	close: function() {
		//this.win.hide();
	}
});
