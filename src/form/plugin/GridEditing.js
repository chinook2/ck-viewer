/**
 *
 */
Ext.define('Ck.form.plugin.GridEditing', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridediting',

	editrow: false,
	deleterow: true,
	dummyrow: true,

	init: function(grid) {
		if(this.disabled) return;

		// Init subform after grid rendering
		grid.on('afterrender', function() {
			this.initEditing(grid);
		}, this, {delay: 50});
	},

	initEditing: function(grid) {
		this.grid = grid;

		// Get parent ckform
		var formController;
		var ckform = grid.view.up('ckform');
		if(ckform) formController = ckform.getController();

		// Get the Action Column
		this.actionColumn = this.grid.down('actioncolumn');
		if(!this.actionColumn) {
			var actions = [];
			if(this.editrow!==false){
				actions.push({
					isDisabled: function(v, r, c, i, rec) {
						if(rec && rec.get('dummy')) return true;
						return false;
					},
					getClass: function(v, meta, rec) {
						if(!meta.record) return false; // hide icon on row editting
						if(rec && rec.get('dummy')) return false;
						return 'ckEdit';
					},
					tooltip: 'Edit row',
					handler: function(view, rowIndex, colIndex, item, e, rec, row) {
						var plg = grid.getPlugin('rowediting');
						// colIndex = actioncolumn index... use column index 0 to start Edit
						if(plg) plg.startEdit(rec, 0);
					},
					scope: this
				});
			}
			if(this.deleterow!==false){
				actions.push({
					isDisabled: function(v, r, c, i, rec) {
						if(rec && rec.get('dummy')) return true;
						return false;
					},
					getClass: function(v, meta, rec) {
						if(!meta.record) return false; // hide icon on row editting
						if(rec && rec.get('dummy')) return false;
						return 'ckClose';
					},
					tooltip: 'Delete row',
					handler: this.deleteRow,
					scope: this
				});
			}

			var conf = this.grid.getInitialConfig();

			// Default hide action column when editing = false or no action enable
			var hide = (formController)? !formController.getView().getEditing() : false;
			hide = (actions.length == 0)? true : hide;

			// Add action column for editing by plugin GridEditing
			var col = [];
			if (conf.columns) {
				col = (Ext.isArray(conf.columns))? conf.columns : conf.columns.items;
			} else {
				col = Ext.Array.pluck(this.grid.columns, 'initialConfig');
			}

			col.push({
				xtype		: 'actioncolumn',
				hidden		: hide,
				items		: actions,
				editor		: false,
				cellWrap	: false,
				flex		: 0
			});

			// Helper to identify by CSS first cell for dummy row
			col[0].renderer = function(value, metaData, record, rowIndex, colIndex, store, view){
				if(colIndex==0 && record.get('dummy')){
					metaData.innerCls = 'ck-dummy-cell-inner';
				}
				return value;
			}

			this.grid.reconfigure(col);
			this.actionColumn = this.grid.down('actioncolumn');

			// Add grid reference to the actionColumn
			// this.actionColumn.ownerGrid = this.grid;

			this.actionColumn.width = 6 + (this.actionColumn.items.length * 20);
		}

		if(formController){
			// On start editing
			formController.on({
				startEditing: this.startEditing,
				stopEditing: this.stopEditing,
				scope: this
			});
			// If already editing (in subform...)
			if(formController.view.getEditing()===true) this.startEditing();
		} else {
			var c = grid.getConfig();
			if ((grid.editing === true) || (c && c.editing === true)){
				this.startEditing();
			} else {
				this.stopEditing();
			}
		}

		grid.on({
			validateedit: this.addNewRow,
			edit: function(e, context){
				// After edit row select first cell of next row
				if(this.dummyrow===true && context) {
					var v = context.view;
					v.getSelectionModel().selectNext();
					var pos = v.selectionModel.getCurrentPosition();
					pos.setColumn(0);
					v.focusCell(pos);
				}
			},
			scope: this
		});

		grid.getStore().on({
			add: function (store, records) {
				// Adding dummy row. return
				if(records.length===1 && records[0].get('dummy')===true) return;

				var rec = store.findRecord('dummy', true);
				if (rec) {
					// Move dummy row to the end
					this.deleteNewRow();
					this.addNewRow();
				}
			},
			scope: this
		})
	},

	/**
	 * @private
	 * Component calls destroy on all its plugins at destroy time.
	 */
	destroy: function() {
	},


	startEditing: function() {
		// add & show action column
		if(this.actionColumn.items.length>0) this.actionColumn.show();
		this.addNewRow();
	},

	stopEditing: function() {
		// hide action column
		this.actionColumn.hide();
		this.deleteNewRow();
	},

	addNewRow: function(e, context){
		var store = this.grid.getStore();

		// Call on validate new row. The new row is now validated.
		if(context) {
			delete context.record.data['dummy'];
		}

		// We allready have un empty field for new record...
		if(store.findRecord('dummy', true)) return;

		// Add empty row at the end
		if(this.dummyrow===true){
			store.add({
				dummy: true
			});
		}
	},

	deleteNewRow: function(){
		// Remove empty field for new record...
		var store = this.grid.getStore();
		var rec = store.findRecord('dummy', true);
		if(rec) store.remove(rec);
	},

	deleteRow: function(grid, rowIndex) {
		var store = grid.getStore();
		var rec = store.getAt(rowIndex);
		if(rec){
			store.remove(rec);
			// Not added by Ext ! need for compatibility to get back deleted records via store.getRemovedRecords()
			if (store.removed) {
				store.removed.push(rec);
			}
		}
	}
});
