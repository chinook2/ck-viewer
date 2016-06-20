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
	rootForm: null,
	storage: null,

	formConfig: null,
	
	dataUrl: null,
	dataModel: null,
	// dataStore: null,

	layoutConfig: {
		labelSeparator: ' : '
	},

	fields: [],
	subforms: [],
	
	/**
	 * Form JSON data definition
	 */
	form: null,
	
	// TODO in config param in form json...
	compatibiltyMode: false,

	// create read update delete
	operation: '',
	
	// Override by named controller of the form Ck.form.controller.{name}
	beforeShow: Ext.emptyFn,
	afterShow: Ext.emptyFn,
	beforeClose: Ext.emptyFn,
	onDestroy: Ext.emptyFn,
	
	beforeLoad: Ext.emptyFn,
	afterLoad: Ext.emptyFn,
	loadFailed: Ext.emptyFn,

	beforeSave: Ext.emptyFn,
	afterSave: Ext.emptyFn,
	saveFailed: Ext.emptyFn,

	beforeDelete: Ext.emptyFn,
	afterDelete: Ext.emptyFn,
	deleteFailed: Ext.emptyFn,
	
	beforeReset: Ext.emptyFn,
	
	onClick: Ext.emptyFn,
	onChange: Ext.emptyFn,
	onSelect: Ext.emptyFn,
	
	// fieldsProcessed: 0,
	// formsProcessed: 0,
	
	processingForm: 0,
	processingData: 0,
	
	/**
	 * Global intercept events to add custom action in controller
	 */
	listen: {
		component: {
			'*': {
				click: function(cmp, e, eOpts ) {
					// Try to call dedicated function using handler
					if(cmp.handler) {
						if(!this[cmp.handler] && this.oController[cmp.handler]){
							this.oController[cmp.handler](cmp, e, eOpts);
							return false;
						}
					}
					
					// Call global onClick function
					return this.oController.onClick(cmp, e, eOpts);
				},
				change: function(cmp, newValue, oldValue, eOpts) {
					return this.oController.onChange(cmp, newValue, oldValue, eOpts);
				},
				select: function(cmp, record, eOpts) {
					return this.oController.onSelect(cmp, record, eOpts);
				}
			}
		},
		global:{
			mousedown: function(e, eOpts ){
				if(e.target && e.target.getAttribute("handler")){
					var h = e.target.getAttribute("handler");
					if(!this[h] && this.oController && this.oController[h]){
						this.oController[h](e, eOpts);
						return false;
					}
				}
			}
		}
	},
	
	init: function() {
		var v = this.view;
		this.isSubForm = v.getIsSubForm();
		this.autoLoad = v.getAutoLoad();
		this.editing = v.getEditing();
		this.isInit = false;
		this.subforms = [];

		// Init local Storage for production mode (test if it's enable in global conf app.json)
		if(Ck.getOption('ajaxCache') === true){
			var isStorage = 'Ck-' + Ext.manifest.name + '-Form';
			this.ls = Ext.util.LocalStorage.get(isStorage);
			if(!this.ls) {
				this.ls = new Ext.util.LocalStorage({
					id: isStorage
				});
			}
		}

		// Get form definition directly in the view (no Ajax request)
		var inlineForm = v.getFormRaw();
		
		// Find parentForm
		var parentForm = v.up('ckform');
		if(parentForm) {
			// inherit editing from parent only if current form doesn't specify true or false
			if(!Ext.isDefined(v.initialConfig.editing)){
				this.editing = parentForm.getEditing();
			}
			
			// inherit dataFid from main view form (used in store url template)
			vDataFid = v.getDataFid() || {};
			pDataFid = parentForm.getDataFid() || {};
			if(!Ext.isObject(vDataFid)) {
				vDataFid ={fid: vDataFid};
			}
			if(!Ext.isObject(pDataFid)) {
				pDataFid ={fid: pDataFid};
			}
			v.setDataFid(Ext.apply(vDataFid, pDataFid));

			// Try find parent form name (used for overriden controllers)
			if(inlineForm && !inlineForm.name) {
				inlineForm.name = parentForm.getController().name;
			}
			
			// Add reference of this form as subform for the parent...
			parentForm.getController().registerSubForm(this);
			
			this.parentForm = parentForm.getController();
		}
		
		// Keep reference of the main rootForm
		this.rootForm = this.getRootForm();
		this.updateProcessing(true, 'Form');
		this.rootForm.processingForm++;
		Ck.log("Init form : "+ this.view.formName + " (stack " + (this.rootForm.processingForm) + ")");
		// Need to Init processing Data here to preserve stack
		if(this.autoLoad){
			this.updateProcessing(true, 'Data');
			this.rootForm.processingData++;
		}
		//
		
		if(this.editing===true) this.startEditing();
		if(this.editing===false) this.stopEditing(true);
		
		if(!this.initForm(inlineForm)){
			this.rootForm.processingForm--;
			if(this.rootForm.processingForm<0) this.rootForm.processingForm = 0;
		}
	},
	
	/**
	 * Compatibility
	 */
	getDockedItems: function() {
		return this.getView().getDockedItems();
	},
	
	destroy: function() {
		if(this.ls) this.ls.release();
		if(this.oController){
			this.oController.onDestroy();
			this.oController.destroy();
		}
		this.callParent();
	},

	formLoad: function(btn) {
		if(btn && (btn.nextFormName || btn.formName)) {
			this.view.setFormName(btn.nextFormName || btn.formName);
			this.isInit = false;
			this.subforms = [];
			this.initForm();
			return;
		}
		
		if(btn && btn.nextFormUrl) {
			this.view.setFormUrl(btn.nextFormUrl);
			this.isInit = false;
			this.subforms = [];
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
			this.formLoad(btn);
			
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
		var forceClose = false;
		if(btn && btn.force === true) forceClose = true;

		var closeMe = function() {
			// Process subforms
			var subforms = this.getSubForms();
			for (var s = 0; s < subforms.length; s++) {
				var sf = subforms[s];
				// Allow to call beforeClose in subForms override
				if(sf.isInit) sf.formClose({force:true});
				this.unRegisterSubForm(sf);
			}
			
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

		// If nothing to save Force close action
		if(this.isDirty()==false) forceClose = true;
		
		if(forceClose) {
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
						this.saveData({
							success: function(){
						closeMe();
							}
						});
					} else if(btn === 'no') {
						closeMe();
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

				if(formName === false || formUrl === false) return false;
				
				this.getForm(formUrl);
				return true;
			}
			this.form = form;

			this.formConfig = form;
			this.name = form.name;
			if(!this.name) {
				Ck.log("Enable to get form Name.");
				CkLog(form);
				return false;
			}

			this.dataUrl = null;
			this.dataModel = null;
			// this.dataStore = null;
			
			// Apply style and bodyStyle
			if(form.style) {
				this.getView().setStyle(form.style);
			}
			if(form.bodyStyle) {
				this.getView().setBodyStyle(form.bodyStyle);
			}

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

			if(this.oController.beforeShow(form) === false || this.beforeShow(form) === false) {
				Ck.log("beforeShow cancel initForm.");
				return false;
			}

			// Format form definition - apply custom options and process
			var fcf = this.applyFormDefaults(form.form);
			
			// warp form in a fieldset
			var fs = this.view.getFieldset();
			if(fs===true) fs={};
			if(Ext.isObject(fs)){
				var formItems = fcf.items;
				fcf.items = [Ext.apply({
					xtype: 'fieldset',
					title: form.title || form.name,
					items: formItems
				}, fs)];
			}
			//
			
			// Suspend screen refresh during init
			// Ext.suspendLayouts();
			
			// Clear all
			this.view.removeAll(true);

			// Manage toolbars
			var docks = this.view.getDockedItems();
			// Init Default toolbar && Remove existing toolbar
			Ext.each(docks, function(d) {
				if(!this.defaultDock && (d.dock == 'bottom')) {
					this.defaultDock = d.initialConfig;
					
					// Add reset button for subform
					if(this.isSubForm) {
						this.defaultDock.items.splice(0, 0, {
							xtype: "component",
							autoEl: {
								tag: "span",
								html: "Reset",
								// No other way to do this? :-(
								onClick: "Ext.getCmp('" + this.getView().getId() + "').getController().resetData(true)",
								cls: "lookLikeLink"
							}
						});
					}
					this.defaultDock.hidden = false;
				}
				
				if( !d.isHeader) {
					this.view.removeDocked(d);
				}
			}, this);
			if(fcf.dockedItems) {
				// Add custom toolbar
				this.view.addDocked(fcf.dockedItems);
			} else {
				// Add default toolbar
				if(this.defaultDock) this.view.addDocked(this.defaultDock);
			}

			// TODO : Need compatibility or rewrite existing forms :( (for layout border and perhaps other stuff)
			// remove one level and add "all" in 'form' except dockedItems
			// delete fcf.dockedItems;
			// this.view.add(fcf);
			
			// Add form to the panel after toolbar (correct size)
			this.view.add(fcf.items);

			// Init form popup if needed (just main form can do that - main form in popup subForm have also parentForm now)
			var fcw = form.window;
			var win = this.view.up('window');
			if(win && fcw && (!this.parentForm || this.isSubForm)) {
				// Ext.apply(win, fcw);
				// win.show();

				// TODO : test win.setConfig(fcw) 
				
				// TODO : binding ou surcharge complète du config...
				// if(fcw) win.setBind(fcw);

				if(fcw.title) win.setTitle(fcw.title);
				// Adjust form popup Size on PC (tablet is full screen)
				if(Ext.os.is.desktop) {
					if(fcw.width) win.setWidth(fcw.width);
					if(fcw.height) win.setHeight(fcw.height);
				}
			}

			// Refresh screen once all done
			// Ext.resumeLayouts(true);
			
			if(form.dataUrl) {
				this.dataUrl = form.dataUrl;
			}
			
			// Init Model from view or form
			if(form.dataModel) {
				this.dataModel = form.dataModel;
			}
			
			// if(form.dataStore) {
				// this.dataStore = Ext.getStore(form.dataStore);
			// }

			this.isInit = true;
			this.operation = 'create';
			
			if(this.oController.afterShow(form) === false){
				Ck.log("afterShow cancel initForm.");
				return false;
			}
			
			//
			this.rootForm.processingForm--;
			if(this.rootForm.processingForm<0) this.rootForm.processingForm = 0;
			Ck.log("Loaded form : "+ this.name + " (stack "+ this.rootForm.processingForm+")");
			
			if(this.rootForm.processingForm==0){
				Ck.log("!!!! All Forms LOADED !!!! for : " + this.rootForm.name);
				this.updateProcessing(false, 'Form');
				this.rootForm.fireEvent('formloaded');
			}
			if(this.rootForm.processingForm==0 && this.rootForm.processingData==0){
				Ck.log("!!!! ALL LOADED !!!! for : " + this.rootForm.name);
				this.updateProcessing(false);
				this.rootForm.fireEvent('allloaded');
			}
			//
			
			// Auto-load data if params available
			if(this.autoLoad) this.loadData();
		}

		return true;
	},

	/**
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
		
		// Ck.log("Load form : "+ formUrl);
		Cks.get({
			url: formUrl,
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

	/**
	 * Get the main form controller (the 1st)
	 */ 
	getRootForm: function(stopOnSubForm) {
		var rootForm = this.getView().findParentBy(function(cmp) {
			if(stopOnSubForm === true && cmp.isSubForm === true) return true; // Main subForm is a rootForm (subRootForm)
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
		var sub = this.getView().down('ckform[name=' + val + ']');
		if(!sub) sub = this.getView().down('ckform[formName=' + val + ']');
		if(!sub) sub = this.getView().down('ckform[reference=' + val + ']');
		if(sub) {
			return sub.getController();
		} else {
			return false;
		}
	},
	
	getSubForms: function() {
		return this.subforms;
	},
	
	registerSubForm: function(sform) {
		this.subforms.push(sform);
	},
	
	unRegisterSubForm: function(sform) {
		Ext.Array.remove(this.subforms, sform);
	},
	
	/**
	 * List all included form in a form
	 */
	getIncludedForm: function(cfg) {
		if(!cfg) return;
		var includeForm = [];
		var fn = function(c) {
			if(!c) return;
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
			scope: this,
			success: function(response) {
				var me = this;
				var subFormConfig = Ext.decode(response.responseText, true);
				if(!subFormConfig) {
					Ck.Notify.error("Invalid JSON Form in : "+ formUrl);
					return false;
				}

				var fn = function(c, idx, frm) {
					if(!c) return;
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
			if(!c) return;
			if(Ext.isString(c)) return c;
						
			// Get Alls direct fields of the form with includes (exclude subform)
			if(c.name) {
				this.fields.push(c.name);
			}

			// Default component is textfield
			if(c.name && !c.xtype) c.xtype = 'textfield';

			// All items should have a Name
			var ignoreTypes = ['ckform','panel', 'button', 'label', 'image', 'fieldcontainer', 'toolbar', 'box', 'component','splitter'];
			if(!c.name && c.xtype && !Ext.Array.contains(ignoreTypes, c.xtype)) {
				Ck.log("Name undefined for xtype " + c.xtype);
			}
			
			// Compatibility forms V1
			if(c.xtype && c.xtype.substr(0,3) == 'ck_') {
				c.xtype = c.xtype.substr(3);
				this.compatibiltyMode = true;
			}
			
			// Subforms : init default params and exit
			if(c.xtype == "ckform") {
				Ext.applyIf(c, {
					//editing: this.editing,
					urlTemplate: {ws: "{0}/{1}"},
					bodyPadding: 0,
					dockedItems: []
				});
				return c;
			}
			
			Ext.applyIf(c, {
				plugins: [],
				anchor: '100%',
				msgTarget: 'side',
				labelSeparator: me.layoutConfig.labelSeparator
			});
			if(c.xtype != "fileuploadfield" && c.xtype != "filefield") {
				if(c.plugins !== false){
					c.plugins.push({
						ptype: 'formreadonly'
					});
				}
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
						me.on('afterload', function() {
							var f = me.view.form.findField(c.name);
							if(f && !f.getValue()) f.setValue(Ext.Date.clearTime(new Date()));
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
						format: "H:i"
					});

					// Init-Actualise avec la date du jour (après le chargement)
					if(c.value == 'now') {
						me.on('afterload', function() {
							var f = me.view.form.findField(c.name);
							if(f && !f.getValue()) f.setValue(Ext.Date.format(new Date(), c.format));
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
						
						// Store conf is a string - get existing store or store Url
						if(Ext.isString(store)) {
							if(store.indexOf("/") == -1) {
								// Get store in ViewModel (global store pre-loaded)
								if(me.getViewModel().get(store)) {
									return me.getViewModel().get(store);
								}
								// >> ViewModel is not ready (hierarchy) the form is not yet added to the view...

								// Get store in Application
								if(Ext.getStore(store)) {
									var st = Ext.StoreManager.get(store);
									st.setAutoLoad(true);
									return st;
								}
							} else {
								// If store is an URL then automatic store is created
								storeUrl = store;
							}
						}
						
						// Store Url - alternative config
						if(Ext.isObject(store)) {
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
						} else {
							// store can be string or undefined, init with empty object for merge
							store = {};
						}
						
						// Build default Fields (use for rowediting on grid)
						var cols = o.columns;
						if(!Ext.isArray(o.columns) && Ext.isObject(o.columns)) {
							cols = o.columns.items;
						}
						
						if(!Ext.isArray(store.fields) && Ext.isArray(cols)){
							 // Init store fields from column definition
							var fields = [];

							// Column Model
							for(var col in cols){
								if(cols[col] && cols[col].dataIndex) {
									// var colname = cols[col].text;
									var colindex = cols[col].dataIndex;

									fields.push({
										name: colindex,
										type: cols[col].type || 'auto'
										// defaultValue: colname,
										// rendererOption: cols[col].rendererOption || {},
										// convert: function(v, n) {return n[v];}
									});
								}
							}
							store.fields = fields;
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
								store = Ext.Object.merge(store, {
									autoLoad: !(c.queryMode==='remote'),
									proxy: {
										type: "ajax",
										noCache: false,
										url: me.getFullUrl(storeUrl)
									}
								});
							}
						} else {
							
							// Default in-memory Store
							store = Ext.Object.merge(store, {
								proxy: 'memory'
							});								
						}

						return store;
					}

					if(c.itemTpl) {
						c.listConfig = c.listConfig || {};
						Ext.apply(c.listConfig, {
							itemTpl: c.itemTpl
						});
						// By default use same template for list and display
						if(!c.displayTpl) c.displayTpl = c.itemTpl;
						c.displayTpl = '<tpl for=".">' + c.displayTpl + '</tpl>';
					}
					delete c.itemTpl;

					// Init stores for grid editor & plugins
					if(c.columns) {
						var co = (Ext.isArray(c.columns))? c.columns : c.columns.items;
						Ext.each(co, function(c, col, idx, cols) {
							var editor = col.editor || ((c.columns.defaults)? c.columns.defaults.editor : null);
							if(editor) {
								if(editor.store) editor.store = processStore(editor);
								// Date params
								if(editor.maxValue == 'now') cols[idx].editor.maxValue = new Date();
								if(editor.minValue == 'now') cols[idx].editor.minValue = new Date();
							}
							
							var plugins = col.plugins || ((c.columns.defaults)? c.columns.defaults.plugins : null);
							if(plugins && Ext.isArray(plugins)) {
								Ext.each(plugins, function(plugin, pidx, plugins) {
									if(plugin.store) plugin.store = processStore(plugin);
								});
							}
						}.bind(this, c));
					}

					Ext.applyIf(c, {
						displayField: "value",
						queryMode: 'local'
					});
					Ext.Object.merge(c, {
						store: processStore(c),
						listeners: {
							removed: function(item, ownerCt, eOpts) {
								item.removeBindings()
							},
							render: function(cmb){
								if(cmb.xtype == 'combobox' && Ck.params.hasOwnProperty('selenium')) {
									var addMarkup = function(cmb){
										cmb.setFieldLabel('<div style="color:green">' + cmb.getName() + '-Ready</div>' + cmb.getFieldLabel() );
									}
									if(cmb.getStore().isLoaded()){
										addMarkup(cmb);
									}else{
										cmb.getStore().on('load', function(store){
											addMarkup(cmb);
										});
									}
								}
							}
						}
					});
					break;
			}
			
			// GRID PLUGINS
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

				if(c.plugins !== false){
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
			}
			//
			
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

			
			if(!c.labelAlign) {
				c.labelAlign = 'right';
			}
			
			if(c.items && c.processItems !== false) {
				Ext.each(c.items, fn, this);
			}
		
			return c;
		}.bind(this);
		
		// Process Items
		for(var key in cfg.items) {
			var cf = fn(cfg.items[key]);
			if(cf) cfg.items[key] = cf;
		}
		// Process dockedItems
		for(var key in cfg.dockedItems) {
			var cf = fn(cfg.dockedItems[key]);
			if(cf) cfg.dockedItems[key] = cf;
		}
		return cfg;
	},

	/**
	 * @params {Array}
	 */
	applyFieldsDefaults: function(cfg, configs){
		var fn = function(c) {
			for(var ci=0; ci<configs.length; ci++) {
				var cf = configs[ci];
				if(c[cf.property] == cf.value) {
					Ext.apply(c, cf.config);
				}
			}
			// For grids and others array items
			if(c.columns) {
				var col = (Ext.isArray(c.columns))? c.columns : c.columns.items;
				Ext.each(col, fn, this);
			}
			if(c.editor){
				Ext.each(c.editor, fn, this);
			}
			if(c.plugins){
				Ext.each(c.plugins, fn, this);
			}
			//
			
			if(c.items && c.processItems !== false) {
				Ext.each(c.items, fn, this);
			}
			return c;
		}.bind(this);

		for(var key in cfg.items) {
			var cf = fn(cfg.items[key]);
			if(cf) cfg.items[key] = cf;
		}
		// Process dockedItems
		for(var key in cfg.dockedItems) {
			var cf = fn(cfg.dockedItems[key]);
			if(cf) cfg.dockedItems[key] = cf;
		}
		return cfg;
	},
	
	applyFieldDefaults: function(cfg, prop, ref, config){
		return this.applyFieldsDefaults(cfg, [{
			property: prop,
			value: ref,
			config: config
		}]);
	},

	/**
	 * Get Field by Name or Reference
	 */
	getField: function(val, bRroot) {
		var v = this.getView();
		if(bRroot) v = this.rootForm.getView();
		var field = v.down('[name=' + val + ']');
		if(!field) field = v.down('[reference=' + val + ']');
		return field;
	},
	
	startEditing: function() {
		this.getViewModel().set("editing", true);
		this.getViewModel().set("isEditable", false);
		this.getView().setEditing(true);
		// this.editing = true;
		
		this.fireEvent('startEditing');
		
		// Process subforms
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			// Only if subform not forcing editing !?
			if(!Ext.isDefined(sf.view.initialConfig.editing)){
				sf.startEditing();
			}
		}
	},

	stopEditing: function(bSilent) {
		this.getViewModel().set("editing", false);
		this.getViewModel().set("isEditable", true);
		this.getView().setEditing(false);
		// this.editing = false;

		if(bSilent!==false) this.fireEvent('stopEditing');
		
		// Process subforms
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			
			if(!Ext.isDefined(sf.view.initialConfig.editing)){
				sf.stopEditing(bSilent);
			}
		}
	},

	/**
	*	processingData, processingForm, processing
	*/
	updateProcessing: function(status, type){
		if(type){
			this.rootForm.getViewModel().set("processing"+ type, status);	
		}

		// Set global processing 'false' only if no type passed
		if(type && !status) return;
		
		this.rootForm.getView().setProcessing(status);
		this.rootForm.getViewModel().set("processing", status);
		this.rootForm.getViewModel().notify();		
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

	/**
	 * Prevent getting values from subform...
	 */
	getValues: function(resetDirty) {
		var v = this.getView();
		var form = v.getForm();

		var values = {};
		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && (f.xtype=='hidden' || f.xtype=='hiddenfield' || f.isVisible())) {
				var val = f.getValue();

				// allow formatting date before send to server
				if(f.submitFormat) {
					val = f.getSubmitValue();
				}

				// get value for radioGroup
				if(f.getGroupValue) {
					val = f.getGroupValue();
				}
				
				// TODO : add config option to trim or not
				if(Ext.isString(val)){
					val = Ext.String.trim(val);
				}
				
				values[field] = val;
			}
			if(f && resetDirty){
				f.resetOriginalValue();
			}
		}, this);

		// Juste one gridfield return a simple array
		var aValues = Ext.Object.getValues(values);
		if(aValues.length==1 && Ext.isArray(aValues[0])){
			values = aValues[0];
		}
		//
		
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

		// SUBFORM
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			var name = sf.view.name;
			// No name. subform will be save later with its own dataUrl
			if(!name) continue;
			// subform is part of another form (can't be normaly !)
			if(this.fields.indexOf(name)==-1) continue;
			// subform return one field of the same name - value already get in this.fields.forEach...
			if(sf.fields.length==1 && sf.fields[0]==name) continue;
			
			// We can manage multiple subform with the same name and merge values
			if(Ext.isObject(values[name])){
				values[name] = Ext.Object.merge(values[name], sf.getValues());
			} else {
				// getValues can be an Array (merge transform to an Object...)
				values[name] = sf.getValues();
			}
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

		// If the entire form is Hidden ignore setValues
		if(v.isVisible() === false) return;

		if(Ext.isArray(data)){
			// Find first gridfield to assign array !
			var grid = v.down('gridfield');
			if(grid) grid.setValue(data);
		} else {
			// Classic Ext setValues
			form.setValues(data);
		}
		
		// FIX Ext 
		// Combo setValues with bind filters (who depends on previous field in form).
		// setValues try to init combo before filter apply (store can be empty) - setValues fail !
		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && (f.xtype=='combobox')) {
				var filters = f.getFilters();
				if(filters.length>0) {
					f.getStore().on('filterchange', function(){
						f.setValue(data[f.name]);
					}, this);
				}
			}
			// Reset for isDirty status
			if(f) f.resetOriginalValue();
		}, this);
		//
		
		// SUBFORM : load data
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(data[sf.view.name]) sf.setValues(data[sf.view.name]);
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

		// If the entire form is Hidden ignore form validity
		if(v.isVisible() === false) return true;
		
		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && f.isVisible() && !f.isValid()) {
				isValid = false;
				Ck.log(f.name + ' not Valid !');
			}
		}, this);

		// SUBFORM
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			// Subform linked to grid (validation is done when submitting this form, not the main form)
			if(sf.isSubForm === true) continue;
			if(!sf.isValid()) isValid = false;
		}
		//
		
		return isValid;
	},

	/**
	 * Check form and subform fields change...
	 */
	isDirty: function(){
		var v = this.getView();
		var form = v.getForm();
		var isDirty = false;

		// If the entire form is Hidden ignore form validity
		if(v.isVisible() === false) return true;
		
		this.fields.forEach(function(field) {
			var f = form.findField(field);
			if(f && f.isVisible() && f.isDirty()) {
				isDirty = true;
				Ck.log(f.name + ' changed !');
			}
		}, this);

		// SUBFORM
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			// Subform linked to grid (validation is done when submitting this form, not the main form)
			if(sf.isSubForm === true) continue;
			if(sf.isDirty()) isDirty = true;
		}
		//
		
		return isDirty;
	},
	
	/**
	 * Load data for a specific feature
	 * @param {Object}
	 */
	loadData: function(options) {
		options = options || {};
		var me = this;
		if(!me.isInit) return;
		
		var v = me.getView();

		// Getters via config param in the view
		var lyr = v.getLayer();
		
		Ck.log("Load Data for : "+this.name+" (stack "+ this.rootForm.processingData +")");

		if(this.oController.beforeLoad(options) === false) {
			Ck.log("beforeLoad cancel loadData.");
			return;
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
			if(Ext.isObject(fid)) fid = fid.fid;
			if(fid){
				var oModel = Ext.create(model);
				oModel.setId(fid);
				oModel.load({
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
			}
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
			Ck.log("Forms loadData 'fid' or 'url' not set in "+this.name);

			this.loadRawData();
			// If new form with empty data we need to startEditing too...
			// if(v.getEditing()===true) this.startEditing();

			return;
		}


		// Load data from custom URL ou standard URL
		url = this.getFullUrl(url);
		Cks.get({
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			},			
			url: url,
			scope: this,
			success: function(response) {
				if(response.responseText=="") response.responseText = "{}";
				var data = Ext.decode(response.responseText, true);
				// if(response.status == 200) {
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
				// }

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
		
		if(data){
			this.operation = 'update';
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
		}
		
		// Check if all forms & subForms are loaded
		this.rootForm.processingData--;
		if(this.rootForm.processingData<0) this.rootForm.processingData = 0;
		Ck.log("Loaded Data for : " + this.name + " (stack " + this.rootForm.processingData + ")");
		
		if(this.rootForm.processingData==0){
			Ck.log("!!!! All Data LOADED !!!! for : " + this.rootForm.name);
			this.updateProcessing(false, 'Data');
				this.rootForm.fireEvent('dataloaded');
		}
		if(this.rootForm.processingForm==0 && this.rootForm.processingData==0){
			Ck.log("!!!! ALL LOADED !!!! for : " + this.rootForm.name);
			this.updateProcessing(false);
				this.rootForm.fireEvent('allloaded');
		}
		//
		
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
		if(!me.isInit) return;
		
		var v = me.getView();
		if(!v) {
			Ck.log("Form View is not valid in saveData : "+ this.name);
			return;
		}
		
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

		if(!this.editing){
			Ck.log("Form is readOnly (ignore save data) : "+ this.name);
			// Use callback to chain if needed
			Ext.callback(options.success, options.scope, []);
			return true;
		}
		
		Ck.log("Save data for : "+this.name);
		this.fireEvent('beforesave');

		// Test if form is valid (all fields of the main form)
		if(!this.isValid()) {
			Ck.log("Form is not valid for : "+ this.name);
			return false;
		}

		this.updateProcessing(true, 'Data');

		var values = this.getValues(true);
		
		if(this.oController.beforeSave(values, options, fid, url, model) === false) {
			Ck.log("beforeSave cancel saveData.");
			this.updateProcessing(false, 'Data');
			this.updateProcessing(false);
			return false;
		}

		// SUBFORM : Save All forms recursively, waiting callback return to process
		var subforms = this.getSubForms();
		if(subforms.length>0) Ck.log("Save subForms : " + Ext.Array.pluck(subforms, "name").join(", "));		
		
		Ck.asyncForEach(subforms, function(subForm, cb) {			
			// Save one sub-form...
			// Try save only if subform has non name and isSubForm = false (isSubForm == true when subform liked with grid)
			// If sub-form is visible
			if(subForm.isInit && subForm.view.isVisible() && !subForm.view.name && !subForm.view.isSubForm) {
				//save data only if subform is not linked to main form with a name property
				subForm.saveData({
					success: function(){
						// Save ok pass to the next one
						cb();
					},
					failure: function(){
						// Error stop chain.
						Ck.log("Subform " + subForm.view.formName + " saveData is FALSE.");
						return false;
					},
					create: options.create
				});
			}else{
				// No save needed but call cb to save next subform...
				cb();
			}
			
		}, function(newFormConfig) {
			// All subForms saved, save current Form.
			me.processSave({
					success: function(values){
						this.updateProcessing(false, 'Data');
						this.updateProcessing(false);
						Ext.callback(options.success, options.scope, [values]);
					},
					failure: function(response){
						this.updateProcessing(false, 'Data');
						this.updateProcessing(false);
						Ext.callback(options.failure, options.scope, [response]);
						return false;
					},
					values: values,
					fid: options.fid,
					url: options.url,
					method: options.method,
					create: options.create,
					scope: me
				});
		});
		
	},
	
	/**
	 * Called ONLY by saveData. Do not use this function directly
	 */
	processSave: function(options){
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

		var values = options.values || this.getValues(true);
		
		// If a model is set we use it
		if(fid && model) {
			var oModel = Ext.create(model);
			// Use set() to init fields modified to build create/update query
			oModel.set(values);
			
			//fid[oModel.idProperty]
			//oModel.setId(fid[oModel.idProperty]);
			
			// if phantom==false do Update otherwise do Insert
			if(this.operation == 'update') oModel.phantom = false;

			oModel.save({
				success: function(record, operation) {
					this.fireEvent('aftersave', record);
					if(this.oController.afterSave(record, options) === false) {
						Ck.log("afterSave cancel saveData.");
						return false;
					}
					
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
			Ck.log("Save no URL for : "+ this.name);
			Ext.callback(options.success, options.scope, [values]);
			return true;
		}
		
		var opt  = {
			method: options.method.toUpperCase(),
			url: this.getFullUrl(url),
			params: values,
			files: this.files,
			scope: this,
			success: function(response) {
				if(this.saveMask) this.saveMask.hide();
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200 || response.status == 201) {
					this.fireEvent('aftersave', data);
					if(this.oController.afterSave(data, options) === false) {
						Ck.log("afterSave cancel saveData.");
						return false;
					}
					
					// Allow to reload form after Save. Get back ID generated on save for example
					if(options.reload===true) this.loadData();
				}
				Ck.log("Success to save for : "+this.name);
				Ext.callback(options.success, options.scope, [data]);
			},
			failure: function(response, opts) {
				if(this.saveMask) this.saveMask.hide();
				this.fireEvent('savefailed', response);
				if(this.oController.saveFailed(response) === false) {
					return false;
				}
				Ck.log("Failed to save for : "+this.name);
				Ck.Notify.error("Forms saveData error when saving data : "+ url +".");
				Ext.callback(options.failure, options.scope, [response]);
			}
		};
		
		if(options.mask!==false){
			this.saveMask = new Ext.LoadMask({
				target: v,
				msg: "Save in progress..."
			});
			this.saveMask.show();
		}
		Ck.log("Start save for : "+this.name);
		
		if(this.files && this.files.length>0){
			// Save data from custom URL ou standard URL
			Ck.Ajax.xhr(opt);
		} else {
			Cks[options.method.toLowerCase()](opt);
		}		
	},
	
	getOption: function(key) {
		var opt = this.form.options || {};
		if(Ext.isString(key)) {
			return opt[key];
		} else {
			return opt;
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

		if(this.oController.beforeDelete(dt, options, fid, url, model) === false) {
			Ck.log("beforeDelete cancel deleteData.");
			return false;
		}

		if(fid && model) {
			var oModel = Ext.create(model, fid);
			oModel.erase({
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

	resetData: function(bSoft) {
		var v = this.getView();
		if(!v) return;
		
		if(this.oController && this.oController.beforeReset(bSoft) === false) {
			Ck.log("beforeReset cancel resetData.");
			return false;
		}
		
		// Reset main form
		Ext.suspendLayouts();
		var form = v.getForm();
		var fields = form.getFields().items,
			f,
			fLen = fields.length;
		for (f = 0; f < fLen; f++) {
			if(bSoft===true){
				// Soft reset
				if(fields[f].xtype=='hidden' || fields[f].xtype=='hiddenfield') continue;
				if(!fields[f].isVisible()) continue;
				if(fields[f].readOnly===true) continue;
				
				fields[f].originalValue = null;
				fields[f].reset();
			} else {
				// Hard reset
				// force clear field with empty data
				fields[f].originalValue = null;
				fields[f].reset();
			}
		}
		Ext.resumeLayouts(true);	
		//
		
		// SUBFORM : reset data
		var subforms = this.getSubForms();
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(sf) sf.resetData(bSoft);
		}
		//
		
		// In soft reset don't alter viewModel - juste clean allowed fields.
		if(bSoft===true) return true;
		
		if(this.getViewModel().get('updating')===true) {
			this.getViewModel().set('updating', false);
		}
		
		// Reset viewModel data (binding...)
		this.getViewModel().setData({
			layer: null,
			fid: null,
			data: null
		});
		this.getViewModel().notify();

		this.operation = '';
		
		this.fireEvent('afterreset');
		return true;
	}
});
