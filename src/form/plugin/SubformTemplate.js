/**
 * @private
 */
Ext.define('Ck.form.plugin.SubformTemplate', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridsubformtemplate',

	/**
	 * Save the entire grid when add/edit/delete row. Used when subform have no dataUrl.
	 */
	autocommit: true,
	
	/**
	 * Save when update row with rowediting plugin
	 */
	commitrow: true,
	
	editrow: true,

	deleterow: true,
	disableDeleteRow: null,

	addItemLast: true,

	_subformWindow: null,
	_subform: null,
	_grid: null,

	subformConfig: null,
	
	init: function(grid) {
		if(!grid.subform) return;

		// Accept param as String or Object
		if(Ext.isString(grid.subform)){
			grid.subform = {
				url : grid.subform
			};
		}

		if(this.autocommit === true) this.commitrow = true;
		
		// Init subform after grid rendering
		grid.on('afterrender', function() {
			this.initSubForm(grid);
		}, this, {delay: 50});
	},

	/**
	 * @private
	 * Component calls destroy on all its plugins at destroy time.
	 */
	destroy: function() {
	},


	initSubForm: function(grid) {
		this._grid = grid;
		var formController = this._grid.lookupController();
		this.subformConfig = grid.subform;

		// Add toolbar for adding new item in grid (open window...)
		/*grid.addDocked({
			xtype: 'toolbar',
			dock: 'top',
			bind: {
				hidden: '{!editing}'
			},
			style: {border: 0},
			items: ['->', {
				text: 'Ajouter',
				cls: 'x-btn-text-icon',
				iconCls: 'ck-table-row-add',
				handler : function(){ 
					var store = grid.getStore();                
					var r = Ext.create(store.getModel(), {});
					
					this.stopEditing();
					store.add(r);
					// store.insert(0, r);
					this.startEditing(store.getCount()-1, 1);
				},
				scope: this
			}]
		});*/
		
 		// Get the Action Column
		var conf = grid.getInitialConfig();
		this.actionColumn = grid.down('[reference=actionColumn1]');
		if(!this.actionColumn) {
			var actions = [];
			if(this.deleterow!==false){
				actions.push({
					isDisabled: function(v, r, c, i, rec) {
						if(!rec) return true;
						if(rec.get('dummy')) return true;
						if(this.disableDeleteRow) {
							if(rec.get(this.disableDeleteRow.property) === this.disableDeleteRow.value) return true
						}
						return false;
					},
					getClass: function(v, meta, rec) {
						if(rec && rec.get('dummy')) return false;
						return 'fa fa-close';
					},
					tooltip: 'Delete row',
					handler: function(view, rowIndex, colIndex, item, e, rec, row) {
						// e.stopPropagation();
						this.deleteItem(view, rowIndex);
					},
					scope: this
				});
			}

			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				reference: 'actionColumn1',
				menuDisabled: true,
				width: 25,
				//hidden: !formController.getView().getEditing(),
				items: actions
			});

			grid.reconfigure(conf.columns);
			this.actionColumn = grid.down('[reference=actionColumn1]');

			// Add grid reference to the actionColumn
			// this.actionColumn.ownerGrid = this.grid;

			//this.actionColumn.width = 6 + (this.actionColumn.items.length * 20);
		}
		// Get the Action Column
		this.actionColumn2 = grid.down('[reference=actionColumn2]');
		if(!this.actionColumn2) {
			var actions2 = [];
			if(this.editrow !== false){
				actions2.push({
					isDisabled: function(v, r, c, i, rec) {
						if(!rec) return true;
						if(rec.get('dummy')) return true;
						if(this.disableEditRow) {
							if(rec.get(this.disableEditRow.property) === this.disableEditRow.value) return true
						}
						return false;
					},
					getClass: function(v, meta, rec) {
						if(rec && rec.get('dummy')) return false;
						return 'fa fa-edit';
					},
					tooltip: 'Edit row',
					handler: function(view, rowIndex, colIndex, item, e, rec, row) {
						this.loadForm(view, rec, row, rowIndex);
					},
					scope: this
				});
			}

			// Add action column for editing by plugin GridEditing
			conf.columns.unshift({
				xtype: 'actioncolumn',
				reference: 'actionColumn2',
				menuDisabled: true,
				width: 25,
				//hidden: !formController.getView().getEditing(),
				items: actions2
			});

			grid.reconfigure(conf.columns);
			this.actionColumn2 = grid.down('[reference=actionColumn2]');

			//this.actionColumn2.width = 6 + (this.actionColumn2.items.length * 20);
		}

		// On start editing
		formController.on({
			startEditing: this.startEditing,
			stopEditing: this.stopEditing,
			scope: this
		});
		
		// Init editing state
		/*if(this._subform.editing === true) {
			this.startEditing();
		}
		if(this._subform.editing === false) {
			this.stopEditing();
		}*/
		
		if(this.commitrow === true) {
			grid.on('beforeedit', function (e, context) {
				formController.getViewModel().set('rowdata', context.record.getData());
			}, this);

			grid.on('edit', function (e, context) {
				// Call on validate new row. The new row is now validated.
				if(!context) return;

				if(this._subformWindow) {
					this._subformWindow.show();
					this._subformWindow.setVisible(false);
				}

				// Get subform controller
				
				
				// if(this._subform) {
					// var formController = this._subform.getController();
					// // Load data - allow to use form override if exist
					// var data = context.record.getData();
					// this.setDataFid(data);
					// formController.loadData({
						// raw: data
					// });

					// // Init update mode
					// var vm = this._subform.getViewModel();
					// vm.set('updating', true);
					
					// // Save subform data - allow to use form override if exist
					// formController.saveData({
						// success: function(res) {
							// vm.set('updating', false);

							// // Save main form too
							// if(this.autocommit) {
								// var controller = this._grid.lookupController();
								// controller.saveData(res);
							// }

							// this.resetSubForm();
						// },
						// scope: this
					// });
				// } else {
					if(this.autocommit) {
						var controller = this._grid.lookupController();
						
						if(!controller.reloadGridEvent) {
							controller.reloadGridEvent = true;
							controller.on("afterload", function() {
								this._grid.lookupController().startEditing();
							}, this);
						}
												
						controller.saveData(null, {
							success: function(res) {
								controller.loadFeature();								
							},
							scope: this
						});
					}
				//}				
			}, this);
		}
	},

	createSubForm: function(rec, rowIndex, load) {
		var data = [];
		for(var key in rec.data) {
			if(rec.data.hasOwnProperty(key)) {
				var newKey = key.replace(/\./g, "_");
				data[newKey] = rec.data[key];
			}			
		}

		var formController = this._grid.lookupController();
		var formName = this.subformConfig.url;
		var tpl = new Ext.Template(formName);
		formName = tpl.apply(data);
		// format name (remove space, accent and lower case)
		formName = formName.replace(/ /g, '').stripAccent().toLowerCase();
		var url = Ck.getApi() + "service=forms&request=get&format=frm&name=" + formName;

		var dataFid = formController.getView().getDataFid();
		if(rec.data.fid) {
			dataFid = rec.data.fid.toString();
		}
		
		// Can't create subform instance here. Need to add in page first, to get viewModel hierarchy
		var subformConf = {
			xtype: 'ckform',
			itemId: 'subform',
			isSubForm: true,
			parentForm: formController.getView(),

			// load from grid selection row
			autoLoad: false,
			editing: this.subformConfig.editing || formController.getView().getEditing(),
			urlTemplate: this.subformConfig.urlTemplate || formController.getView().getUrlTemplate(),
			// inherit dataFid from main form (used in store url template)
			dataFid:  dataFid,

			// TODO use param from json
			//layout: 'fit',
			layout: this.subformConfig.layout || '',
			scrollable: this.subformConfig.scrollable || 'y',

			formName: url,

			// TODO verify
			// for compatibility mode only
			layer: formName,
			//
			listeners: {
				afterShow: function(form) {
					if(load) {
						this.loadItem(rec, rowIndex);
					}					
				},
				scope: this
			},
			// Default toolbar
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				bind: {
					hidden: '{!editing}'
				},
				style: {border: 0},
				items: ['->', {
					text: 'Add',
					handler: this.addItem,
					bind: {
						hidden: '{updating}'
					},
					scope: this
				}, {
					text: 'Update',
					handler: this.updateItem,
					bind: {
						hidden: '{!updating}'
					},
					scope: this
				}]
			}]
		};
		
		if(!this.subformConfig.window) {
			this.subformConfig.window = {
				maximized: true
			};
		}

		if(this._subformWindow) {
			this._subformWindow.destroy();
		}		

		this._subformWindow = Ext.create('Ext.window.Window', Ext.applyIf({
			layout: 'fit',
			closeAction: 'hide',
			items: subformConf
		}, this.subformConfig.window));

		if(load) {
			this._subformWindow.show();
		}
		
		// Get subform
		this._subform = this._subformWindow.down('ckform');

		if(!load) {
			this.setoController();
		}
		var vm = this._subform.getViewModel();
		vm.set('updating', false);
	},
	
	startEditing: function() {
		// add & show action column
		this.actionColumn.show();
		this.actionColumn2.show();

		// Enable rowediting plugin
		var sfplugin = this._grid.findPlugin('rowediting');
		if(sfplugin) sfplugin.enable();
	},

	stopEditing: function() {
		// hide action column
		if(this.actionColumn.getRefOwner() !== undefined) {
			this.actionColumn.hide();
		}
		
		if(this.actionColumn2.getRefOwner() !== undefined) {
			this.actionColumn2.hide();
		}		

		// Disable rowediting plugin
		var sfplugin = this._grid.findPlugin('rowediting');
		if(sfplugin) sfplugin.disable();
	},

	newItem: function() {
		if(!this._subform) return;

		// Force reset
		this.resetSubForm();

		// TEMP - compatibility only ?
		// reset data fid for new item (used by dataUrl templating)
		this._subform.setDataFid(null);
		//

		if(this._subformWindow) {
			this._subform.getController().startEditing();
			this._subformWindow.show();
		}
	},

	addItem: function() {
		var rec = grid.store.getAt(rowIndex);
		this.createSubForm(rec, rowIndex);
		// Get subform controller
		var formController = this._subform.getController();

		// Save to server if params available, otherwise
		// saveData check form validity
		formController.saveData(null, {
			success: function(res) {				
				if(this.autocommit) {
					var controller = this._grid.lookupController();
					// When subform don't save data (global save), need to reload here to sync ID if necessary  
					controller.saveData({
						reload: true
					}, {
						success: function(res) {
							if(this.addItemLast===true){
								// Add new record at the end
								this._grid.getStore().add(res);
							}else{
								// Insert new record	at the beginning
								this._grid.getStore().insert(0, res);
							}
							this._grid.getView().refresh();
						},
						scope: this
					});
				}
			},
			create: true,
			scope: this
		});
	},

	updateItem: function() {
		
		// Get subform controller
		var formController = this._subform.getController();
		formController.commitSubform = true;
		
		// Save if params available
		formController.saveData(null, {
			success: function(res) {
				// End update mode
				var vm = this._subform.getViewModel();
				vm.set('updating', false);

				// Update selected record
				// var rec = this._grid.getStore().getAt(this._subform.rowIndex);
				// if(rec) rec.set(res);
				this._grid.getView().refresh();

				/*if(this.autocommit) {
					var controller = this._grid.lookupController();
					controller.saveData();
				}*/
				// delete this._subform.rowIndex;

				this.resetSubForm();
			},
			scope: this
		});
	},

	deleteItem: function(grid, rowIndex) {
		var rec = grid.store.getAt(rowIndex);
		this.createSubForm(rec, rowIndex);
		
 		// End update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', false);

		var formController = this._subform.getController();
		var store = grid.getStore();
		var rec = store.getAt(rowIndex);

		// update data fid for current item (used by dataUrl templating)
		var dataFid = Ext.apply(this._subform.getDataFid(), rec.getData());
		this._subform.setDataFid(dataFid);
		//

		// Delete record if params available
		formController.deleteData({
			success: function(){
				store.remove(rec);
				// Not added by Ext ! need for compatibility to get back deleted records via store.getRemovedRecords()
				store.removed.push(rec);

				if(this.autocommit) {
					var controller = this._grid.lookupController();
					controller.saveData();
				}
				
				this.resetSubForm();
			},
			fid: dataFid,
			scope: this
		});
	},

	loadForm: function(view, rec, tr, rowIndex) {
		this.createSubForm(rec, rowIndex, true);		
	},

	loadItem: function(rec, rowIndex) {
		if(!this._subform) return;
		
		var formController = this._subform.getController();
		var grid = this._grid;

		if(this._subformWindow) {
			// If grid is in editing mode > subform is editing too
			if(grid.lookupViewModel().get('editing')===true){
				formController.startEditing();
			} else {
				formController.stopEditing();
			}

			this._subformWindow.show();
		}


		// Init update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', true);

		var data = rec.getData();
		var fidName = grid.subform.fid || grid.fid || 'fid';
		var fidValue = data[fidName] || data.fid ;

		var dataUrl = grid.subform.dataUrl || formController.dataUrl;

		// update data fid for current loading item (used by dataUrl templating)
		var vDataFid = this._subform.getDataFid();
		var dataFid = {};
		if(Ext.isString(vDataFid)) {
			dataFid = Ext.apply({
				fid: vDataFid
			}, data);
		} else{
			dataFid = Ext.apply(vDataFid, data);
		}
		this._subform.setDataFid(dataFid);
		//

		// By default load subform with data from the grid
		var options = {
			raw: data
		};

		// If find un Feature Id, try load with it
		if(fidValue) {
			options = {
				fid: fidValue
			};
		}

		// If find a Data URL, try load with it instead
		if(dataUrl) {
			if(Ext.isObject(dataUrl)) {
				dataUrl = dataUrl.read;
			}
			var tpl = new Ext.Template(dataUrl);
			dataUrl = tpl.apply(dataFid);
			options = {
				fid: dataFid,
				url: dataUrl
			};
		}

		if(Ext.isDefined(rowIndex)) this._subform.rowIndex = rowIndex;

		// Finally load subform data with fid, url or data
		formController.loadFeature(options);
	},
	
	setDataFid: function(data) {
		var vDataFid = this._subform.getDataFid();
		this.mainDataFid = Ext.clone(vDataFid);
		var dataFid = {};
		if(Ext.isString(vDataFid)) {
			dataFid = Ext.apply({
				fid: vDataFid
			}, data);
		} else{
			dataFid = Ext.apply(vDataFid, data);
		}
		this._subform.setDataFid(dataFid);

		return dataFid;
	},
	
	resetSubForm: function() {
		var vm = this._subform.getViewModel();
		vm.set('updating', false);

		this._subform.getController().resetData();
		this._grid.focus();

		if(this._subformWindow) {
			this._subformWindow.hide();
		}
	},
	
	setoController: function() {
		var controller = this._subform.getController();
		// Create un dedicated controller form the named form
		var controllerName = 'Ck.form.controller.' + controller.name;
		if(!Ext.ClassManager.get(controllerName)) {
			Ext.define(controllerName, {
				extend: 'Ck.form.Controller',
				alias: 'controller.ckform_'+ controller.name
			});
		}

		// Define new controller to be overriden by application
		// Use this.oController to access overriden methods !
		controller.oController = Ext.create(controllerName);
		controller.oController._parent = controller;
		//

		if(controller.oController.beforeShow(this._subform) === false) {
			Ck.log("beforeShow cancel initForm.");
			return;
		}
	}
});
