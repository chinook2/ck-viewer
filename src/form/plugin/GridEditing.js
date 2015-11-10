/**
 *
 */
Ext.define('Ck.form.plugin.GridEditing', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridediting',

	init: function(grid) {
		this.grid = grid;
		
		// Options for the plugin
		if(!grid.gridediting) grid.gridediting = {};
		
		// Init store fields from column definition
		var store = grid.getStore();
		if(!store.getFields()){
			store.setFields(this.getFields());
		}
		
		// Get the Action Column
		this.actionColumn = this.grid.down('actioncolumn');
		if(!this.actionColumn) {
			var actions = [];
			if(grid.gridediting.editrow!==false){
				actions.push({
					iconCls: 'fa fa-edit',
					tooltip: 'Edit row',
					handler: Ext.emptyFn
				});
			}
			if(grid.gridediting.deleterow!==false){
				actions.push({
					//iconCls: 'fa fa-close',
					isDisabled: function(v, r, c, i, rec) {
						if(rec && rec.get('dummy')) return true;
						return false;
					},
					getClass: function(v, meta, rec) {
						if(rec && rec.get('dummy')) return false;
						return 'fa fa-close';
					},
					tooltip: 'Delete row',
					handler: this.deleteRow
				});
			}
			
			var conf = this.grid.getInitialConfig();
			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				hidden: true,
				items: actions
			});

			this.grid.reconfigure(conf.columns);
			this.actionColumn = this.grid.down('actioncolumn');

			// Add grid reference to the actionColumn
			// this.actionColumn.ownerGrid = this.grid;
			
			this.actionColumn.width = 6 + (this.actionColumn.items.length * 20);
		}

		// Get associate form of the grid (assume first parent form)
		var formView = grid.view.up('form');
		if(!formView) return;

		var formController = formView.getController();

		// On start editing
		formController.on({
			startEditing: this.startEditing,
			stopEditing: this.stopEditing,
			scope: this
		});

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
		this.actionColumn.show();
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
