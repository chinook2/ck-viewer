/**
 *
 */
Ext.define('Ck.form.plugin.GridEditing', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridediting',

	editrow: false,
	deleterow: true,
	
	init: function(grid) {
		if(this.disabled) return;
		this.grid = grid;
				
		var formController = grid.lookupController();
				
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
			
			// Default hide action column when editing = false or no action enable
			var hide = !formController.getView().getEditing();
			if(actions.length==0) hide = true;
			
			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				hidden: hide,
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
        grid.getStore().removeAt(rowIndex);
	}
});
