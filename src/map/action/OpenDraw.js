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
	tooltip: 'Outil de dessin',

	winTitle: "Outil de dessin",

	currentOperation: "add",		// valid operations are "add" or "edit"
	selectedFeature: null,			// feature selection in modification mode

	// point config
	pointConfig: {
		color: Ck.Style.stroke.color,
		radius: Ck.Style.minorRadius,
		opacity: 0.7
	},

	// linestring config
	linestringConfig: {
		color: Ck.Style.stroke.color,
		width: Ck.Style.minorRadius,
		opacity: 0.7
	},

	// circle config
	circleConfig: {
		borderColor: Ck.Style.stroke.color,
		borderWidth: Ck.Style.minorRadius,
		borderOpacity: 0.7,
		backgroundColor: Ck.Style.fill.color,
		backgroundOpacity: 0.3
	},

	// polygon config
	polygonConfig: {
		borderColor: Ck.Style.stroke.color,
		borderWidth: Ck.Style.minorRadius,
		borderOpacity: 0.7,
		backgroundColor: Ck.Style.fill.color,
		backgroundOpacity: 0.3
	},
    textConfig: {
		color: Ck.Style.stroke.color,
		radius: Ck.Style.minorRadius,
		opacity: 0.9,
        text:'Texte',
        taille:24,
        police:'Arial'        
	},
	
	/**
	 * Create and display a windows with print form
	 * @param  {Ext.button.Button} btn [description]
	 */
	doAction: function(btn) {
		if (!this.win) {
			this.createInnerPanels();

			this.win = Ext.create('Ext.window.Window', {
				title: this.winTitle,
				width: 350,
				height: 300,
				cls: "ck-draw-window",
				currentType: null,
				layout: 'card',
				closeAction: 'hide',
				bodyStyle: {
					padding: "40px 5px 5px"
				},
				items: [
					{ html: "" },
					this.pointPanel, 
					this.lineStringPanel,
					this.circlePanel,
					this.polygonPanel,
					this.textPanel,
					this.modifyPanel
				],
				listeners: {
					scope: this,
					render: this.onWinRender,
					close: this.onWinClose
				}
			});
		}
		
		this.win.show();
	},

	/**
	 * [createInnerPanels description]
	 */
	createInnerPanels: function() {
		this.pointPanel = this.createPointPanel();
		this.lineStringPanel = this.createLineStringPanel();
		this.circlePanel = this.createCirclePanel();
		this.polygonPanel = this.createPolygonPanel();
		this.modifyPanel = this.createModifyPanel();
		this.textPanel = this.createtextPanel();
	},	
	
	/**
	 * [createtextPanel description]
	 */
	createtextPanel: function(opt) {
		if (!opt) {
			opt = this.textConfig;
		}
		
		var textlabelField = Ext.create('Ext.form.field.Text', {
	        name: 'label',
	        width: 160,
	        fieldLabel: 'Label',
	        allowBlank: false,
            value: opt.text,
            listeners: {
	        	scope: this,	        	
	        	change: this.onLabelChange
	        }
		});
		
		var textColorField = Ext.create('Ext.form.field.Text', {
	        name: 'textColor',
	        width: 160,
	        fieldLabel: 'Couleur',
	        allowBlank: false,
	        value: opt ? opt.color : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
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
            fieldLabel: "Police",
            listeners: {
	        	scope: this,
	        	change: this.onPoliceChange
	       },
            store: new Ext.data.SimpleStore({
                    fields: ['value','display'],
                    data : FONTS
                }),
            value: opt ? opt.police : 'Arial',
            mode: 'local',
            displayField:'display',
            triggerAction: 'all',
            selectOnFocus:true
        });
	textfontField.setValue(opt.police);	
		
        var texttailleField = Ext.create('Ext.slider.Single', {
			name: "taille",
	        fieldLabel: 'Taille',
	        width: 200,
			value: opt ? opt.taille : 5,
			increment: 1,
		    minValue: 8,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});
        
		var panel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'Text',
			items: [
				textlabelField,
				textColorField,
				textfontField,
				texttailleField
			]
		});

		return panel;
	},

	/**
	 * [createPointPanel description]
	 */
	createPointPanel: function(opt) {
		if (!opt) {
			opt = this.pointConfig;
		}
		var pointColorField = Ext.create('Ext.form.field.Text', {
	        name: 'pointColor',
	        width: 160,
	        fieldLabel: 'Couleur',
	        allowBlank: false,
	        value: opt ? opt.color : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var pointRadius = Ext.create('Ext.slider.Single', {
			name: "pointRadius",
	        fieldLabel: 'Radius',
	        width: 200,
			value: opt ? opt.radius : 5,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var pointOpacity = Ext.create('Ext.slider.Single', {
			name: "pointOpacity",
	        fieldLabel: 'Opacity',
	        width: 200,
			value: opt ? opt.opacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'Point',
			items: [
				pointColorField,
				pointRadius,
				pointOpacity
			]
		});

		return panel;
	},

	/**
	 * [createLineStringPanel description]
	 */
	createLineStringPanel: function(opt) {
		if (!opt) {
			opt = this.linestringConfig;
		}
		var lineStringColorField = Ext.create('Ext.form.field.Text', {
	        name: 'lineStringColor',
	        width: 160,
	        fieldLabel: 'Couleur',
	        allowBlank: false,
	        value: opt ? opt.color : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var lineStringWidth = Ext.create('Ext.slider.Single', {
			name: "lineStringWidth",
	        fieldLabel: 'Width',
	        width: 200,
			value: opt ? opt.width : 5,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var lineStringOpacity = Ext.create('Ext.slider.Single', {
			name: "lineStringOpacity",
	        fieldLabel: 'Opacity',
	        width: 200,
			value: opt ? opt.opacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'LineString',
			items: [
				lineStringColorField,
				lineStringWidth,
				lineStringOpacity
			]
		});

		return panel;
	},

	/**
	 * [createCirclePanel description]
	 */
	createCirclePanel: function(opt) {
		if (!opt) {
			opt = this.circleConfig;
		}
		var circleBorderColorField = Ext.create('Ext.form.field.Text', {
	        name: 'circleBorderColor',
	        width: 160,
	        fieldLabel: 'Bordure',
	        allowBlank: false,
	        value: opt ? opt.borderColor : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var circleBorderWidth = Ext.create('Ext.slider.Single', {
			name: "circleBorderWidth",
	        fieldLabel: 'Taille',
	        width: 200,
			value: opt ? opt.borderWidth : 5,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var circleBorderOpacity = Ext.create('Ext.slider.Single', {
			name: "circleBorderOpacity",
	        fieldLabel: 'Opacité',
	        width: 200,
			value: opt ? opt.borderOpacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var circleBackgroundColorField = Ext.create('Ext.form.field.Text', {
	        name: 'circleBackgroundColor',
	        width: 160,
	        fieldLabel: 'Remplissage',
	        allowBlank: false,
	        value: opt ? opt.backgroundColor : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var circleBackgroundOpacity = Ext.create('Ext.slider.Single', {
			name: "circleBackgroundOpacity",
	        fieldLabel: 'Opacité',
	        width: 200,
			value: opt ? opt.backgroundOpacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.panel.Panel', {
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

		return panel;
	},

	/**
	 * [createPolygonPanel description]
	 */
	createPolygonPanel: function(opt) {
		if (!opt) {
			opt = this.polygonConfig;
		}
		var polygonBorderColorField = Ext.create('Ext.form.field.Text', {
	        name: 'polygonBorderColor',
	        width: 160,
	        fieldLabel: 'Bordure',
	        allowBlank: false,
	        value: opt ? opt.borderColor : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var polygonBorderWidth = Ext.create('Ext.slider.Single', {
			name: "polygonBorderWidth",
	        fieldLabel: 'Taille',
	        width: 200,
			value: opt ? opt.borderWidth : 5,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onWidthOrRadiusChange
	        }
		});

		var polygonBorderOpacity = Ext.create('Ext.slider.Single', {
			name: "polygonBorderOpacity",
	        fieldLabel: 'Opacité',
	        width: 200,
			value: opt ? opt.borderOpacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var polygonBackgroundColorField = Ext.create('Ext.form.field.Text', {
	        name: 'polygonBackgroundColor',
	        width: 160,
	        fieldLabel: 'Remplissage',
	        allowBlank: false,
	        value: opt ? opt.backgroundColor : Ck.Style.stroke.color,
	        listeners: {
	        	scope: this,
	        	render: this.onColorRender,
	        	focus: this.onColorFocus,
	        	change: this.onColorChange
	        }
		});

		var polygonBackgroundOpacity = Ext.create('Ext.slider.Single', {
			name: "polygonBackgroundOpacity",
	        fieldLabel: 'Opacité',
	        width: 200,
			value: opt ? opt.backgroundOpacity : 50,
			increment: 1,
		    minValue: 0,
		    maxValue: 100,
		    listeners: {
	        	scope: this,
	        	change: this.onOpacityChange
	        }
		});

		var panel = Ext.create('Ext.panel.Panel', {
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

		return panel;
	},

	/**
	 * [createModifyPanel description]
	 */
	createModifyPanel: function() {
		var defaultPanel = Ext.create('Ext.panel.Panel', {
			html: "Veuillez selectionner un objet"
		});

		var modifyPointPanel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'ModifyPoint',
			listeners: {
				scope: this,
				deactivate: this.onInnerPanelDeactivate
			}/*,
			items: [{
				xtype: 'radiogroup',
	            //fieldLabel: 'Width',
	            columns: 1,
        		vertical: true,
                listeners: {
                	scope: this,
                	change: this.onRadioChange
                },
	            items: [{
                	boxLabel: 'Aucun',
                    name: 'point-modify',
                    inputValue: 'point-nothing',
                    hidden: true,
                    checked: true
                },{
                    boxLabel: 'Deplacer',
                    name: 'point-modify',
                    inputValue: 'point-translate'
                }]
			}]*/
		});

		var modifyLineStringPanel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'ModifyLineString',
			listeners: {
				scope: this,
				deactivate: this.onInnerPanelDeactivate
			}/*,
			items: [{
				xtype: 'radiogroup',
	            columns: 1,
        		vertical: true,
                listeners: {
                	scope: this,
                	change: this.onRadioChange
                },
	            items: [{
                	boxLabel: 'Aucun',
                    name: 'linestring-modify',
                    inputValue: 'linestring-nothing',
                    hidden: true,
                    checked: true
                },{
                    boxLabel: 'Modifier la forme',
                    name: 'linestring-modify',
                    inputValue: 'linestring-shape',
                    id: 'linestring-shape'
                },{
                    boxLabel: 'Deplacer',
                    name: 'linestring-modify',
                    inputValue: 'linestring-translate',
                    id: 'linestring-translate'
                }/*,{
                    boxLabel: 'Tourner',
                    name: 'linestring-modify',
                    inputValue: 'linestring-rotate',
                    id: 'linestring-rotate'
                },{
                    boxLabel: 'Modifier la taille',
                    name: 'linestring-modify',
                    inputValue: 'linestring-scale',
                    id: 'linestring-scale'
                }]
			}]*/
		});

		var modifyCirclePanel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'ModifyCircle',
			listeners: {
				scope: this,
				deactivate: this.onInnerPanelDeactivate
			}/*,
			items: [{
				xtype: 'radiogroup',
	            columns: 1,
        		vertical: true,
                listeners: {
                	scope: this,
                	change: this.onRadioChange
                },
	            items: [{
                	boxLabel: 'Aucun',
                    name: 'circle-modify',
                    inputValue: 'circle-nothing',
                    hidden: true,
                    checked: true
                },{
                    boxLabel: 'Deplacer',
                    name: 'circle-modify',
                    inputValue: 'circle-translate'
                }/*,{
                    boxLabel: 'Modifier la taille',
                    name: 'circle-modify',
                    inputValue: 'circle-scale',
                    id: 'circle-scale'
                }]
			}]*/
		});

        
		var modifyPolygonPanel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'ModifyPolygon',
			listeners: {
				scope: this,
				deactivate: this.onInnerPanelDeactivate
			}/*,
			items: [{
				xtype: 'radiogroup',
	            columns: 1,
        		vertical: true,
                listeners: {
                	scope: this,
                	change: this.onRadioChange
                },
	            items: [{
                	boxLabel: 'Aucun',
                    name: 'polygon-modify',
                    inputValue: 'polygon-nothing',
                    hidden: true,
                    checked: true
                },{
                    boxLabel: 'Modifier la forme',
                    name: 'polygon-modify',
                    inputValue: 'polygon-shape'
                },{
                    boxLabel: 'Deplacer',
                    name: 'polygon-modify',
                    inputValue: 'polygon-translate'
                }/*,{
                    boxLabel: 'Tourner',
                    name: 'polygon-modify',
                    inputValue: 'polygon-rotate'
                },{
                    boxLabel: 'Modifier la taille',
                    name: 'polygon-modify',
                    inputValue: 'polygon-scale',
                    id: 'polygon-scale'
                }]
			}]*/
		});

        var modifyTextPanel = Ext.create('Ext.panel.Panel', {
			layout: 'form',
			itemId: 'ModifyText',
			listeners: {
				scope: this,
				deactivate: this.onInnerPanelDeactivate
			}
		});

        
		var panel = Ext.create('Ext.panel.Panel', {
			layout: 'card',
			itemId: 'Modify',
			drawCt: this,
			dockedItems: [{
				xtype: 'toolbar',
				docked: 'top',
				hidden: true,
				items: [{
					text: "Modifier",
					tooltip: "Modifier l'apparence",
					//hidden: true,
					scope: this,
					handler: this.editFeature
				},{
					text: "Supprimer",
					tooltip: "Supprimer l'objet selectionne",
					scope: this,
					handler: this.removeFeature
				},{
					text: "Selectionner un autre",
					tooltip: "Selectionner un autre objet",
					scope: this,
					handler: this.selectFeature
				}]
			}],
			items: [
				defaultPanel,
				modifyPointPanel,
				modifyLineStringPanel,
				modifyCirclePanel,
				modifyPolygonPanel,
                modifyTextPanel
			]
		});

		return panel;
	},

	/**
	 * [showColorWin description]
	 * @param  {[type]} opener [description]
	 */
	showColorWin: function(opener) {
		if (!this.colorWin) {
			this.colorWin = Ext.create('Ext.window.Window', {
				title: "Choix de couleur",
				width: 200,
				height: 200,
				layout: 'fit',
				style:'z-index:9999999',
				closeAction: 'hide',
				items: [{
					xtype: "colorpicker",
					value: '993300',
					itemId: 'drawColorPicker',
					opener: opener,
					listeners: {
						scope: this,
						select: this.onColorSelect
					}
				}]
			});
		} else {
			var colorpicker = this.colorWin.query('#drawColorPicker')[0] || null;
			if (colorpicker) {
				colorpicker.opener = opener;
			}
		}
		
		this.colorWin.show();
		this.colorWin.toFront();
	},

	/**
	 * [updateStyle description]
	 * @param  {[type]} config [description]
	 */
	recupStyle: function(type) {
		var style, tool;
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
						//stroke: new ol.style.Stroke({
						//	color: 'rgba(25, 25, 25, 0.9)',
						//	width: 1
						//})
					}),
                    text:new ol.style.Text({
                        textAlign: 'center',
                        textBaseline: 'middle',
                        font: 'Normal ' + this[key].taille + 'px ' + this[key].police,

                        text: this[key].text,
                        fill: new ol.style.Fill({
							color: this.hexToRgb(this[key].color, this[key].opacity)
						}),
                        //stroke: new Stroke({color: outlineColor, width: outlineWidth}),
                        //offsetX: offsetX,
                        //offsetY: offsetY,
                        placement: 'point'
                        //maxAngle: maxAngle,
                        //overflow: overflow,
                        //rotation: rotation,
                      })
				});
				break;
                
		}
		
		tool.baseAction.updateInteraction(style);
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
		var test=this[key].taille;

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
                var test=this[key].taille;
		var test2=this[key];
				style = new ol.style.Style({
					image: new ol.style.Circle({
						fill: new ol.style.Fill({
							color: this.hexToRgb(this[key].color, '0.01')
						}),
						radius: 20
						//stroke: new ol.style.Stroke({
						//	color: 'rgba(25, 25, 25, 0.9)',
						//	width: 1
						//})
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
                        //stroke: new Stroke({color: outlineColor, width: outlineWidth}),
                        //offsetX: offsetX,
                        //offsetY: offsetY,
                        placement: 'point'
                        //maxAngle: maxAngle,
                        //overflow: overflow,
                        //rotation: rotation,
                      })
				});
				break;

		}
		
		if (feature) {
			feature.setStyle([style]);
		} else {
			if (tool) {
				tool.baseAction.updateInteraction(style);
			}
		}
	},

	/**
	 * [editFeature description]
	 * @param  {[type]} cmp [description]
	 */
	editFeature: function(cmp) {
		var item = this.modifyPanel.getLayout().getActiveItem(),
			type = item.itemId.replace(/^modify(.*)$/i, '$1');
		
		var drawQuery = '#drawModify';
		var tool = this.toolbar.query(drawQuery)[0] || null;
		if (tool) {
			var feature = tool.baseAction.selectedFeatures.getArray()[0];
			
			var panel, color, borderColor, backgroundColor,text, widthOrRadius,
				rgba, borderRGBA, backgroundRGBA, 
				opacity, borderOpacity, backgroundOpacity,
				opt = {},
				style = feature.getStyle()[0] || null;
			
			this.win.currentType = type;
			this.currentOperation = "edit";
			this.selectedFeature = feature;

			switch (type.toLowerCase()) {
				case 'point':
					color = style ? style.getImage().getFill().getColor() : this.pointConfig.color;
					widthOrRadius = style ? style.getImage().getRadius() : this.pointConfig.radius;
					rgba = this.parseRGBColor(color);
					opacity = /^[0-9\.]+$/g.test(rgba[3]) ? (rgba[3] <= 1 ? parseInt(rgba[3]*100) : parseInt(rgba[3])) : 100;
					color = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
					opt.color = color;
					opt.opacity = opacity;
					opt.radius = widthOrRadius;
					
					panel = this.createPointPanel(opt);
					break;
				case 'linestring':
					panel = this.createLineStringPanel(opt);
					break;
				case 'circle':
					borderColor = style ? style.getStroke().getColor() : this.circleConfig.borderColor;
					borderRGBA = this.parseRGBColor(borderColor);
					borderColor = this.rgbToHex(borderRGBA[0], borderRGBA[1], borderRGBA[2]);
					borderOpacity = /^[0-9\.]+$/g.test(borderRGBA[3]) ? parseInt(borderRGBA[3]) : 100;
					backgroundColor = style ? style.getFill().getColor() : this.circleConfig.backgroundColor;
					backgroundRGBA = this.parseRGBColor(backgroundColor);
					backgroundColor = this.rgbToHex(backgroundRGBA[0], backgroundRGBA[1], backgroundRGBA[2]);
					backgroundOpacity = /^[0-9\.]+$/g.test(backgroundRGBA[3]) ? parseInt(backgroundRGBA[3]) : 100;
					opt.borderColor = borderColor;
					opt.borderOpacity = borderOpacity;
					opt.backgroundColor = backgroundColor;
					opt.backgroundOpacity = backgroundOpacity;
					
					panel = this.createCirclePanel(opt);
					break;
				case 'polygon':
					borderColor = style ? style.getStroke().getColor() : this.circleConfig.borderColor;
					borderRGBA = this.parseRGBColor(borderColor);
					borderColor = this.rgbToHex(borderRGBA[0], borderRGBA[1], borderRGBA[2]);
					borderOpacity = /^[0-9\.]+$/g.test(borderRGBA[3]) ? parseInt(borderRGBA[3]) : 100;
					backgroundColor = style ? style.getFill().getColor() : this.circleConfig.backgroundColor;
					backgroundRGBA = this.parseRGBColor(backgroundColor);
					backgroundColor = this.rgbToHex(backgroundRGBA[0], backgroundRGBA[1], backgroundRGBA[2]);
					backgroundOpacity = /^[0-9\.]+$/g.test(backgroundRGBA[3]) ? parseInt(backgroundRGBA[3]) : 100;
					opt.borderColor = borderColor;
					opt.borderOpacity = borderOpacity;
					opt.backgroundColor = backgroundColor;
					opt.backgroundOpacity = backgroundOpacity;
					
					panel = this.createPolygonPanel(opt);
					break;
                    
                    
                case 'text':
					color = style ? style.getImage().getFill().getColor() : this.textConfig.color;
					widthOrRadius = style ? style.getImage().getRadius() : this.textConfig.radius;
					rgba = this.parseRGBColor(color);
					opacity = /^[0-9\.]+$/g.test(rgba[3]) ? (rgba[3] <= 1 ? parseInt(rgba[3]*100) : parseInt(rgba[3])) : 100;
					color = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
                    text=style.getText().getText();
                    
                    var font=style.getText().getFont();
					opt.color = color;
					opt.opacity = opacity;
					opt.radius = widthOrRadius;
                    opt.text = text;
                    opt.taille = font.split(' ')[1].replace('px','');
                    opt.police = font.split(' ')[2];
					
					panel = this.createtextPanel(opt);
					break;    
                    
			}
			if (panel) {
				var win = Ext.create('Ext.window.Window', {
					title: "Edition d'objet",
					width: 280,
					height: 280,
					layout: 'fit',
					items: [panel],
					listeners: {
						scope: this,
						close: function(cmp) {
							this.currentOperation = "add";
						}
					}
				});
				win.show();
			}
		}
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
	 * [updateFeatureConfig description]
	 * @param  {[type]} attribute [description]
	 */
	updateFeatureConfig: function(attribute, val) {
		// color
		var opacityKey, opacity,
			type = this.win.currentType,
			reg = new RegExp('^'+type, 'gi'),
			key = type.toLowerCase()+"Config";

		attribute = attribute.replace(reg, '');
		attribute = attribute[0].toLowerCase() + attribute.substring(1, attribute.length);
		

		if (attribute === "color") {				// color
			opacityKey = attribute.replace(/^(background|border)?.+$/gi, function(s, m) {
			  return /^(opacity|color)$/i.test(s) ? "opacity" : m+"Opacity";
			});
			opacity = (this[key][opacityKey] > 1) ? this[key][opacityKey]/100 : this[key][opacityKey];
			this[key][attribute] = this.hexToRgb(val, opacity);
			this[key][opacityKey] = opacity;

		} else if (attribute === "radius") {		// width || radius			
			if (/point/i.test(type)) {
				this[key].radius = val;
			} else if (/linestring/i.test(type)) {
				this[key].width = val;
			} else {
				this[key].borderWidth = val;
			}

		} else if (attribute === "opacity") {		// opacity			
			var colorKey, rgba, color;
			if (/point/i.test(type)) {
				rgba = this.parseRGBColor(this[key].color);
				color = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
				this[key].color = color;
				this[key].opacity = val/100;
			} else if (/linestring/i.test(type)) {
				this[key].opacity = val/100;
			} else {
				colorKey = attribute.replace(/^(background|border)?.+$/gi, function(s, m) {
				  return /^(opacity|color)$/i.test(s) ? "color" : m+"Color";
				});
				this[key][attribute] = val/100;
				this[key][colorKey] = /^rgba?\(/i.test(this[key][colorKey]) ? this[key][colorKey].replace(/,\s*[0-9\.]+\)$/i, ', '+val/100+')') : '#c3c3c3';				
			}
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
	 * [onColorRender description]
	 * @param  {[type]} cmp [description]
	 */
	onColorRender: function(cmp) {
		if (cmp.inputEl) {
			cmp.inputEl.setStyle({
	        	background: cmp.value
			});
		}
	},

	/**
	 * [onColorFocus description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} e   [description]
	 */
	onColorFocus: function(cmp, e) {
		this.showColorWin(cmp);
	},

	/**
	 * [onColorSelect description]
	 * @param  {[type]} cmp   [description]
	 * @param  {[type]} color [description]
	 */
	onColorSelect: function(cmp, color) {	
		if (cmp.opener && cmp.opener.getXType() === 'textfield') {
			cmp.opener.setValue('#'+color);
			this.updateFeature(cmp.opener.config.name, color);
		}
		if (cmp.ownerCt.getXType() === 'window') {
			cmp.ownerCt.close();
		}
	},

	/**
	 * [onColorChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onColorChange: function(cmp, val) {
		cmp.inputEl.setStyle({
			color: this.invertColor(val),
			background: val
		})
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		if(cmp.config.name == 'circleBorderColor'){
			this[key].borderColor = val;
		}else if(cmp.config.name == 'circleBackgroundColor'){
			this[key].backgroundColor = val;
		}else if(cmp.config.name == 'pointColor'){
			this[key].color = val;
		}else if(cmp.config.name == 'lineStringColor'){
			this[key].color = val;
		}else if(cmp.config.name == 'polygonBorderColor'){
			this[key].borderColor = val;
		}else if(cmp.config.name == 'polygonBackgroundColor'){
			this[key].backgroundColor = val;
		}else if(cmp.config.name == 'textColor'){
			this[key].color = val;
		}
		
	},

    
    /**
	 * [onLabelChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} val [description]
	 */
	onLabelChange: function(cmp, val) {				
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
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		if(cmp.config.name == 'circleBorderWidth'){
			this[key].borderWidth = val;
		}else if(cmp.config.name == 'pointRadius'){
			this[key].radius = val;
		}else if(cmp.config.name == 'lineStringWidth'){
			this[key].width = val;
		}else if(cmp.config.name == 'polygonBorderWidth'){
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
		type = this.win.currentType;
		var key = type.toLowerCase()+"Config";
		if(cmp.config.name == 'circleBorderOpacity'){
			this[key].borderOpacity = val/100;
		}else if(cmp.config.name == 'circleBackgroundOpacity'){
			this[key].backgroundOpacity = val/100;
		}else if(cmp.config.name == 'pointOpacity'){
			this[key].opacity = val/100;
		}else if(cmp.config.name == 'lineStringOpacity'){
			this[key].opacity = val/100;
		}else if(cmp.config.name == 'polygonBorderOpacity'){
			this[key].borderOpacity = val/100;
		}else if(cmp.config.name == 'polygonBackgroundOpacity'){
			this[key].backgroundOpacity = val/100;
		}

	
		this.updateFeature(cmp.config.name, val);
	},

	/**
	 * [onRadioChange description]
	 * @param  {[type]} cmp    [description]
	 * @param  {[type]} newVal [description]
	 * @param  {[type]} oldVal [description]
	 */
	onRadioChange: function(cmp, newVal, oldVal) {
		var interactionType = Object.values(cmp.getValue())[0].toLowerCase().replace(/^[^\-]+-(\w+)$/i, '$1');
		if (interactionType) {		
			var drawQuery = '#drawModify';
			var tool = this.toolbar.query(drawQuery)[0] || null;
			if (tool) {
				//tool.baseAction.toggleInteraction(interactionType);
			}
		}
	},

	/**
	 * [onRadioChange description]
	 * @param  {[type]} cmp [description]
	 * @param  {[type]} selected [description]
	 */
	onRadioChange_old: function(cmp, selected) {
		
		if (selected) {
			var interactionType = cmp.inputValue.split('-')[1];			
			var drawQuery = '#drawModify';
			var tool = this.toolbar.query(drawQuery)[0] || null;
			if (tool) { 
				tool.baseAction.toggleInteraction(interactionType);
			}
		}
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
				choicePanel: this.modifyPanel
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
		var tool = this.toolbar.query('#draw'+type)[0] || null;
		cmp.setActiveItem(0);
		if (tool) {
			tool.toggle(false);
		}
	},

	/**
	 * 
	 */
	onToolbarRender: function(cmp) {
		var map = Ck.getMap();
		cmp.items.each(function(tool) {
			if (tool.baseAction && typeof(tool.baseAction.ckLoaded) !== undefined) {
				tool.baseAction.ckLoaded(map);
			}
		});
	},

	/**
	 * parse rgba color string to array containing : r, g, b, alpha
	 * @param  {string} color [description]
	 * @return {array}       [r, g, b, alpha]
	 */
	parseRGBColor: function(color) {
		return color.replace(/(rgba?\(|\))/g, '').split(/,\s*/);
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
	},
	
	render: function(c){
		Ext.create('Ext.tip.ToolTip', {
			target: c.getEl(),
			html: this.tooltip,
			anchor:"left",
			animCollapse:false
		},this);
	}
});
