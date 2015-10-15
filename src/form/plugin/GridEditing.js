/**
 *
 */
Ext.define('Ck.form.plugin.GridEditing', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridediting',

	init: function(grid) {
		this.grid = grid;
		// Get the Action Column
		this.actionColumn = this.grid.down('actioncolumn');
		if(!this.actionColumn) {
			var conf = this.grid.getInitialConfig();
			// Add action column for editing by plugin GridEditing
			conf.columns.push({
				xtype: 'actioncolumn',
				hidden: true,
				items: [{
					iconCls: 'fa fa-edit',
					tooltip: 'Edit row',
					handler: Ext.emptyFn
				},{
					iconCls: 'fa fa-close',
					tooltip: 'Delete row',
					handler: Ext.emptyFn
				}]
			});

			this.grid.reconfigure(conf.columns);
			this.actionColumn = this.grid.down('actioncolumn');

			// Add grid reference to the actionColumn
			this.actionColumn.ownerGrid = this.grid;
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
	},

	stopEditing: function() {
		// hide action column
		this.actionColumn.hide();

	}
});
