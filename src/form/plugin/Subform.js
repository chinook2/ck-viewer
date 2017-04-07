/**
 * @private
 */
Ext.define('Ck.form.plugin.Subform', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridsubform',

	clicksToEdit: 1,

	editrow: true,

	deleterow: true,
	disableDeleteRow: null,

	addItemLast: true,

	_subformWindow: null,
	_subform: null,
	_grid: null,

	init: function(grid) {
		if(!grid.subform) return;

		// Accept param as String or Object
		if(Ext.isString(grid.subform)){
			grid.subform = {
				url : grid.subform
			};
		}

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
		var subForm = grid.subform;

		var formController = grid.lookupController();

		// Can't create subform instance here. Need to add in page first, to get viewModel hierarchy
		this._subform = {
			xtype: 'ckform',
			itemId: 'subform',
			isSubForm: true,
			parentForm: formController.getView(),

			// load from grid selection row
			autoLoad: false,
			editing: subForm.editing || formController.getView().getEditing(),
			urlTemplate: subForm.urlTemplate || formController.getView().getUrlTemplate(),
			// inherit dataFid from main form (used in store url template)
			dataFid:  formController.getView().getDataFid(),

			// TODO use param from json
			//layout: 'fit',
			layout: subForm.layout || '',
			scrollable: subForm.scrollable || 'y',

			formName: '/' + subForm.url,

			// TODO verify
			// for compatibility mode only
			layer: subForm.url,
			//

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

		// add subform in a panel
		if(subForm.renderTo) {
				var ct = Ext.getCmp(subForm.renderTo);
				if(!ct) ct = formController.lookupReference(subForm.renderTo);
				if(!ct){
					Ck.Notify.error("Enable to render subform '"+ subForm.url +"' in '"+ subForm.renderTo +"'")
					return;
				}
				ct.removeAll(true);
				this._subform = ct.add(this._subform);

		//  dock subform on right of the grid
		} else if(subForm.docked){
			// Adding toolbar for subform on grid
			if(subForm.docked === true) subForm.docked = 'right';
			var docked = {};
			if(Ext.isString(subForm.docked)){
				docked.dock = subForm.docked;
			} else {
				docked = subForm.docked;
			}

			grid.addDocked({
				dock: docked.dock,
				width: docked.width || 500,
				items: [this._subform]
			});

			// Get subform
			this._subform = grid.down('ckform');

		// (default) add subform in popup
		} else {
			if(!subForm.window) {
				subForm.window = {
					//title: "Subform",
					// height: 400,
					// width: 400
					maximized: true
				}
			}
			this._subformWindow = Ext.create('Ext.window.Window', Ext.applyIf({
				layout: 'fit',
				closeAction: 'hide',
				items: this._subform
			}, subForm.window));

			// Add toolbar for adding new item in grid (open window...)
			grid.addDocked({
				xtype: 'toolbar',
				dock: 'top',
				bind: {
					hidden: '{!editing}'
				},
				style: {border: 0},
				items: ['->', {
					text: 'Add',
					handler: this.newItem,
					bind: {
						hidden: '{updating}'
					},
					scope: this
				}]
			});

			// Get subform
			this._subform = this._subformWindow.down('ckform');
		}

		var vm = this._subform.getViewModel();
		vm.set('updating', false);

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
			if(this.editrow!==false || this.clicksToEdit==0){
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
						// e.stopPropagation();
						this.loadItem(view, rec, row, rowIndex);
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
		if(this._subform.editing === true) {
			this.startEditing();
		}
		if(this._subform.editing === false) {
			this.stopEditing();
		}
		//

		if(this.clicksToEdit != 0) {
			grid.on('row' + (this.clicksToEdit === 1 ? 'click' : 'dblclick'), function(cmp, record, tr, rowIndex, e, eOpts) {
				// Prevent load data when clic on action column ! handler of the action already pass...
				if(!Ext.fly(e.target).hasCls('x-action-col-icon')){
					this.loadItem(cmp, record, tr, rowIndex);
				}
			}, this);
		}
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

		// Force
		this.clicksToEdit = 1;
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
		// Get subform controller
		var formController = this._subform.getController();

		// Save to server if params available, otherwise
		// saveData check form validity
		formController.saveData(null, {
			success: function(res) {
				if(this.addItemLast===true){
					// Add new record at the end
					this._grid.getStore().add(res);
				}else{
					// Insert new record	at the beginning
					this._grid.getStore().insert(0, res);
				}
				this._grid.getView().refresh();

				this.resetSubForm();
			},
			create: true,
			scope: this
		});
	},

	updateItem: function() {
		// Get subform controller
		var formController = this._subform.getController();

		// Save if params available
		formController.saveData(null, {
			success: function(res) {
				// End update mode
				var vm = this._subform.getViewModel();
				vm.set('updating', false);

				// Update selected record
				var rec = this._grid.getStore().getAt(this._subform.rowIndex);
				if(rec) rec.set(res);
				this._grid.getView().refresh();

				delete this._subform.rowIndex;

				this.resetSubForm();
			},
			scope: this
		});
	},

	deleteItem: function(grid, rowIndex) {

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

				this.resetSubForm();
			},
			fid: dataFid,
			scope: this
		});
	},

	loadItem: function(view, rec, tr, rowIndex) {
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

	resetSubForm: function() {
		var vm = this._subform.getViewModel();
		vm.set('updating', false);

		this._subform.getController().resetData();
		this._grid.focus();

		if(this._subformWindow) {
			this._subformWindow.hide();
		}
	}
});
