/**
 * The Form controller allow to load form to display it. It can manage sub-form...
 *
 * Also perform load and save data for the form.
 */
Ext.define('Ck.form.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckform',

	autoLoad: true,
	isSubForm: false,
	parentForm: false,
	storage: null,

	dataUrl: null,
	dataModel: null,

	layoutConfig: {
		labelSeparator: ' : '
	},

	fields: [],

	// TODO in config param in form json...
	compatibiltyMode: false,

	// Override by named controller of the form Ck.form.controller.{name}
	beforeShow: Ext.emptyFn,
	afterShow: Ext.emptyFn,
	beforeClose: Ext.emptyFn,

	beforeLoad: Ext.emptyFn,
	afterLoad: Ext.emptyFn,
	loadFailed: Ext.emptyFn,

	beforeSave: Ext.emptyFn,
	afterSave: Ext.emptyFn,
	saveFailed: Ext.emptyFn,

	beforeDelete: Ext.emptyFn,
	afterDelete: Ext.emptyFn,
	deleteFailed: Ext.emptyFn,
	
	fieldsProcessed: 0,
	formsProcessed: 0,
	
	/**
	 * @event aftersave
	 * Fires when save was successful
	 * @param {Object}
	 */

	init: function() {
		this.isSubForm = this.view.getIsSubForm();
		this.autoLoad = this.view.getAutoLoad();
		this.editing = this.view.getEditing();
		this.isInit = false;

		var isStorage = 'Ck-' + Ext.manifest.name + '-Form';
		this.ls = Ext.util.LocalStorage.get(isStorage);
		if(!this.ls) {
			this.ls = new Ext.util.LocalStorage({
				id: isStorage
			});
		}

		// Get form definition directly in the view (no Ajax request)
		var inlineForm = this.view.getFormRaw();
		var parentForm = this.view.up('ckform') || this.view.parentForm;
		if(parentForm) {
			this.parentForm = parentForm;
			
			this.editing = parentForm.getEditing();
			
			// inherit dataFid from main view form (used in store url template)
			vDataFid = this.view.getDataFid() || {};
			pDataFid = parentForm.getDataFid() || {};
			if(Ext.isString(vDataFid)) {
				vDataFid ={fid: vDataFid};
			}
			this.view.setDataFid(Ext.apply(vDataFid, pDataFid));
			
			// Compatibility
			if(parentForm.getController().compatibiltyMode===true){
                for(var k in parentForm.getController().formConfig.subforms) {
                    var sf = parentForm.getController().formConfig.subforms[k];
                    if('/'+sf.name == this.view.getFormName() ){
                        inlineForm = sf;
						break;
                    }
                }
			}
			//
			
			// Try find parent form name (used for overriden controllers)
			if(inlineForm && !inlineForm.name) {
				inlineForm.name = parentForm.getController().name;
			}
		}

		if(this.editing === true) this.startEditing();
		this.initForm(inlineForm);
	},

	destroy: function() {
		if(this.ls) this.ls.release();
		this.callParent();
	},

	formLoad: function(btn) {
		if(btn && btn.formName) {
			this.view.setFormName(btn.formName);
			this.isInit = false;
			this.initForm();
			return;
		}
	},

	formEdit: function() {
		this.startEditing();
	},

	formSave: function(btn) {
		var res = this.saveData(null, function() {
			//After save success.

			// Link to another form
			if(btn && btn.nextFormName) {
				this.view.setFormName(btn.nextFormName);
				this.isInit = false;
				this.initForm();
				return;
			}
			if(btn && btn.nextFormUrl) {
				this.view.setFormUrl(btn.nextFormUrl);
				this.isInit = false;
				this.initForm();
				return;
			}

			// Close the form
			if(btn && btn.andClose) {
				this.formClose({
					force: true
				});
			}
			
			Ext.Msg.show({
				title: "Edition",
				message: "Mise à jour effectuée",
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.INFO
			});
		});

		// If we have error exit here (log message is in saveData())
		if(!res) return false;
	},

	formCancel: function() {
		this.stopEditing();
	},

	formPrint: function() {
		Ext.alert("WIP.");
	},

	formClose: function(btn) {

		var closeMe = function() {
			if(this.oController.beforeClose() === false) {
				Ck.log("beforeClose cancel formClose.");
				return;
			}
			if(this.view.beforeClose() === false) {
				Ck.log("view beforeClose cancel formClose.");
				return;
			}

			// this.stopEditing();
			this.getViewModel().set("editing", false);
			this.getViewModel().set("isEditable", true);
		
			this.fireEvent('afterclose');

			var win = this.view.up('window');
			if(win) {
				win.destroy();
			} else {
				this.view.destroy();
			}

		}.bind(this);

		if(btn && btn.force === true) {
			this.fireEvent('beforeclose', btn);
			closeMe();
		} else {
			Ext.Msg.show({
				title:'Close ?',
				message: 'You are closing a form that has unsaved changes. Would you like to save your changes ?',
				buttons: Ext.Msg.YESNOCANCEL,
				icon: Ext.Msg.QUESTION,
				fn: function(btn) {
					this.fireEvent('beforeclose', btn);
					if(btn === 'yes') {
						this.saveData();
						closeMe();
					} else if(btn === 'no') {
						closeMe()
					} else {
						// Nothing don't close
					}
				},
				scope: this
			});

		}

	},

	getOption: function(opt) {
		var formOpt = Ck.getOption('form');
		if(formOpt && formOpt[opt]) {
			return formOpt[opt];
		}
		return Ck.getOption(opt);
	},

	/**
	 * PRIVATE
	 */
	initForm: function(form) {
		if(!this.isInit) {
			if(!form) {
				var formUrl = this.view.getFormUrl();
				var formName = this.view.getFormName();
				if(!formUrl && formName) formUrl = this.getFullUrl(formName);

				this.getForm(formUrl);
				return;
			}

			this.formConfig = form;
			
			this.name = form.name;
			if(!this.name) {
				Ck.log("Enable to get form Name.");
				CkLog(form);
				return;
			}

			this.dataUrl = null;
			this.dataModel = null;

			// Create un dedicated controller form the named form
			var controllerName = 'Ck.form.controller.' + this.name;
			if(!Ext.ClassManager.get(controllerName)) {
				Ext.define(controllerName, {
					extend: 'Ck.form.Controller',
					alias: 'controller.ckform_'+ this.name
				});
			}

			// Define new controller to be overriden by application
			// Use this.oController to access overriden methods !
			this.oController = Ext.create(controllerName);
			this.oController._parent = this;
			//

			if(this.oController.beforeShow(form) === false) {
				Ck.log("beforeShow cancel initForm.");
				return;
			}

			// Ajoute la définition du formulaire au panel
			var fcf = this.applyFormDefaults(form.form);

			this.view.removeAll(true);
			this.view.add(fcf.items);

			// Manage bottom toolbar
			var docks = this.view.getDockedItems();
			// Init Default toolbar && Remove existing toolbar
			Ext.each(docks, function(d) {
				if(!this.defaultDock && (d.dock == 'bottom')) {
					this.defaultDock = d.initialConfig;
					if(this.isSubForm && !this.editing) {
						this.defaultDock.hidden = true;
					}else{
						this.defaultDock.hidden = false;
					}
				}
				this.view.removeDocked(d);
			}, this);


			if(fcf.dockedItems) {
				// Add custom toolbar
				this.view.addDocked(fcf.dockedItems);
			} else {
				// Add default toolbar
				if(this.defaultDock) this.view.addDocked(this.defaultDock);
			}


				// Init la popup qui contient le formulaire
				var fcw = form.window;
				var win = this.view.up('window');
			if(win && fcw) {
					// Ext.apply(win, fcw);
					// win.show();

					// TODO : binding ou surcharge complète du config...
					// if(fcw) win.setBind(fcw);

					if(fcw.title) win.setTitle(fcw.title);
				// Adjust form popup Size on PC (tablet is full screen)
				if(Ext.os.is.desktop) {
					if(fcw.width) win.setWidth(fcw.width);
					if(fcw.height) win.setHeight(fcw.height);
				}
			}

			if(form.dataUrl) {
				this.dataUrl = form.dataUrl;
			}
			// Init Model from view or form
			var model = form.dataModel || this.view.getDataModel();
			if(model) {
				this.dataModel = Ext.create(model, {});
			}
			// if(form.dataStore) {
				// this.dataStore = Ext.getStore(form.dataStore);
			// }

			this.isInit = true;
			
			if(this.oController.afterShow(form) === false){
				Ck.log("afterShow cancel initForm.");
				return;
			}
			
			// Auto-load data if params available
			if(this.autoLoad) {
				var data = this.view.getDataObject();
				if(Ext.isObject(data)) {
					this.loadData(data);
				} else {
					this.loadFeature();
				}
			}
		}

		return true;
	},

	/**
	 * Get Form definition
	 * @param {String}
	 */
	getForm: function(formUrl) {
		if(!formUrl) {
			Ck.Notify.error("'formUrl' or 'formName' not set in getForm.");
			return false;
		}

		// Load Form from LocalStorage (cache form with includes - ajax cache can't save all in one)
		if(this.ls) {
			var form = this.ls.getItem(formUrl);
			if(form && Ck.getEnvironment() == 'production') {
				this.initForm( Ext.decode(form) );
				return;
			}
		}

		Cks.get({
			url: formUrl,
			disableCaching: false,
			scope: this,
			success: function(response) {
				var me = this;
				var formConfig = Ext.decode(response.responseText, true);
				if(formConfig.success) {
					formConfig = formConfig.forms[0];
				}
				if(!formConfig) {
					Ck.Notify.error("Invalid JSON Form in : "+ formUrl);
					return false;
				}

				var incForms = me.getIncludedForm(formConfig.form);

				Ck.asyncForEach(incForms, function(frmName, cb) {
					// Include one sub-form...
					me.includeForm(formConfig, frmName, cb);
				}, function(newFormConfig) {
					// Called when all included forms are done (compiled in newFormConfig)
					// If no included form use default formConfig.
					var cfg = newFormConfig || formConfig;

					// Save Form in LocalStorage
					if(me.ls) me.ls.setItem(formUrl, Ext.encode(cfg));

					me.initForm(cfg);
				});
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				// var uiConfig = Ext.decode(response.responseText);
				// this.initUi(uiConfig);

				Ck.error('Error when loading "'+ formUrl +'" form !. Loading the default form...');

				this.getForm(this.getFullUrl(this.view.getDefaultFormName()));
			}
		});
	},

	/**
	 * Get the main form controller (the 1st)
	 */
	getRootForm: function() {
		var rootForm = this.getView().findParentBy(function(cmp) {
			if(cmp.xtype != 'ckform') return false;
			return (cmp.getController().parentForm === false);
		});
		if(rootForm) return rootForm.getController();
		// By default return the current controller !
		return this;
	},
	
	/**
	 * Get subForms by Name or formName
	 */
	getSubForm: function(val) {
		var sub = this.getView().down('ckform[name='+val+']');
		if(!sub) sub = this.getView().down('ckform[formName='+val+']');
		if(sub) return sub.getController();
		return false;
	},
	
	/**
	 * List all included form in a form.
	 */
	getIncludedForm: function(cfg) {
		if(!cfg) return;
		var includeForm = [];
		var fn = function(c) {
			if(c['@include']) {
				includeForm.push(c['@include']);
			}
			if(c.items) {
				Ext.each(c.items, fn, this);
			}
		};

		Ext.each(cfg.items, fn, this);
		if(cfg.dockedItems) Ext.each(cfg.dockedItems, fn, this);
		return includeForm;
	},

	includeForm: function(formConfig, formName, callback) {
		var formUrl = this.getFullUrl(formName);
		if(!formUrl) {
			Ck.Notify.error("'formUrl' or 'formName' not set in includeForm.");
			return false;
		}
		Cks.get({
			url: formUrl,
			disableCaching: false,
			scope: this,
			success: function(response) {
				var me = this;
				var subFormConfig = Ext.decode(response.responseText, true);
				if(!subFormConfig) {
					Ck.Notify.error("Invalid JSON Form in : "+ formUrl);
					return false;
				}

				var fn = function(c, idx, frm) {
					if(c.items) {
						Ext.each(c.items, fn, this);
					}
					if(c['@include'] == formName) {
						delete frm[idx]['@include'];
						Ext.apply(frm[idx], subFormConfig.form);
					}
				};
				Ext.each(formConfig.form.items, fn, this);
				if(formConfig.form.dockedItems) Ext.each(formConfig.form.dockedItems, fn, this);

				// Find include form recursively
				var incForms = me.getIncludedForm(subFormConfig.form);
				Ck.asyncForEach(incForms, function(frmName, cb) {
					me.includeForm(formConfig, frmName, cb);
				}, function(newFormConfig) {
					callback(newFormConfig || formConfig);
				});
			}
		});
	},

	/**
	 * Auto config for the form (JSON simplify).
	 * Create Ext components from JSON
	 * @params {Object}
	 */
	applyFormDefaults: function(cfg) {
		var me = this;
		this.fields = [];

		var fn = function(c) {
			// Get Alls direct fields of the form with includes (exclude subform)
			if(c.name) {
				this.fields.push(c.name);
			}

			// Default component is textfield
			if(c.name && !c.xtype) c.xtype = 'textfield';

			// Compatibility forms V1
			if(c.xtype && c.xtype.substr(0,3) == 'ck_') {
				c.xtype = c.xtype.substr(3);
				this.compatibiltyMode = true;
			}

			// Subforms : init default params and exit
			if(c.xtype == "ckform") {
				Ext.applyIf(c, {
					editing: this.editing,
					urlTemplate: {ws: "{0}/{1}"},
					bodyPadding: 0,
					dockedItems: []
				});
				return c;
			} else {
				Ext.applyIf(c, {
					plugins: [],
					anchor: '100%',
					labelSeparator: me.layoutConfig.labelSeparator
				});
				c.plugins.push({
					ptype: 'formreadonly'
				});
				switch(c.xtype) {
					case "tabpanel":
						Ext.applyIf(c, {
							activeTab: 0,
							bodyPadding: 10,
							deferredRender: false,
							border: false,
							defaults: {
								layout: 'form',
								anchor: '100%',
								labelSeparator: me.layoutConfig.labelSeparator
							}
						});
						Ext.each(c.items, function(it){
							if(it.items && it.items.length==1){
								it.layout = 'fit'
							}
						}, this);
						
						break;
					case "radiogroup":
						Ext.each(c.items, function(c) {
							c.xtype = 'radiofield';
						});
						break;
					case "checkboxgroup":
						Ext.each(c.items, function(c) {
							c.xtype = 'checkboxfield';
						});
						break;
					case "datefield":
						Ext.applyIf(c, {
							format: "d/m/Y",
							submitFormat: "d/m/Y"
						});

						// Init-Actualise avec la date du jour (après le chargement)
						if(c.value == 'now') {
							me.view.on('afterload', function() {
								var f = me.view.form.findField(c.name);
								if(f) f.setValue(Ext.Date.clearTime(new Date()));
							});
						}
						if(c.maxValue == 'now') {
							c.maxValue = new Date();
						}
						if(c.minValue == 'now') {
							c.minValue = new Date();
						}
						break;
					case "timefield":
						Ext.applyIf(c, {
							format: "H:i",
							submitFormat: "H:i"
						});

						// Init-Actualise avec la date du jour (après le chargement)
						if(c.value == 'now') {
							me.view.on('afterload', function() {
								var f = me.view.form.findField(c.name);
								if(f) f.setValue(Ext.Date.format(new Date(), c.format));
							});
						}
						break;
					case "fileuploadfield":
					case "filefield":
						// If photo taking is allow
						c.readOnly = false;
						if(c.uploadImage !== false) {
							var panelId = Ext.id();
							
							var removeBtn = {
								xtype: "button",
								iconCls: "fa fa-remove",
								width: 30,
								style: {
									"margin-top": "6px",
									"margin-left": "5px"
								},
								handler: function() {
									var panel = Ext.getCmp(panelId);
									panel.items.getAt(0).camera = "";
									panel.items.getAt(0).setValue("");
								}
							}
							
							// Delete camera picture when file is choosen from explorer
							c.listeners = {
								change: function() {
									this.camera = "";
								}
							},
							c.columnWidth = 1;
							
							// Fix form.setValue
							c.setValue = function(value) {
								this.setRawValue(value);
								this.fireEvent("change", value);
							}
							
							c = {
								xtype: "panel",
								id: panelId,
								processItems: false,
								width: "100%",
								layout: "column",
								items: [c]
							}
							
							if(Ext.isObject(navigator.camera) && Ext.isFunction(navigator.camera.getPicture)) {
								var pictureBtn = {
									xtype: "button",
									iconCls: "fa fa-camera",
									width: 30,
									style: {
										"margin-top": "6px",
										"margin-left": "5px"
									},
									handler: function() {
										navigator.camera.getPicture(function(panelId, b64_image) {
											var panel = Ext.getCmp(panelId);
											var field = panel.items.getAt(0);
											field.setValue("ckcam_" + (new Date()).getTime().toString() + ".jpg");
											field.camera = Ck.b64toBlob(b64_image, "image/jpeg");
											panel.items.replace(0, field);
										}.bind(this, panelId), function() {
											alert('error');
										},{
											destinationType: navigator.camera.DestinationType.DATA_URL
										})
									}
								}
								c.items.push(pictureBtn);
							}
							
							
							c.items.push(removeBtn);
						}
						break;
					case "combo":
					case "combobox":
					case "grid":
					case "gridpanel":
					case "gridfield":
						/**
						 * Internal function to initialse store definition. This is the defaults params :
						 *	{
						 *		autoLoad: true,
						 *		fields: [{name: "value", type: "value"}],
						 *		proxy	: {
						 *			type	: "ajax",
						 *			reader	: {
						 *				type	: "array"
						 *			}
						 *		}
						 *	}
						 *
						 * To use inline data, params should be like this :
						 *	["item1", "item2", "item3"]
						 * or
						 *	{
						 *		fields: [{name: "value", "string"},{name: "label", "string"}],
						 *		data: [{value: "id1", "label": "foo"},{value: "id2", "label": "bar"}]
						 *	}
						 *
						 * @param {Object} Store params from JSON
						 * @return {Object} Config object passed to Ext.data.Store constructor
						 */
						var processStore = function(o) {
							// storeUrl : alias to define proxy type ajax with url.
							var store = o.store;
							var storeUrl = o.storeUrl;

							
							if(Ext.isString(store)) {
								if(store.indexOf("/") == -1) {
									// Get store in ViewModel (global store pre-loaded)
									if(me.getViewModel().get(store)) {
										return me.getViewModel().get(store);
									}
									// >> ViewModel is not ready (hierarchy) the form is not yet added to the view...

									// Get store in Application
									if(Ext.getStore(store)) {
										return Ext.StoreManager.get(store);
									}
								} else {
									// If store is an URL that automatic store is created
									storeUrl = store;
									store = {};
								}
							}
							
							// Store conf can be an object (test original conf)
							if(Ext.isObject(o.store)) {
								if(Ext.isString(store.url)) {
									// Another alias to define storeUrl
									storeUrl = store.url;
									delete store.url;
								}
								if(store.proxy && store.proxy.url) {
									// Standard way to define URL but need to get it for templating and format
									storeUrl = store.proxy.url;
									delete store.proxy.url;
								}
							}
							
							// For combo store can be defined inline.
							// need to build storeUrl...
							if(me.compatibiltyMode && !store) {
								if(o.xtype == 'combo' || o.xtype == 'combobox'){
									var baseparams = {
										s: 'forms',
										r: 'getStore',
										// Précise une couche ou recup la couche associée au form
										layer: c.layer || me.formConfig.layername || me.view.layer,
										
										// TODO
										// Précise un datasource + une table
										// datasource: this.datasource,
										// data: this.data,
										
										// TODO
										// Filtres en fonction des parents
										//params: encodeURIComponent(Ext.encode(c.parentValue)),
										
										// Le champ 'valeur' envoyé par le formulaire
										valuefield: c.valueField,
										field: c.displayField || c.name
										// query : param automatique lors du autocomplete
									};
									storeUrl = Ck.getApi() + Ext.urlEncode(baseparams);
									store = {};
								}
							}
							
							if(storeUrl) {
								// Apply template if available like dataUrl. Typically to insert object id in the URL
								var v = me.getView();
								var fid = v.getDataFid();
								if(fid) {
									var tpl = new Ext.Template(storeUrl);
									if(Ext.isString(fid)) fid = [fid];
									storeUrl = tpl.apply(fid);
								}

								if(me.compatibiltyMode) {
									// Need default reader Array for Chinook V1 store
									store = Ext.Object.mergeIf(store, {
										autoLoad: !(c.queryMode === 'remote'),
										fields: [{name: "value", type: "string"}],
										proxy: {
											type: "ajax",
											noCache: false,
											url: me.getFullUrl(storeUrl),
											withCredentials: true,
											reader: {
												type: "array"
											}
										}
									});
								} else {
									// Need default JSON reader
									store = Ext.Object.merge(store, {
										autoLoad: !(c.queryMode === 'remote'),
										proxy: {
											type: "ajax",
											noCache: false,
											url: me.getFullUrl(storeUrl)
										}
									});
								}
							} else if(Ext.isObject(store)) {
								// Inline data
							}

							// Default in-memory Store
							if(!store) {
								store = {
									proxy: 'memory'
								}
							}
							return store;
						}

						if(c.itemTpl) {
							c.listConfig = {
								itemTpl: c.itemTpl
							}
							// By default use same template for list and display
							if(!c.displayTpl) c.displayTpl = c.itemTpl;
							c.displayTpl = '<tpl for=".">' + c.displayTpl + '</tpl>';
						}
						delete c.itemTpl;

						// Init stores for grid editor
						if(Ext.isArray(c.columns)) {
							Ext.each(c.columns, function(col, idx, cols) {
								if(col.editor && col.editor.store) {
									cols[idx].editor.store = processStore(col.editor)
								}
								// Compatibility
								if(me.compatibiltyMode) {
									if(col.name && !col.dataIndex){
										// col.dataIndex = col.name.replace(/\./g, '_');
										col.dataIndex = col.name;										
									}										
									if(col.editor && col.editor.xtype && (col.editor.xtype.substr(0,3) == 'ck_')) {
										col.editor.xtype = col.editor.xtype.substr(3);
									}
									if(col.header) {
										col.text = col.header;
										delete col.header;
									}
									if(col.renderer) {
										col.formatter = col.renderer;
										delete col.renderer;
									}
								}
								//
							});
						}
						
						// For autocomplete field
						if(c.autocomplete) {
							c.hideTrigger = true;
							c.queryMode = "remote";
							c.minChars = 2;
							
							// Overload doQuery method to insert "%"
							c.doQuery = function(queryString, forceAll, rawQuery) {
								var me = this,
									// Decide if, and how we are going to query the store
									queryPlan = me.beforeQuery({
										query: "%" + (queryString || '') + "%",
										rawQuery: rawQuery,
										forceAll: forceAll,
										combo: me,
										cancel: false
									});
								// Allow veto.
								if (queryPlan !== false && !queryPlan.cancel) {
									// If they're using the same value as last time (and not being asked to query all), just show the dropdown
									if (me.queryCaching && queryPlan.query === me.lastQuery) {
										me.expand();
									} else // Otherwise filter or load the store
									{
										me.lastQuery = queryPlan.query;
										if (me.queryMode === 'local') {
											me.doLocalQuery(queryPlan);
										} else {
											me.doRemoteQuery(queryPlan);
										}
									}
								}
								return true;
							}
						}
						
						Ext.Object.merge(c, {
							store		: processStore(c),
							listeners	: {
								removed	: function(item, ownerCt, eOpts) {
									item.removeBindings()
								}
							}
						});
						
						if(me.compatibiltyMode) {
							delete c.displayField;
							
							Ext.applyIf(c, {
								displayField: "value" //,
								//queryMode: 'local'
							});
						}
						break;
				}
				
				if(c.xtype == "grid" || c.xtype == "gridpanel" || c.xtype == "gridfield") {
					// Try to merge plugins config and default config
					var applyDefault = function(plugins, defaults) {
						if(!Ext.isArray(plugins)) return defaults;
						if(!Ext.isArray(defaults)) return plugins;

						for(var d=0; d<defaults.length; d++) {
							var defaultPlugin = defaults[d];

							var exist = false;
							for(var p=0; p<plugins.length; p++) {
								if(plugins[p].ptype === defaultPlugin.ptype) {
									exist = true;
									// merge
									plugins[p] = Ext.applyIf(plugins[p], defaultPlugin);
									break;
								}
							}

							if(!exist) {
								plugins.push(defaultPlugin);
							}
						}

						return plugins;
					};

					if(c.subform) {
						c.plugins = applyDefault(c.plugins, [{
							ptype: 'gridsubform'
						}]);
					} else {
						c.plugins = applyDefault(c.plugins, [{
							ptype: 'gridediting'
						}, {
							ptype: 'rowediting',
							pluginId: 'rowediting',
							clicksToEdit: 1
						}]);
					}
				}

				if(c.layout == 'column') {
					// TODO : simplifié l'ajout auto de xtype container mais pas tjrs...
					Ext.applyIf(c, {
						defaults: {
							layout: 'form',
							labelSeparator: me.layoutConfig.labelSeparator,
							border: false
						}
					});
				}

				if(c.name && !c.fieldLabel && !c.boxLabel) {
					c.fieldLabel = c.name;
				}

				if(c.items && c.processItems !== false) {
					Ext.each(c.items, fn, this);
				}
			};
			return c;
		}.bind(this);
		
		for(var key in cfg.items) {
			cfg.items[key] = fn(cfg.items[key]);
		}
		return cfg;
	},

	startEditing: function() {
		this.getViewModel().set("editing", true);
		this.getViewModel().set("isEditable", false);

		this.fireEvent('startEditing');
	},

	stopEditing: function() {
		this.getViewModel().set("editing", false);
		this.getViewModel().set("isEditable", true);

		this.fireEvent('stopEditing');
	},

	
	/**
	 * Collect all data from form. Recursively called for the subforms.
	 * @param {Function}
	 */
	getValues: function(callback, values) {
		if(Ext.isEmpty(values)) {
			var values = {};
		}
		var v = this.getView();
		var form = v.getForm();
		var fid = v.getDataFid();
		
		// If true all field was processed
		if(this.fieldsProcessed == this.fieldsToProcess) {
			this.savedValues = values;
			
			
			if(this.compatibiltyMode) {
				var lyr = v.getLayer();
				if(Ext.isObject(fid)) {
					fid = fid.fid;
				}
				var res = {
					fid: fid,
					params: values
				};
				
				values = {};
				values['main'] = res;

				// data des gridpanel (il ne font pas partie du form...)
				var grdValues = this.getGridValues();
				Ext.apply(values, grdValues);
				//
			}

			// Loop on subforms
			if(this.formsProcessed < this.formsToProcess) {
				var subforms = v.query('ckform');
				var sf = subforms[this.formsProcessed++];
				if(!sf.name || this.fields.indexOf(sf.name) == -1) {
					this.getValues.apply(this, arguments);
					return;
				}

				// Add the callback
				var args = Array.prototype.slice.apply(arguments);
				args.unshift(this.getValues);
				
				var ctrl = sf.getController();
				ctrl.getValues.apply(ctrl, arguments);
			} else {
				if(this.compatibiltyMode) {
					values = {
						name: lyr,
						data: encodeURIComponent(Ext.encode(values))
					}
				}
				
				// First argument will be delete (is the callback)
				var fn = callback;
				var args = Array.prototype.slice.apply(arguments);
				args.splice(0, 1);
				
				fn.apply(this, args);
			}
		} else {
			field = this.fields[this.fieldsProcessed];
			var f = form.findField(field);
			if(!Ext.isEmpty(f)) {
				var xtype = f.getXType();
				if(xtype == 'hidden' || f.isVisible()) {
					values[field] = f.getValue();

					// Allow formatting date before send to server
					if(f.submitFormat) {
						values[field] = f.getSubmitValue();
					}

					// Get value for radioGroup
					if(f.getGroupValue) {
						values[field] = f.getGroupValue();
					}
					
					// Get value for file field
					if(xtype == "filefield" || xtype == "fileuploadfield") {
						var fName = f.getValue().split("/").pop().split("\\").pop();
						var inp = f.getEl().dom.getElementsByTagName("input");
						if(inp[0].type == "file") {
							inp = inp[0];
						} else {
							inp = inp[1];
						}
						
						if(!Ext.isEmpty(f.camera)) {
							values[field] = f.getValue();
							this.files.push({
								name: field,
								value: f.camera,
								filename: f.getValue()
							});
						} else {
							if(inp.files.length != 0) {
								// Read the file to create a Blob
								var reader = new FileReader();
								reader.onloadend = function(args, fName, evt) {
									values[field] = fName;
									this.files.push({
										name: field,
										value: Ck.dataURItoBlob(reader.result),
										filename: fName
									});
									this.fieldsProcessed++;
									this.getValues.apply(this, args);
								}.bind(this, arguments, fName);
								reader.readAsDataURL(inp.files[0]);
								return;
							}
						}
					}
				}				
			}
			this.fieldsProcessed++;
			this.getValues.apply(this, arguments);
		}
	},

	// From ck1 : compatibility
    getGridValues: function() {
        var res = {};
        var grids = this.getView().query('gridpanel');

        // Boucle sur les grid panel de la fiche
        for(var g=0; g<grids.length; g++){
            var recs = [];
            var grid = grids[g];
            var store = grid.getStore();
            var mrecs = store.getModifiedRecords();            
            var drecs = store.getRemovedRecords();

            // Boucle sur les records modifiés du gridpanel
            for(var r=0; r<mrecs.length; r++){
                // 0 si nouvelle ligne sinon recup l'id de la ligne (il est dans les data mais pas affiché)
                var params = mrecs[r].getData();
				var fid = params.fid;
				// Clean params used to build sql query
				if(Ext.String.startsWith(params.id, 'ext')) delete params.id;
				delete params.fid;
				
                // Récup les données modifiés + l'id du record
                recs.push({
                    fid: fid,
                    params: params
                });
            }
            
            // Boucle sur les records supprimés du gridpanel
            for(var r=0; r<drecs.length; r++){
                if(drecs[r].json) {
                    recs.push({
                        fid: drecs[r].json.fid,
                        params: {}
                    });
                }
            }
            
            res[grid.id] = recs;
        }

        return res;
    },
	
	setValues: function(data) {
		if(!data) return;

		var v = this.getView();
		var form = v.getForm();
		form.setValues(data);
		
		// Fix to fire "change" event for combobox
		form.getFields().each(function(field) {
			if(field.xtype == "combobox") {
				field.fireEvent("change");
			}
		});

		// SUBFORM : load data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(data[sf.name]) sf.getController().setValues(data[sf.name]);
		}
		//
		
		// Compatibility
		// GRID : load data
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			if(grid.id && data[grid.id]){
				grid.getStore().loadData(data[grid.id]);
				
				grid.getStore().on({
					datachanged: function() {
						var a=a;
					}
				});
			}
		}
		//
	},

	/**
	 * Prevent validate subform fields...
	 */
	isValid: function() {
		var v = this.getView();
		var form = v.getForm();
		var isValid = true;

		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && f.isVisible() && !f.isValid()) {
				isValid = false;
				Ck.log(f.name + ' not Valid !');
			}
		}, this);

		// SUBFORM : save data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(!sf.name) continue;
			if(this.fields.indexOf(sf.name)==-1) continue;

			if(!sf.getController().isValid()) isValid = false;
		}
		//

		// TODO : manage grid as field with a plugin... AND perform save in the plugin.
		// GRID : save data only if gridpanel is not linked to main form with a name property
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			if(grid.name) continue;
			var requiredColumn;

			// Test all columns for required fields
			grid.getStore().each(function(rec) {
				if(rec.data.dummy === true) return;
				grid.getColumns().forEach(function(col) {
					if(!col.dataIndex) return;
					var val = rec.data[col.dataIndex];

					if((!val) && (col.allowBlank === false)) {
						isValid = false;
						requiredColumn = col;
						Ck.log(col + ' not Valid !');
						return false;
					}
				});
				if(!isValid) return false;
			});

			if(!isValid) {
				Ext.Msg.alert("Required fields", " This field is required : "+ requiredColumn.text);
			}

			// TEMP : assume only one grid !
			break;
		}
		//
		//

		return isValid;
	},

	/**
	 * Load data for a specific feature
	 * @param {Object}
	 */
	loadFeature: function(options) {
		var me = this;
		var v = me.getView();

		// Getters via config param in the view
		var lyr = v.getLayer();
		var bSilent = false;

		// Call beforeLoad plugin. If it return false then cancel the loading
		if(this.oController.beforeLoad(options) === false) {
			Ck.log("beforeLoad cancel loadFeature.");
			return;
		}

		// 
		if(!options) {
			options = {};
			bSilent = true;
		}
		var fid = options.fid || v.getDataFid();
		var url = options.url || me.dataUrl || v.getDataUrl();
		var data = options.raw || v.getDataRaw();
		var model = options.model || me.dataModel || v.getDataModel();

		// Load inline data
		if(data) {
			this.loadData(data);
				return;
			}

		// Load data from model (offline websql Database - model is linked to a websql proxy)
		if(fid && model) {
			model.setId(fid);
			model.load({
				success: function(record, operation) {
					var data = record.getData();
					this.loadData(data);
						return;
				},
				failure: function(record, operation) {
					//do something if the load failed
				},
				scope: this
			});
			return;
		}

		// Load data by ID - build standard url
		if(fid) {
			// TODO : Call un service REST for loading data...
			if(url) {
				// Form provide un template URL (or multiples URL) to load data
				var dataUrl = url;
				if(Ext.isObject(dataUrl)) {
					dataUrl = dataUrl.read;
				}

				var tpl = new Ext.Template(dataUrl);
				if(Ext.isString(fid)) {
					fid = {
						fid: fid,
						layer: lyr
					};
				}
				url = tpl.apply(fid);
			} else {
				// Build default url
				if(lyr && !Ext.isObject(fid)) {
					if(this.compatibiltyMode) {
						url = Ck.getApi() + "service=forms&request=getData&name=" + lyr + "&fid=" + fid;
					} else {
						url = 'resources/data/' + lyr + '/' + fid + '.json';
					}
				}
			}
		}


		if(!url) {
			if(!bSilent) Ck.Notify.error("Forms loadFeature 'fid' or 'url' not set.");

			// If new form with empty data we need to startEditing too...
			if(v.getEditing() === true) this.startEditing();

			return;
		}


		// Load data from custom URL ou standard URL
		url = this.getFullUrl(url);
		Cks.get({
			url: url,
			scope: this,
			success: function(response) {
				if(response.responseText=="") response.responseText = "{}";
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200) {
					if(!data) {
						Ck.Notify.error("Invalid JSON Data in : "+ url);
						return false;
					}

					// Compatibility
					if(data.success === true && data.data) {
						data = data.data;
					}
					//

					this.loadData(data);
				}

				if(v.getEditing() === true) this.startEditing();
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms loadFeature error when loading data from : "+ url +".");

				this.fireEvent('loadfailed', response);
				this.oController.loadFailed(response);
			}
		});
	},

	/**
	 * Load data from object
	 * @param {Object}
	 */
	loadData: function(data) {
		var me = this;
		var v = me.getView();
		var lyr = v.getLayer();
		
		// Initialize the submit empty
		me.resetData();

		if(this.oController.afterLoad(data) === false) {
			Ck.log("afterLoad cancel loadFeature.");
			return;
		}

		this.getViewModel().setData({
			layer: lyr,
			data: data
		});
		
		this.getViewModel().notify();
		this.setValues(data);

		this.fireEvent('afterload', data);

		// If it's an edit form start the editing
		if(v.getEditing() === true) {
			this.startEditing();
		}
	},

	/**
	 * Save data
	 * @param {Object}
	 * @param {Function/Object}
	 * @return {Boolean}
	 */
	saveData: function(values, options) {
		var me = this;
		var v = me.getView();
		
		if(Ext.isEmpty(values)) {
			this.files = [];
			this.fieldsProcessed = 0;
			this.fieldsToProcess = this.fields.length;
			
			this.formsProcessed = 0;
			this.formsToProcess = v.query('ckform').length;
			
			this.getValues(this.saveData, {}, options);
			return;
		}
		
		options = options || {};

		

		var sid = v.getSid();
		var lyr = v.getLayer();

		var fid = options.fid || v.getDataFid();
		var url = options.url || me.dataUrl || v.getDataUrl();
		var model = options.model || me.dataModel || v.getDataModel();

		// Compatibility : pass only success callbak
		if(Ext.isFunction(options)) {
			options.success = options;
			options.scope = this;
		}
		options = Ext.applyIf(options, {
			method: 'PUT'
		});
		if(options.create || this.compatibiltyMode) {
			options.method = 'POST';
		}

		// Test if form is valid (all fields of the main form)
		if(!this.isValid()) {
			Ck.log("Form is not valid in saveData : "+ this.name);
			return false;
		}

		this.fireEvent('beforesave');
		
		if(this.oController.beforeSave(values, options) === false) {
			Ck.log("beforeSave cancel saveData.");
			return false;
		}

		// SUBFORM : save data only if subform is not linked to main form with a name property
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];

			// TODO : manage save callback...
			// Try save only if subform has non name and isSubForm = false (isSubForm == true when subform liked with grid)
			if(!sf.name && !sf.isSubForm) {
				sf.getController().saveData();
			}
		}

		// TODO : manage grid as field with a plugin... AND perform save in the plugin.
		// GRID : save data only if gridpanel is not linked to main form with a name property
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			if(grid.name) continue;

			var dtg = [];

			// Get all records with special formatting for date...
			grid.getStore().each(function(rec) {
				if(rec.data.dummy === true) return;
				var row = {};
				grid.getColumns().forEach(function(col) {
					if(!col.dataIndex) return;
					var val = rec.data[col.dataIndex];
					if(col.xtype == 'datecolumn' && col.submitFormat) {
						row[col.dataIndex] = val ? Ext.Date.format(val, col.submitFormat) : '';
					}else{
						row[col.dataIndex] = val;
					}
				});

				// Need to add extra data (all fields of 'rec' are not displayed in grid columns)
				dtg.push( Ext.applyIf(row, rec.data) );
			});

			// Use Grid url and data for saving form !
			// Need rework ;)
			url = grid.getStore().getProxy().getUrl();
			values = dtg;

			// TEMP : assume only one grid !
			break;
		}

		// If add/edit record in compatibiltyMode in a subform
		// It's the main form who save the data...
		// Just populate main grid here with data
		if(this.compatibiltyMode && this.isSubForm) {
			var val = Ext.decode(decodeURIComponent(values.data));
			Ext.callback(options.success, options.scope, [val.main.params]);
			return true;
		}
		//
		
		// If a model is set we use it
		if(fid && model) {
			model.set(values);
			model.save({
				success: function(record, operation) {
					Ext.callback(options.success, options.scope, [values]);
				},
				failure: function(record, operation) {
					// TODO : on Tablet when access local file via ajax, success pass here !!
					Ck.Notify.error("Forms saveData error when saving data : "+ url +".");

					this.fireEvent('savefailed', record);
					this.oController.saveFailed(record);
				},
				scope: this
			});
			return true;
		}
		
		// Build default url
		if(Ext.isEmpty(url)) {
			if(this.compatibiltyMode) {
				url = Ck.getApi() + "service=forms&request=edit&name={layer}&fid={fid}";
			} else {
				url = "resources/data/{layer}/{fid}.json";
			}
		}

		// Load data by ID - build standard url
		if(fid || lyr) {
			// TODO : Call un service REST for loading data...
			if(url) {
				// Form provide un template URL (or multiples URL) to load data
				var dataUrl = url;
				if(Ext.isObject(dataUrl)) {
					dataUrl = dataUrl.read;
				}

				var tpl = new Ext.Template(dataUrl);
				if(!fid) fid = '';
				if(Ext.isString(fid)) {
					fid = {
						fid: fid,
						layer: lyr
					};
				} else {
					fid = Ext.applyIf(fid,{
						fid: fid,
						layer: lyr
					});
				}
				url = tpl.apply(fid);
			} else {
				Ck.log("fid ("+ fid +") defined but no dataUrl template in "+ this.name);
			}
		}
		
		if(!url) {
			Ck.log("Forms saveData 'fid' or 'url' not set in "+ this.name);
			Ext.callback(options.success, options.scope, [values]);
			return false;
		}
		
		var opt = {
			method: options.method.toUpperCase(),
			url: this.getFullUrl(url),
			params: values,
			files: this.files,
			encode: false,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			scope: this,
			success: function(response) {
				this.saveMask.hide();
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200 || response.status == 201) {
					this.fireEvent('aftersave', this.savedValues);
					if(this.oController.afterSave(data) === false) {
						Ck.log("afterSave cancel saveData.");
						return false;
					}
				}
				Ext.callback(options.success, options.scope, [data]);
			},
			failure: function(response, opts) {
				this.saveMask.hide();
				this.fireEvent('savefailed', response);
				if(this.oController.saveFailed(response) === false) {
					return false;
				}

				Ck.Notify.error("Forms saveData error when saving data : "+ url +".");
			}
		};
		
		this.saveMask = new Ext.LoadMask({
			target: v,
			msg: "Save in progress..."
		});
		this.saveMask.show();
		
		if(this.files && this.files.length>0){
			// Save data from custom URL or standard URL
			Cks.xhr(opt);
		} else {
			Cks[options.method.toLowerCase()](opt);
		}
	},
	
	deleteData: function(options) {
		options = options || {};

		var me = this;
		var v = me.getView();

		var fid = options.fid || v.getDataFid();
		var url = options.url || me.dataUrl || v.getDataUrl();
		var model = options.model || me.dataModel || v.getDataModel();

		// Compatibility : pass only success callbak
		if(Ext.isFunction(options)) {
			options.success = options;
			options.scope = this;
		}
		//

		var dt = fid;

		if(this.oController.beforeDelete(dt) === false) {
			Ck.log("beforeDelete cancel deleteData.");
			return false;
		}

		if(fid && model) {
			model.set(dt);
			model.erase({
				success: function(record, operation) {
					Ext.callback(options.success, options.scope, [dt]);
				},
				failure: function(record, operation) {
					// TODO : on Tablet when access local file via ajax, success pass here !!
					Ck.Notify.error("Forms deleteData error when deleting data : "+ url +".");

					this.fireEvent('deletefailed', record);
					this.oController.deleteFailed(record);
				},
				scope: this
			});
			return;
		}

		// Delete data by ID - build standard url
		if(fid) {
			// TODO : Call un service REST for loading data...
			if(url) {
				// Form provide un template URL to load data
				var dataUrl = url;
				if(Ext.isObject(dataUrl)) {
					dataUrl = dataUrl['delete'];
				}
				var tpl = new Ext.Template(dataUrl);
				if(Ext.isString(fid)) fid = [fid];
				url = tpl.apply(fid);
			} else {
				Ck.log("fid ("+ fid +") defined but no dataUrl template in "+ this.name);
			}
		}

		if(!url) {
			Ck.log("Forms deleteData 'fid' or 'url' not set in "+ this.name);
			Ext.callback(options.success, options.scope, [dt]);
			return false;
		}

		// Load data from custom URL ou standard URL
		url = this.getFullUrl(url);
		Cks.del({
			url: url,
			scope: this,
			success: function(response) {
				var data = Ext.decode(response.responseText, true);
				if(response.status == 202) {
					this.fireEvent('afterdelete', data);
					if(this.oController.afterDelete(dt) === false) {
						Ck.log("afterDelete cancel deleteData.");
						return false;
					}
				}
				Ext.callback(options.success, options.scope, [dt]);
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms deleteData error when deleting data : "+ url +".");

				this.fireEvent('deletefailed', response);
				this.oController.deleteFailed(response);
			}
		});
	},

	resetData: function() {
		var v = this.getView();

		// Reset main form
		v.reset();

		// SUBFORM : reset data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			sf.reset();
			if(sf.getViewModel().get('updating') === true) {
				sf.getViewModel().set('updating', false);
			}
			sf.getController().fireEvent('afterreset');
		}
		//

		// GRID : reset data
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			grid.getStore().removeAll();
		}
		//
		
		// Reset viewModel data (binding...)
		this.getViewModel().setData({
			layer: null,
			fid: null,
			data: null
		});
		this.getViewModel().notify();

		this.fireEvent('afterreset');
		return true;
	}
});

Ext.util.Format.image = function(value, meta, rec, rowIndex, colIndex, store) {
    var i, p, w = '';
    var f = store.fields.get(this.dataIndex || this.name);
    i = "<img src='"+ value +"' alt='Image non disponible'/>";
    if(f && f.rendererOption) {
        p = f.rendererOption.path || '';
        w = f.rendererOption.width || '';
        h = f.rendererOption.height || '';
        if(p) p += '/';
        if(w) w = " width='"+w+"px'";
        if(h) h = " height='"+h+"px'";
        i = "<img src='"+ p + value +"' "+ w +" "+ h +" alt='Image non disponible'/>";
    }
    return i;
}
