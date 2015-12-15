/**
 * The Form controller allow to load form to display it. It can manage sub-form...
 *
 * Also perform load and save data for the form.
 */
Ext.define('Ck.form.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckform',

	isSubForm: false,
	storage: null,

	dataUrl: null,
	dataModel: null,
	// dataStore: null,
	
	layoutConfig: {
		labelSeparator: ' : '
	},

	fields: [],
	
	//startEditing
	//stopEditing
	
	//afterload
	//loadfailed
	
	//beforesave
	//aftersave
	//savefailed
	
	//afterreset
	
	// Override by named controller of the form Ck.form.controller.{name}
	beforeShow: Ext.emptyFn,
	beforeLoad: Ext.emptyFn,
	afterLoad: Ext.emptyFn,
	beforeSave: Ext.emptyFn,
	afterSave: Ext.emptyFn,
	beforeClose: Ext.emptyFn,
	
	loadFailed: Ext.emptyFn,
	saveFailed: Ext.emptyFn,
	//
	
	init: function () {
		this.isSubForm = this.view.getIsSubForm();
		if(this.view.getEditing()===true) this.startEditing();
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
		if(inlineForm){
			var parentForm = this.view.up('ckform');
			if(parentForm) {
				// inherit dataFid from main view form (used in store url template)
				this.view.setDataFid(parentForm.getDataFid());
				
				// Try find parent form name (used for overriden controllers)
				if(!inlineForm.name){
					inlineForm.name = parentForm.getController().name;
				}
			}
		}
		
		this.initForm(inlineForm);
	},

	destroy: function() {
		if(this.ls) this.ls.release();
		this.callParent();
	},

	formLoad: function (options) {
		this.loadData(options);
	},

	formEdit: function(){
		this.startEditing();
	},

	formSave: function (btn) {
		var res = this.saveData(function(){
			//After save success.
			
			// Link to another form
			if(btn && btn.nextFormName){
				this.view.setFormName(btn.nextFormName);
				this.isInit = false;
				this.initForm();
				return;
			}
			if(btn && btn.nextFormUrl){
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

	formCancel: function(){
		this.stopEditing();
	},

	formPrint: function () {
		Ext.alert("WIP.");
	},

	formClose: function (btn) {

		var closeMe = function(){
			if(this.oController.beforeClose() === false){
				Ck.log("beforeClose cancel formClose.");
				return;
			}
			if(this.view.beforeClose() === false){
				Ck.log("view beforeClose cancel formClose.");
				return;
			}

			this.stopEditing();

			var win = this.view.up('window');
			if (win) {
				win.destroy();
			} else {
				this.view.destroy();
			}
		}.bind(this);

		if(btn && btn.force === true){
			closeMe();
		} else {
			Ext.Msg.show({
				title:'Close ?',
				message: 'You are closing a form that has unsaved changes. Would you like to save your changes ?',
				buttons: Ext.Msg.YESNOCANCEL,
				icon: Ext.Msg.QUESTION,
				fn: function(btn) {
					if (btn === 'yes') {
						this.saveData();
						closeMe();
					} else if (btn === 'no') {
						closeMe()
					} else {
						// Nothing don't close
					}
				},
				scope: this
			});

		}

	},


	getOption: function (opt) {
		var formOpt = Ck.getOption('form');
		if(formOpt && formOpt[opt]) {
			return formOpt[opt];
		}
		return Ck.getOption(opt);
	},

	/**
	 * PRIVATE
	 */
	initForm: function (form) {
		if (!this.isInit) {
			if (!form) {
				var formUrl = this.view.getFormUrl();
				var formName = this.view.getFormName();
				if (!formUrl && formName) formUrl = this.getFullUrl(formName);

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
			if(!Ext.ClassManager.get(controllerName)){
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

			if(this.oController.beforeShow(form) === false){
				Ck.log("beforeShow cancel initForm.");
				return;
			}

			// Ajoute la définition du formulaire au panel
			var fcf = this.applyFormDefaults(form.form);
			
			this.view.removeAll(true);
			this.view.add(fcf.items);

			// Manage bottom toolbar
			var docks = this.view.getDockedItems();
			var dock  = docks[0];
			if(!this.defaultDock && dock) {
				this.defaultDock = dock.initialConfig;
				this.defaultDock.hidden = false;
			}
			// Remove existing toolbar
			Ext.each(docks, function(d){
				this.view.removeDocked(d);
			}, this);
			

			if(fcf.dockedItems) {
				// Add custom toolbar
				this.view.addDocked(fcf.dockedItems);
			} else {
				// Add default toolbar
				if(this.defaultDock) this.view.addDocked(this.defaultDock);
			}


			/**/
			if (this.isSubForm) {
				// Sous-formulaire les contrôles sont différents
				// var bbar = this.getView().getDockedItems('toolbar[dock="bottom"]');
				// if (bbar[0]) bbar[0].hide();
			} else {
				// Init la popup qui contient le formulaire
				var fcw = form.window;
				var win = this.view.up('window');
				if (win) {
					// Ext.apply(win, fcw);
					// win.show();

					// TODO : binding ou surcharge complète du config...
					// if(fcw) win.setBind(fcw);

					if (fcw.title) win.setTitle(fcw.title);
					if (fcw.width) win.setWidth(fcw.width);
					if (fcw.height) win.setHeight(fcw.height);
				}
			}

			if(form.dataUrl){
				this.dataUrl = form.dataUrl;
			}
			if(form.dataModel){
				this.dataModel = Ext.create(form.dataModel, {});
			}
			// if(form.dataStore){
				// this.dataStore = Ext.getStore(form.dataStore);
			// }

			this.isInit = true;
			
			// Auto-load data if params available
			this.loadData();
		}

		return true;
	},

	/*
	 * Get Form definition
	 * @param
	 */
	getForm: function (formUrl) {
		if (!formUrl) {
			Ck.Notify.error("'formUrl' or 'formName' not set in getForm.");
			return false;
		}

		// Load Form from LocalStorage (cache form with includes - ajax cache can't save all in one)
		if(this.ls){
			var form = this.ls.getItem(formUrl);
			if(form && Ck.getEnvironment() == 'production'){
				this.initForm( Ext.decode(form) );
				return;
			}
		}

		Cks.get({
			url: formUrl,
			disableCaching: false,
			scope: this,
			success: function (response) {
				var me = this;
				var formConfig = Ext.decode(response.responseText, true);
				if(!formConfig){
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

	// List all included form in a form.
	getIncludedForm: function (cfg) {
		if(!cfg) return;
		var includeForm = [];
		var fn = function (c) {
			if(c['@include']) {
				includeForm.push(c['@include']);
			}
			if (c.items) {
				Ext.each(c.items, fn, this);
			}
		};

		Ext.each(cfg.items, fn, this);
		return includeForm;
	},

	includeForm: function(formConfig, formName, callback) {
		var formUrl = this.getFullUrl(formName);
		if (!formUrl) {
			Ck.Notify.error("'formUrl' or 'formName' not set in includeForm.");
			return false;
		}
		Cks.get({
			url: formUrl,
			disableCaching: false,
			scope: this,
			success: function (response) {
				var me = this;
				var subFormConfig = Ext.decode(response.responseText, true);
				if(!subFormConfig){
					Ck.Notify.error("Invalid JSON Form in : "+ formUrl);
					return false;
				}

				var fn = function (c, idx, frm) {
					if (c.items) {
						Ext.each(c.items, fn, this);
					}
					if(c['@include'] == formName) {
						delete frm[idx]['@include'];
						Ext.apply(frm[idx], subFormConfig.form);
					}
				};
				Ext.each(formConfig.form.items, fn, this);

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

	// auto config pour le form (simplification du json)
	applyFormDefaults: function (cfg) {		
		var me = this;
		this.fields = [];
		
		var fn = function (c) {
			// Get Alls direct fields of the form with includes (exclude subform)
			if(c.name) {
				this.fields.push(c.name);
			}
			
			// Subforms : init default params and exit
			if(c.xtype=='ckform') {
				Ext.applyIf(c, {
					isSubForm: true,
					editing:true,
					urlTemplate: {ws: "{0}/{1}"},
					bodyPadding: 0,
					dockedItems: []
				});				
				return;
			}
			
			// Default textfield si propriété name et pas de xtype
			if (c.name && !c.xtype) c.xtype = 'textfield';

			
			Ext.applyIf(c, {
				plugins: [],
				anchor: '100%',
				labelSeparator: me.layoutConfig.labelSeparator
			});
			c.plugins.push({
				ptype: 'formreadonly'
			});
			
			if (c.xtype == "tabpanel") {
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
			}

			// Pour éviter un effet de bord avec le default xtype textfield
			if (c.xtype == "radiogroup") {
				Ext.each(c.items, function (c) {
					c.xtype = 'radiofield';
				});
			}
			if (c.xtype == "checkboxgroup") {
				Ext.each(c.items, function (c) {
					c.xtype = 'checkboxfield';
				});
			}
			//

			if (c.xtype == "combo" || c.xtype == "combobox" || c.xtype == "grid" || c.xtype == "gridpanel" || c.xtype == "gridfield") {
				// Internal function to initialse store definition
				var processStore = function(o){
					// storeUrl : alias to define proxy type ajax with url.
					var store = o.store;
					var storeUrl = o.storeUrl;
					
					if(Ext.isString(o.store) ){
						if(o.store.indexOf("/") == -1) {
							// Get store in ViewModel (global store pre-loaded)
							// if(me.getViewModel().get(o.store)){
								// return me.getViewModel().get(o.store);
							// }
							// >> ViewModel is not ready (hierarchy) the form is not yet added to the view...
							
							// Get store in Application
							if(Ext.getStore(o.store)){
								return Ext.StoreManager.get(o.store);
							}
						}
						
						// Should be a short alias to define storeUrl
						storeUrl = o.store;
					}
					if(o.store && o.store.url) {
						// Another alias to define storeUrl
						storeUrl = o.store.url;
						delete o.store.url;
					}
					
					// Construct store with storeUrl
					if(storeUrl){
						// Apply template if available like dataUrl...
						var v = me.getView();
						var fid = v.getDataFid();
						if(fid){
							var tpl = new Ext.Template(storeUrl);
							if(Ext.isString(fid)) fid = [fid];
							storeUrl = tpl.apply(fid);
						}
						
						store = {
							// If queryMode = 'remote' > autoLoad = false...
							autoLoad: !(c.queryMode==='remote'),
							proxy: {
								type: 'ajax',
								noCache: false,
								url: me.getFullUrl(storeUrl)
							}
						}
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
				}
				delete c.itemTpl;

				// Init stores for grid editor
				if(Ext.isArray(c.columns)){
					Ext.each(c.columns, function(col, idx, cols){
						if(col.editor && col.editor.store) {
							cols[idx].editor.store = processStore(col.editor)
						}
					});

				}

				Ext.applyIf(c, {
					queryMode: 'local'
				});			
				Ext.Object.merge(c, {
					store: processStore(c),
					listeners: {
						removed: function(item, ownerCt, eOpts){
							item.removeBindings()
						}
					}
				});
			}

			if (c.xtype == "grid" || c.xtype == "gridpanel" || c.xtype == "gridfield") {
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
				
				if(c.subform){
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
/*
			if (c.xtype == "fieldset") {
				Ext.applyIf(c, {
					//layout: 'form',
					//defaultType: 'textfield',

				});
			}
*/
			if (c.xtype == "datefield") {
				Ext.applyIf(c, {
					format: "d/m/Y"
				});

				// Init-Actualise avec la date du jour (après le chargement)
				if (c.value == 'now') {
					me.view.on('afterload', function () {
						var f = me.view.form.findField(c.name);
						if (f) f.setValue(Ext.Date.clearTime(new Date()));
					});
				}
			}
			if (c.xtype == "timefield") {
				Ext.applyIf(c, {
					format: "H:i"
				});

				// Init-Actualise avec la date du jour (après le chargement)
				if (c.value == 'now') {
					me.view.on('afterload', function () {
						var f = me.view.form.findField(c.name);
						if (f) f.setValue(Ext.Date.format(new Date(), c.format));
					});
				}
			}

			if (c.layout == 'column') {
				// TODO : simplifié l'ajout auto de xtype container mais pas tjrs...
				Ext.applyIf(c, {
					defaults: {
						layout: 'form',
						labelSeparator: me.layoutConfig.labelSeparator,
						border: false
					}
				});
			}

			if (c.name && !c.fieldLabel && !c.boxLabel) {
				c.fieldLabel = c.name;
			}

			if (c.items) {
				Ext.each(c.items, fn, this);
			}
		};

		Ext.each(cfg.items, fn, this);
		return cfg;
	},

	startEditing: function(){
		this.getViewModel().set("editing", true);
		this.getViewModel().set("isEditable", false);

		this.fireEvent('startEditing');
	},

	stopEditing: function () {
		this.getViewModel().set("editing", false);
		this.getViewModel().set("isEditable", true);

		this.fireEvent('stopEditing');
	},

	// Prevent getting values from subform...
	getValues: function() {
		var v = this.getView();
		var form = v.getForm();
		
		var values = {};
		this.fields.forEach(function(field){
			var f = form.findField(field);
			if(f){
				values[field] = f.getValue();
				
				// allow formatting date before send to server
				if(f.submitFormat){
					values[field] = f.getSubmitValue();
				}

				// get value for radioGroup
				if(f.getGroupValue){
					values[field] = f.getGroupValue();
				}
				
				// TODO : add config option to get display values
				// if(f.displayField) {
					// if(!values['__display']) values['__display'] = {}
					// values['__display'][field] = f.getDisplayValue();
				// }
			}
		}, this);

		// SUBFORM : save data
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			if(!sf.name) continue;
			if(this.fields.indexOf(sf.name)==-1) continue;
			
			values[sf.name] = sf.getController().getValues();
		}
		//
		
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
		
		this.fields.forEach(function(field){
			var f = form.findField(field);
			if(f && !f.isValid()) isValid = false;
		}, this);
		
		
		// TODO : manage grid as field with a plugin... AND perform save in the plugin.
		// GRID : save data only if gridpanel is not linked to main form with a name property
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			if(grid.name) continue;
			var requiredColumn;
			
			// Test all columns for required fields
			grid.getStore().each(function (rec) {
				if(rec.data.dummy===true) return;
				grid.getColumns().forEach(function(col) {
					if(!col.dataIndex) return;
					var val = rec.data[col.dataIndex];
					
					if((!val) && (col.allowBlank===false)){
						isValid = false;
						requiredColumn = col;
						return false;
					}
				});
				if(!isValid) return false;
			});
			
			if(!isValid){
				Ext.Msg.alert("Required fields", " This field is required : "+ requiredColumn.text);
			}
			
			// TEMP : assume only one grid !
			break;
		}
		//
		//
		
		return isValid;
	},
	
	// Load data from
	//  - fid
	//  - dataUrl
	//  - dataRaw
	// ...
	loadData: function (options) {
		var me = this;
		var v = me.getView();

		// Getters via config param in the view
		var lyr = v.getLayer();
		var bSilent = false;

		if(this.oController.beforeLoad(options) === false){
			Ck.log("beforeLoad cancel loadData.");
			return;
		}

		//
		if(!options) {
			options = {};
			bSilent = true;
		}
		var fid = options.fid || v.getDataFid();
		var url = options.url || v.getDataUrl();
		var data = options.raw || v.getDataRaw();
		var model = options.model || me.dataModel || v.getDataModel();
		// var store = options.store || v.getDataStore();

		// Init le form 'vide'
		me.resetData();
		
		// Load inline data
		if (data) {
			if(this.oController.afterLoad(data) === false){
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
			return;
		}

		// Load data from model (offline websql Database - model is linked to a websql proxy)
		if (fid && model) {
			model.setId(fid);
			model.load({
				success: function(record, operation) {
					var data = record.getData();
					
					//do something if the load succeeded
					if(this.oController.afterLoad(data) === false){
						Ck.log("afterLoad cancel loadData.");
						return;
					}

					this.getViewModel().setData({
						data: data
					});
					this.getViewModel().notify();
					this.setValues(data);
					
					this.fireEvent('afterload', data);

					if(v.getEditing()===true) this.startEditing();
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
		if (fid) {
			// TODO : Call un service REST for loading data...
			if(me.dataUrl){
				// Form provide un template URL (or multiples URL) to load data
				var dataUrl = me.dataUrl;
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


		if(!url){
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
			success: function (response) {
				if(response.responseText=="") response.responseText = "{}";
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200) {
					if(!data) {
						Ck.Notify.error("Invalid JSON Data in : "+ url);
						return false;
					}

					if(this.oController.afterLoad(data) === false){
						Ck.log("afterLoad cancel loadData.");
						return;
					}

					this.getViewModel().set({
						layer: lyr,
						fid: fid,
						data: Ext.apply(this.getViewModel().get('data') || {}, data)
					});
					this.getViewModel().notify();
					this.setValues(data);
					
					this.fireEvent('afterload', data);
				}
				
				if(v.getEditing()===true) this.startEditing();
			},
			failure: function (response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms loadData error when loading data from : "+ url +".");
				
				this.fireEvent('loadfailed', response);
				this.oController.loadFailed(response);
			}
		});
	},

	// Enregistre les données dans le Storage
	saveData: function (options) {
		options = options || {};
		
		var me = this;
		var v = me.getView();

		var sid = v.getSid();
		var lyr = v.getLayer();
		
		var fid = v.getDataFid();
		var url = v.getDataUrl();
		var model = me.dataModel || v.getDataModel();

		// Compatibility : pass only success callbak
		if(Ext.isFunction(options)) {
			options.success = options;
			options.scope = this;
		}
		options = Ext.applyIf(options, {
			method: 'PUT'
		});
		if(options.create) options.method = 'POST';
		//

		// Test if form is valid (all fields of the main form)
		if (!this.isValid()) {
			Ck.log("Form is not valid in saveData : "+ this.name);
			return false;
		}
		
		this.fireEvent('beforesave');
		
		// We need to stopEditing too, plugins can process data before saving...
		//this.stopEditing();

		var dt = this.getValues();	

		if(this.oController.beforeSave(dt) === false){
			Ck.log("beforeSave cancel saveData.");
			return false;
		}
		
		
		// SUBFORM : save data only if subform is not linked to main form with a name property
		var subforms = v.query('ckform');
		for (var s = 0; s < subforms.length; s++) {
			var sf = subforms[s];
			
			// TODO : manage save callback...
			//if(!sf.name) sf.getController().saveData();
		}
		//

		var url = '';
		

		// TODO : manage grid as field with a plugin... AND perform save in the plugin.
		// GRID : save data only if gridpanel is not linked to main form with a name property
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			if(grid.name) continue;
			
			var dtg = [];

			// Get all records with special formatting for date...
			grid.getStore().each(function (rec) {
				if(rec.data.dummy===true) return;
				var row = {};
				grid.getColumns().forEach(function(col) {
					if(!col.dataIndex) return;
					var val = rec.data[col.dataIndex];
					if(col.xtype == 'datecolumn' && col.submitFormat){
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
			dt = dtg;
			
			// TEMP : assume only one grid !
			break;
		}
		//
		//
		
		if(fid && model){
			model.set(dt);
			model.save({
				success: function (record, operation) {
					Ext.callback(options.success, options.scope, [dt]);
				},
				failure: function (record, operation) {
					// TODO : on Tablet when access local file via ajax, success pass here !!
					Ck.Notify.error("Forms saveData error when saving data : "+ url +".");
					
					this.fireEvent('savefailed', record);
					this.oController.saveFailed(record);
				},
				scope: this
			});
			return;
		}
		
		// Load data by ID - build standard url
		if (fid) {
			// TODO : Call un service REST for loading data...
			if(me.dataUrl){
				// Form provide un template URL to load data
				var dataUrl = me.dataUrl;
				if(Ext.isObject(dataUrl)) {
					dataUrl = dataUrl.update;
				}
				var tpl = new Ext.Template(dataUrl);
				if(Ext.isString(fid)) fid = [fid];
				url = tpl.apply(fid);
			} else {
				Ck.log("fid ("+ fid +") defined but no dataUrl template in "+ this.name);
			}
		}

		if(!url){
			Ck.log("Forms saveData 'fid' or 'url' not set in "+ this.name);
			Ext.callback(options.success, options.scope, [dt]);
			return false;
		}

		// Load data from custom URL ou standard URL
		url = this.getFullUrl(url);
		Cks[options.method.toLowerCase()]({
			url: url,
			params: dt,
			scope: this,
			success: function (response) {
				var data = Ext.decode(response.responseText, true);
				if(response.status == 200) {
					this.fireEvent('aftersave', data);
					if(this.oController.afterSave(dt) === false){
						Ck.log("afterSave cancel saveData.");
						return false;
					}
					/*
					var vm = this.getViewModel();
					if(vm){
						vm.set({
							layer: lyr,
							fid: fid,
							data: Ext.apply(vm.get('data'), dt)
						});
					}
					*/
				}
				Ext.callback(options.success, options.scope, [dt]);
			},
			failure: function (response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms saveData error when saving data : "+ url +".");
				
				this.fireEvent('savefailed', response);
				this.oController.saveFailed(response);
			}
		});
	},

	resetData: function () {
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
			if (form) {
				form.reset();
				delete form.rowIndex;
			}
		}
		*/

		return true;
	}
});
