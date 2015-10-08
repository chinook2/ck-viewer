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

	urlTpl: {
		st: '{0}/forms/{1}.json',
		ws: '{0}/forms/{1}'
	},

	layoutConfig: {
		labelSeparator: ' : '
	},

	init: function () {
		this.isSubForm = this.getView().getIsSubForm();
		this.isInit = false;

		this.ls = new Ext.util.LocalStorage({
			id: 'Ck-' + Ext.manifest.name + '-Form'
		});

		this.initForm();
	},

	formLoad: function (options) {
		this.loadData(options);
	},

	formEdit: function(){
		this.startEditing();
	},

	formSave: function () {
		this.saveData();
		this.formClose();
	},

	formCancel: function(){
		this.stopEditing();
	},

	formPrint: function () {
		Ext.alert("WIP.");
	},

	formClose: function () {
		this.stopEditing();

		var win = this.view.up('window');
		if (win) {
			win.close();
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

			// Ajoute la définition du formulaire au panel
			var fcf = this.applyFormDefaults(form.form);

			this.view.add(fcf.items);

			/**/
			if (this.isSubForm) {
				// Sous-formulaire les contrôles sont différents
				var bbar = this.getView().getDockedItems('toolbar[dock="bottom"]');
				if (bbar[0]) bbar[0].hide();
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
		var form = this.ls.getItem(formUrl);
		if(form && Ck.getEnvironment() == 'production'){
			this.initForm( Ext.decode(form) );
			return;
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
					me.ls.setItem(formUrl, Ext.encode(cfg));

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
		var fn = function (c) {
			// Default textfield si propriété name et pas de xtype
			if (c.name && !c.xtype) c.xtype = 'textfield';

			Ext.applyIf(c, {
				plugins: ['formreadonly'],
				anchor: '100%',
				labelSeparator: this.layoutConfig.labelSeparator
			});

			if (c.xtype == "tabpanel") {
				Ext.applyIf(c, {
					activeTab: 0,
					bodyPadding: 10,
					deferredRender: false,
					border: false,
					defaults: {
						anchor: '100%',
						labelSeparator: this.layoutConfig.labelSeparator
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

			if (c.xtype == "combo") {
				// storeUrl : alias to define proxy type ajax with url.
				var store = c.store;
				var storeUrl = c.storeUrl;
				if(Ext.isString(c.store) && !Ext.StoreManager.get(c.store)){
					// Should be a short alias to define storeUrl
					storeUrl = c.store;
				}
				if(c.store && c.store.url) {
					storeUrl = c.store.url;
					delete c.store.url;
				}

				if(storeUrl){
					store = {
						autoLoad: true,
						proxy: {
							type: 'ajax',
							noCache: false,
							url: storeUrl
						}
					}
				}

				if(c.itemTpl) {
					c.listConfig = {
						itemTpl: c.itemTpl
					}
				}
				delete c.itemTpl;

				Ext.Object.merge(c, {
					queryMode: 'local',
					store: store
				});

			}

			if (c.xtype == "grid" || c.xtype == "gridpanel") {
				Ext.applyIf(c, {
					plugins: ['gridsubform']
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
					this.view.on('afterload', function () {
						var f = this.view.form.findField(c.name);
						if (f) f.setValue(Ext.Date.clearTime(new Date()));
					}, this);
				}
			}
			if (c.xtype == "timefield") {
				Ext.applyIf(c, {
					format: "H:i"
				});

				// Init-Actualise avec la date du jour (après le chargement)
				if (c.value == 'now') {
					this.view.on('afterload', function () {
						var f = this.view.form.findField(c.name);
						if (f) f.setValue(Ext.Date.format(new Date(), c.format));
					}, this);
				}
			}

			if (c.layout == 'column') {
				// TODO : simplifié l'ajout auto de xtype container mais pas tjrs...
				Ext.applyIf(c, {
					defaults: {
						layout: 'form',
						labelSeparator: this.layoutConfig.labelSeparator,
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

		//
		if(!options) {
			options = {};
			bSilent = true;
		}
		var fid = options.fid || v.getFid();
		var url = options.url || v.getDataUrl();
		var data = options.data || v.getData();

		// Init le form 'vide'
		me.resetData();

		if (data) {
			// Load inline data
			v.getForm().setValues(data);
			return;
		}

		if (fid) {
			// Load data by ID - build standard url
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
			return;
		}

		// Load data from custom URL ou standard URL
		Cks.get({
			url: url,
			scope: this,
			success: function (response) {
				var data = Ext.decode(response.responseText, true);
				if(!data) {
					Ck.Notify.error("Invalid JSON Data in : "+ url);
					return false;
				}

				v.getForm().setValues(data);
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
	},

	resetData: function () {
		var v = this.getView();

		// Init le form 'vide'
		v.reset();

		// Ajoute les données au viewModel (binding...)
		this.getViewModel().setData({
			layer: null,
			fid: null,
			record: null
		});

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

		return true;
	}
});
