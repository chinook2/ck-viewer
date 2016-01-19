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
	// dataStore: null,

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
	//
	
	fieldsProcessed: 0,
	formsProcessed: 0,
	
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
		var parentForm = this.view.up('ckform');
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

			// Try find parent form name (used for overriden controllers)
			if(inlineForm && !inlineForm.name) {
				inlineForm.name = parentForm.getController().name;
			}
		}

		if(this.editing===true) this.startEditing();
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
		var res = this.saveData(function() {
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

			this.stopEditing();
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

			this.name = form.name;
			if(!this.name) {
				Ck.log("Enable to get form Name.");
				CkLog(form);
				return;
			}

			this.dataUrl = null;
			this.dataModel = null;
			// this.dataStore = null;

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
			if(this.autoLoad) this.loadData();
		}

		return true;
	},

	/*
	 * Get Form definition
	 * @param
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

	// Get the main form controller (the 1st)
	getRootForm: function() {
		var rootForm = this.getView().findParentBy(function(cmp) {
			if(cmp.xtype != 'ckform') return false;
			return (cmp.getController().parentForm === false);
		});
		if(rootForm) return rootForm.getController();
		// By default return the current controller !
		return this;
	},
	
	// Get subForms by Name or formName
	getSubForm: function(val) {
		var sub = this.getView().down('ckform[name='+val+']');
		if(!sub) sub = this.getView().down('ckform[formName='+val+']');
		if(sub) return sub.getController();
		return false;
	},
	
	// List all included form in a form.
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
				if(c.xtype != "fileuploadfield" && c.xtype != "filefield") {
					c.plugins.push({
						ptype: 'formreadonly'
					});
				}
				switch(c.xtype) {
					case "tabpanel":
						Ext.applyIf(c, {
							activeTab: 0,
							bodyPadding: 10,
							deferredRender: false,
							border: false,
							defaults: {
								anchor: '100%',
								labelSeparator: me.layoutConfig.labelSeparator
							}
						});
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
							format: "d/m/Y"
						});

						// Init-Actualise avec la date du jour (après le chargement)
						if(c.value == 'now') {
							me.view.on('afterload', function() {
								var f = me.view.form.findField(c.name);
								if(f) f.setValue(Ext.Date.clearTime(new Date()));
							});
						}
						break;
					case "timefield":
						Ext.applyIf(c, {
							format: "H:i"
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
						if(c.uploadImage !== false) {
							var panelId = Ext.id();
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
										panel.items.getAt(0).camera = Ck.b64toBlob(b64_image, "image/jpeg");
										panel.items.getAt(0).setValue("ckcam_" + (new Date()).getTime().toString() + ".jpg");
									}.bind(this, panelId), function() {
										alert('error');
									},{
										destinationType: navigator.camera.DestinationType.DATA_URL
									})
								}
							}
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
							c.setValue = Ext.form.field.File.prototype.setRawValue;
							
							c = {
								xtype: "panel",
								id: panelId,
								processItems: false,
								width: "100%",
								layout: "column",
								items: [c, pictureBtn, removeBtn]
							}
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
									storeUrl = o.store;
									store = {};
								}
							}
							
							// Store conf can be an object
							if(Ext.isObject(o.store)) {
								if(Ext.isString(store.url)) {
									// Another alias to define storeUrl
									storeUrl = store.url;
									delete store.url;
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
										autoLoad: !(c.queryMode==='remote'),
										fields: [{name: "value", type: "string"}],
										proxy: {
											type: "ajax",
											noCache: false,
											url: me.getFullUrl(storeUrl),
											reader: {
												type: "array"
											}
										}
									});
								} else {
									// Need default JSON reader
									store = Ext.Object.mergeIf(store, {
										autoLoad: !(c.queryMode==='remote'),
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
							});
						}

						Ext.applyIf(c, {
							displayField: "value",
							queryMode: 'local'
						});
						Ext.Object.merge(c, {
							store		: processStore(c),
							listeners	: {
								removed	: function(item, ownerCt, eOpts) {
									item.removeBindings()
								}
							}
						});
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
						c.plugins = applyDefault(c.plugins,  [{
							ptype: 'gridsubform'
						}]);
					} else {
						c.plugins = applyDefault(c.plugins,  [{
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
	 /*
	getValues: function(callback, values) {
		if(Ext.isEmpty(values)) {
			var values = {};
		}
		var v = this.getView();
		var form = v.getForm();
		var fid = v.getDataFid();
		
		if(this.fieldsProcessed == this.fieldsToProcess) {
			if(this.compatibiltyMode) {
				var lyr = v.getLayer();
				var res = {
					fid: fid.fid,
					params: values
				};
				values = {};
				values['main'] = res;
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
						name: fid.layer,
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
					if(xtype == "filefield") {
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
								var reader  = new FileReader();
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
	*/

	// Prevent getting values from subform...
	getValues: function() {
		var v = this.getView();
		var form = v.getForm();

		var values = {};
		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && (f.xtype=='hidden' || f.isVisible())) {
				values[field] = f.getValue();

				// allow formatting date before send to server
				if(f.submitFormat) {
					values[field] = f.getSubmitValue();
				}

				// get value for radioGroup
				if(f.getGroupValue) {
					values[field] = f.getGroupValue();
				}
			}
		}, this);

		if(this.compatibiltyMode) {
			var fid = v.getDataFid();
			var lyr = v.getLayer();
			var res = {
				fid: fid.fid,
				params: values
			};
			values = {};
			values['main'] = res;
		}

		// SUBFORM : save data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(!sf.name) continue;
			if(this.fields.indexOf(sf.name)==-1) continue;

			values[sf.name] = sf.getController().getValues();
		}
		//

		if(this.compatibiltyMode) {
			return {
				name: fid.layer,
				data: encodeURIComponent(Ext.encode(values))
			}
		}
		return values;
	},
	
	setValues: function(data) {
		if(!data) return;

		var v = this.getView();
		var form = v.getForm();
		form.setValues(data);

		// SUBFORM : load data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(data[sf.name]) sf.getController().setValues(data[sf.name]);
		}
		//
	},

	// Prevent validate subform fields...
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
				if(rec.data.dummy===true) return;
				grid.getColumns().forEach(function(col) {
					if(!col.dataIndex) return;
					var val = rec.data[col.dataIndex];

					if((!val) && (col.allowBlank===false)) {
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
	loadData: function(options) {
		var me = this;
		var v = me.getView();

		// Getters via config param in the view
		var lyr = v.getLayer();
		var bSilent = false;

		if(this.oController.beforeLoad(options) === false) {
			Ck.log("beforeLoad cancel loadData.");
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
		// var store = options.store || v.getDataStore();

		// Init le form 'vide'
		me.resetData();

		// Load inline data
		if(data) {
			this.loadRawData(data);
			return;
		}

		// Load data from model (offline websql Database - model is linked to a websql proxy)
		if(fid && model) {
			model.setId(fid);
			model.load({
				success: function(record, operation) {
					var data = record.getData();
					this.loadRawData(data);
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
				if(Ext.isString(fid)) fid = [fid];
				url = tpl.apply(fid);
			} else {
				// Build default url
				if(lyr && Ext.isString(fid)) {
					url = 'resources/data/' + lyr + '/' + fid + '.json';
				}
			}
		}


		if(!url) {
			if(!bSilent) Ck.Notify.error("Forms loadData 'fid' or 'url' not set.");

			// If new form with empty data we need to startEditing too...
			if(v.getEditing()===true) this.startEditing();

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
					if(data.success===true && data.data) {
						data = data.data;
					}
					//

					this.loadRawData(data);
				}

				if(v.getEditing()===true) this.startEditing();
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms loadData error when loading data from : "+ url +".");

				this.fireEvent('loadfailed', response);
				this.oController.loadFailed(response);
			}
		});
	},

	loadRawData: function(data) {
		var me = this;
		var v = me.getView();
		var lyr = v.getLayer();
		
		if(this.oController.afterLoad(data) === false) {
			Ck.log("afterLoad cancel loadData.");
			return;
		}

		this.getViewModel().setData({
			layer: lyr,
			data: data
		});
		this.getViewModel().notify();
		this.setValues(data);

		this.fireEvent('afterload', data);

		if(v.getEditing()===true) this.startEditing();
	},
	
	/**
	 * Save data
	 * @param {Object}
	 * @param {Object}
	 * @return {Boolean}
	 */
	saveData: function(options, values) {
		/*
		if(Ext.isEmpty(values)) {
			this.files = [];
			this.fieldsProcessed = 0;
			this.fieldsToProcess = this.fields.length;
			
			this.getValues(this.saveData, {}, options);
			return;
		}
		*/
		options = options || {};

		var me = this;
		var v = me.getView();

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

		// 
		var values = this.getValues();
		//
		
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
				if(rec.data.dummy===true) return;
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

		// Load data by ID - build standard url
		if(fid) {
			// TODO : Call un service REST for loading data...
			if(url) {
				// Form provide un template URL to load data
				var dataUrl = url;
				if(Ext.isObject(dataUrl)) {
					dataUrl = dataUrl.update;
					if(options.create) dataUrl = dataUrl.create ||  dataUrl.update;
				}
				var tpl = new Ext.Template(dataUrl);
				if(Ext.isString(fid)) fid = [fid];
				url = tpl.apply(fid);
			} else {
				//Ck.log("fid defined but no dataUrl template in "+ this.name);
			}
		}

		if(!url) {
			Ck.log("Forms saveData 'fid' or 'url' not set in "+ this.name);
			Ext.callback(options.success, options.scope, [values]);
			return false;
		}
		
		var opt  = {
			method: options.method.toUpperCase(),
			url: this.getFullUrl(url),
			params: values,
			files: this.files,
			scope: this,
			success: function(response) {
				this.saveMask.hide();
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200 || response.status == 201) {
					this.fireEvent('aftersave', data);
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
			// Save data from custom URL ou standard URL
			Ck.Ajax.xhr(opt);
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

		// Init le form 'vide'
		v.reset();

		// Reset les données du viewModel (binding...)
		this.getViewModel().setData({
			layer: null,
			fid: null,
			data: null
		});
		this.getViewModel().notify();

		this.fireEvent('afterreset');

		/*
		// GRID : reset data
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			// Suppr tous les enregistrements du grid.
			grid.getStore().removeAll();
			// TODO : revoir le clean pour le subform...
			// Récup le subform
			var form = grid.getDockedComponent('subform');
			if(form) {
				form.reset();
				delete form.rowIndex;
			}
		}
		*/

		return true;
	}
});
