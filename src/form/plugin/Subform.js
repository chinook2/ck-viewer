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

		this._subform = Ext.create({
			xtype: 'ckform',
			itemId: 'subform',
			isSubForm: true, 
			editing: subForm.editing || formController.getView().getEditing(),
			urlTemplate: subForm.urlTemplate || formController.getView().getUrlTemplate(),
			
			// TODO use param from json
			//layout: 'form',
			scrollable: 'y',
			
			formName: '/' + subForm.url,
			layer: grid.name,
			
			// Default toolbar
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
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
		});
		
		var vm = this._subform.getViewModel();
		vm.set('updating', false);
		
		// add subform in a panel
		if(subForm.renderTo) {
				var ct = Ext.getCmp(subForm.renderTo);
				if(!ct){
					Ck.Notify.error("Enable to render subform '"+ subForm.url +"' in '"+ subForm.renderTo +"'")
					return;
				}
				ct.add(this._subform);
			
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
			
			grid.addDocked([{
				dock: docked.dock,
				width: docked.width || 500,
				items: [this._subform]
			}]);

		// (default) add subform in popup
		} else {
			if(!subForm.window) {
				subForm.window = {
					//title: "Subform",
					height: 400,
					width: 400
				}
			}
			this._subformWindow = Ext.create('Ext.window.Window', Ext.applyIf({
				layout: 'fit',
				closeAction: 'hide',
				items: this._subform
			}, subForm.window));
		}
		
 		// Get the Action Column
		this.actionColumn = grid.down('actioncolumn');
		if(!this.actionColumn) {
			var actions = [];
			if(this.editrow!==false || this.clicksToEdit==0){
				actions.push({
					iconCls: 'fa fa-edit',
					tooltip: 'Edit row',
					handler: this.loadItem,
					handler: function(view, rowIndex, colIndex, item, e, rec, row) {
						this.loadItem(view, rec, row, rowIndex);
					},
					scope: this
				});
			}
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
					handler: this.deleteItem,
					scope: this
				});
			}
			
			var conf = grid.getInitialConfig();
			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				hidden: !formController.getView().getEditing(),
				items: actions
			});

			grid.reconfigure(conf.columns);
			this.actionColumn = grid.down('actioncolumn');

			// Add grid reference to the actionColumn
			// this.actionColumn.ownerGrid = this.grid;
			
			this.actionColumn.width = 6 + (this.actionColumn.items.length * 20);
		}	   
		
		if(this.clicksToEdit != 0) {
			grid.on('row' + (this.clicksToEdit === 1 ? 'click' : 'dblclick'), this.loadItem, this);			
		}
		
		// On start editing
		formController.on({
			startEditing: this.startEditing,
			stopEditing: this.stopEditing,
			scope: this
		});
	},
	
	startEditing: function() {
		// add & show action column
		this.actionColumn.show();
	},

	stopEditing: function() {
		// hide action column
		this.actionColumn.hide();
	},
	
	addItem: function() {
		if (!this._subform.isValid()) {
			return;
		}
		
		// [asString], [dirtyOnly], [includeEmptyText], [useDataValues]
		// var res = form.getValues(false, false, false, true);
		
		// Get only values of subform
		var formController = this._subform.getController();
		var res = formController.getValues();
		
		if(this.addItemLast===true){
			// Add new record at the end
			this._grid.getStore().add(res);
		}else{
			// Insert new record	at the beginning	
			this._grid.getStore().insert(0, res);
		}

		// Save if params available
		formController.saveData();
		
		this._subform.reset();
		if(this._subformWindow) {
			this._subformWindow.hide();
		}
	},
	
	updateItem: function() {
		if (!this._subform.isValid()) {
			return;
		}
		
		// Init update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', false);
		
		// Get only values of subform
		var formController = this._subform.getController();
		var res = formController.getValues();
		
		// Update selected record
		var rec = this._grid.getStore().getAt(this._subform.rowIndex);
		if(rec) rec.set(res);
		
		delete this._subform.rowIndex;
		
		this._subform.reset();
		this._grid.focus();
		if(this._subformWindow) {
			this._subformWindow.hide();
		}
		
	},

	deleteItem: function(grid, rowIndex) {
		grid.getStore().removeAt(rowIndex);
		
 		// update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', false);
		
		this._subform.reset();
		if(this._subformWindow) {
			this._subformWindow.hide();
		}
	},
	
	loadItem: function(view, rec, tr, rowIndex) {
		if(!this._subform) return;
		
		if(this._subformWindow) {
			this._subformWindow.show();
		}
		
		var formController = this._subform.getController();
		// view = tableview, grid.grid = gridpanel ...
		grid = view.grid;
		
		// Init update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', true);
		
		var data = rec.getData();
		var fidName = grid.subform.fid || grid.fid || 'fid';	
		var fidValue = data[fidName];
		
		var dataUrl = grid.subform.dataUrl;
		
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
			var tpl = new Ext.Template(dataUrl);
			dataUrl = tpl.apply(data);
			options = {
				url: dataUrl
			};
		}
		
		this._subform.rowIndex = rowIndex;
		
		// Finally load subform data with fid, url or data
		formController.loadData(options);
	}
});
