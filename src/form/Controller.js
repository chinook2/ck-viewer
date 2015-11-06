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

	layoutConfig: {
		labelSeparator: ' : '
	},


	// Override by named controller of the form Ck.form.controller.{name}
	beforeShow: Ext.emptyFn,
	beforeLoad: Ext.emptyFn,
	afterLoad: Ext.emptyFn,
	beforeSave: Ext.emptyFn,
	afterSave: Ext.emptyFn,
	beforeClose: Ext.emptyFn,


	init: function () {
		this.isSubForm = this.getView().getIsSubForm();
		this.isInit = false;

		var isStorage = 'Ck-' + Ext.manifest.name + '-Form';
		this.ls = Ext.util.LocalStorage.get(isStorage);
		if(!this.ls) {
			this.ls = new Ext.util.LocalStorage({
				id: isStorage
			});
		}

		this.initForm();
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
		this.saveData();

		// Link to another form
		if(btn.nextFormName){
			this.view.setFormName(btn.nextFormName);
			this.isInit = false;
			this.initForm();
			return;
		}
		if(btn.nextFormUrl){
			this.view.setFormUrl(btn.nextFormUrl);
			this.isInit = false;
			this.initForm();
			return;
		}

		// Close the form
		if(btn.andClose) {
			this.formClose({
				force: true
			});
		}
	},

	formCancel: function(){
		this.stopEditing();
	},

	formPrint: function () {
		Ext.alert("WIP.");
	},

	formClose: function (btn) {
		if(this.oController.beforeClose() === false){
			Ck.log("beforeClose cancel formClose.");
			return;
		}

		var closeMe = function(){
			if(this.view.beforeClose() === false){
				Ck.log("beforeClose cancel close form.");
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

		if(btn.force === true){
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

			// Create un dedicated controller form the named form
			Ext.define('Ck.form.controller.' + form.name, {
				extend: 'Ck.form.Controller',
				alias: 'controller.ckform_'+ form.name
			});

			// Define new controller to be overriden by application
			// Use this.oController to access overriden methods !
			this.oController = Ext.create('Ck.form.controller.' + form.name);
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
			if(!this.defaultDock) {
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
				this.view.addDocked(this.defaultDock);
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
		var fn = function (c) {
			// Default textfield si propriété name et pas de xtype
			if (c.name && !c.xtype) c.xtype = 'textfield';

			Ext.applyIf(c, {
				plugins: ['formreadonly'],
				anchor: '100%',
				labelSeparator: me.layoutConfig.labelSeparator
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

			if (c.xtype == "combo" || c.xtype == "combobox" || c.xtype == "grid" || c.xtype == "gridpanel") {
				// Internal function to initialse store definition
				var processStore = function(o){
					// storeUrl : alias to define proxy type ajax with url.
					var store = o.store;
					var storeUrl = o.storeUrl;
					if(Ext.isString(o.store) && !Ext.StoreManager.get(o.store)){
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
						store = {
							autoLoad: true,
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
							"proxy": "memory"
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

				Ext.Object.merge(c, {
					queryMode: 'local',
					store: processStore(c),
					listeners: {
						removed: function(item, ownerCt, eOpts){
							item.removeBindings()
						}
					}
				});
				
			}

			if (c.xtype == "grid" || c.xtype == "gridpanel") {
				Ext.apply(c, {
					plugins: ['gridsubform', 'gridstore', 'gridediting', 'rowediting']
				});
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

	// Lecture des données depuis le Storage
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

		// Init le form 'vide'
		me.resetData();

		// Load inline data
		if (data) {
			if(this.oController.afterLoad(data) === false){
				Ck.log("afterLoad cancel loadData.");
				return;
			}

			v.getForm().setValues(data);
			this.getViewModel().setData({
				layer: lyr,
				data: data
			});			
			this.fireEvent('afterload', data);

			if(v.getEditing()===true) this.startEditing();
			return;
		}

		// Load data by ID - build standard url
		if (fid) {
			// TODO : Call un service REST for loading data...
			if(me.dataUrl){
				// Form provide un template URL to load data
				var tpl = new Ext.Template(me.dataUrl);
				url = tpl.apply([fid]);
			} else {
				// Build default url
				url = 'resources/data/' + lyr + '/' + fid + '.json';
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
				var data = Ext.decode(response.responseText, true);
				if(!data) {
					Ck.Notify.error("Invalid JSON Data in : "+ url);
					return false;
				}

				if(this.oController.afterLoad(data) === false){
					Ck.log("afterLoad cancel loadData.");
					return;
				}

				v.getForm().setValues(data);
				this.getViewModel().setData({
					layer: lyr,
					fid: fid,
					data: data
				});
				
				this.fireEvent('afterload', data);

				if(v.getEditing()===true) this.startEditing();
			},
			failure: function (response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				Ck.Notify.error("Forms loadData error when loading data from : "+ url +".");
			}
		});

		/*
		 // TODO : gestion du retour si erreur...
		 if(!fid) {
		 v.setSid(null);
		 // Assure l'init des champs auto (date / heure)
		 v.fireEvent('afterload', false, false);
		 return false;
		 }

		 // Call Storage to load data
		 var res = me.storage.load({
		 layer: lyr,
		 fid: fid+"",
		 success: function(res) {
		 // Garde le Storage ID en cours
		 v.setSid(res.id);

		 // Ajoute les données au viewModel (binding...)
		 me.getViewModel().setData({
		 layer: lyr,
		 fid: fid,
		 record: res
		 });

		 // Model (init in Storage Class) > Record > load...
		 var md =  'Storage.'+lyr;
		 var model = Ext.create(md, res);
		 v.loadRecord(model);

		 // GRID : load data
		 var grids = v.query('gridpanel');
		 for(var g=0; g<grids.length; g++){
		 var grid = grids[g];
		 var n = grid.name; // nom de la table = nom de la relation = clé dans la table des résultats
		 grid.getStore().loadData(res[n]);
		 }
		 //

		 v.fireEvent('afterload', res, model);
		 },
		 failure: function() {
		 // TODO
		 }
		 });
		 */
	},

	// Enregistre les données dans le Storage
	saveData: function () {
		var me = this;
		var v = me.getView();

		var sid = v.getSid();
		var lyr = v.getLayer();


		// TODO : pose pb avec les subforms...
		// if (!v.isValid()) {
		// return;
		// }

		// [asString], [dirtyOnly], [includeEmptyText], [useDataValues]
		var dt = v.getValues(false, false, false, true); // Retourne les dates sous forme de string d'objet (date complète)
		// var dt = v.getValues(false, false, false, false); // Retourne les dates sous forme de string (d/m/Y)

		// GRID : save data
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];
			var dtg = [];
			var dtgd = [];

			// Récup les enregistrements nouveaux et modifiés
			grid.getStore().each(function (model) {
				dtg.push(model.data);
			});
			dt[grid.name] = dtg;

			// Récup les enregistrements supprimés
			Ext.each(grid.getStore().getRemovedRecords(), function (model) {
				dtgd.push(model.data);
			});
			dt[grid.name + '_del'] = dtgd;
		}
		//

		// Mis à jour du status
		if (!sid) {
			dt.status = "CREATED";
		} else {
			dt.status = "MODIFIED";
		}
		//

		if(this.oController.beforeSave(dt) === false){
			Ck.log("beforeSave cancel saveData.");
			return;
		}

		/*
		 // Call Storage to save data
		 var res = me.storage.save({
		 layer: lyr,
		 sid: sid,
		 data: dt,
		 success: function(res) {
		 // TODO : Message que tout est OK
		 v.fireEvent('aftersave', res);

		 // Ferme le form
		 me.formClose();
		 }
		 });
		 */

		if(this.oController.afterSave(dt) === false){
			Ck.log("afterSave cancel saveData.");
			return;
		}
	},

	resetData: function () {
		var v = this.getView();

		// Init le form 'vide'
		v.reset();

		// Reset les données du viewModel (binding...)
		this.getViewModel().setData({
			layer: null,
			fid: null,
			record: null
		});

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
