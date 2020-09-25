/**
 *
 */
Ext.define('Ck.form.plugin.GridEditing', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridediting',

	editrow: false,
	deleterow: true,
	
	init: function(grid) {
		this.grid = grid;
				
		var formController = grid.lookupController();
		
		// Init store fields from column definition
		var store = grid.getStore();
		if(!store.getFields()){
			store.setFields(this.getFields());
		}
		
		grid.addDocked({
			xtype: 'toolbar',
			dock: 'top',
			bind: {
				hidden: '{!editing}'
			},
			style: {border: 0},
			items: ['->', {
				text: 'Add',
				handler: this.handleNewRow,
				bind: {
					hidden: '{updating}'
				},
				scope: this
			}]
		});
			
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
						if(rec && rec.get('dummy')) return false;
						return 'fa fa-edit';
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
						if(rec && rec.get('dummy')) return false;
						return 'fa fa-close';
					},
					tooltip: 'Delete row',
					handler: this.deleteRow,
					scope: this
				});
			}
			
			var conf = this.grid.getInitialConfig();
			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				hidden: !formController.getView().getEditing(),
				items: actions
			});

			this.grid.reconfigure(conf.columns);
			this.actionColumn = this.grid.down('actioncolumn');

			// Add grid reference to the actionColumn
			// this.actionColumn.ownerGrid = this.grid;
			
			this.actionColumn.width = 6 + (this.actionColumn.items.length * 20);
		}

		// On start editing
		formController.on({
			startEditing: this.startEditing,
			stopEditing: this.stopEditing,
			scope: this
		});
		// If already editing (in subform...)
		if(formController.view.getEditing()===true) this.startEditing();
		
		grid.on({
			validateedit: this.addNewRow,
			scope: this
		});
	},

	/**
	 * @private
	 * Component calls destroy on all its plugins at destroy time.
	 */
	destroy: function() {
	},

	handleNewRow: function() {
		this.startEditing();
		
		var store = this.grid.getStore();
		var view = this.grid.getView();		
		var row = view.getRow(store.getAt(store.getCount() - 1));
		
		// Focus the 1st non-actioncolumn cell of the new row
		for(var i=0; i<row.cells.length; i++) {
			if(row.cells[i].className.indexOf("actioncolumn") == -1) {
				view.editingPlugin.startEdit(store.getAt(store.getCount() - 1), i);
				break;
			}
		}
	},
	
	startEditing: function() {
		// add & show action column
		this.actionColumn.show();
		this.addNewRow();
		
		// Enable rowediting plugin
		var sfplugin = this.grid.findPlugin('rowediting');
		if(sfplugin) sfplugin.enable();
	},

	stopEditing: function() {
		// hide action column
		this.actionColumn.hide();
		this.deleteNewRow();
	},
	
	addNewRow: function(e, context){
		var store = this.grid.getStore();
		
		// Call on validate new row. The new row is now validated.
		if(context && context.record) {
			delete context.record.data['dummy'];
		}
		
		// We allready have un empty field for new record...
		if(store.findRecord('dummy', true)) return;

		// Add empty row at the end
		store.add({
			dummy: true
		});		
	},
	
	deleteNewRow: function(){
		// Remove empty field for new record...
		var store = this.grid.getStore();
		var row = store.find('dummy', true);
		if(row) store.removeAt(row);
	},
	
	deleteRow: function(grid, rowIndex) {
        var store = grid.getStore();
		var rec = store.getAt(rowIndex);
		if(rec){
			store.remove(rec);
			// Not added by Ext ! need for compatibility to get back deleted records via store.getRemovedRecords()
			store.removed.push(rec);		
		}
	},
	
	getFields: function(){
		if(!this.grid.columns) return;
		var fields = [];
		var cols = this.grid.columns;

		// Column Model
		for(var col in cols){
			if(cols[col] && cols[col].dataIndex) {
				var colname = cols[col].text;
				var colindex = cols[col].dataIndex;

				fields.push({
					name: colindex,
					//defaultValue: colname,
					type: cols[col].type || 'auto' //,
					// rendererOption: cols[col].rendererOption || {},
					// convert: function(v, n) {
						// return n[v];
					// }
				});
			}
		}
		
		return fields;
	}
	
});
