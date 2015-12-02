/**
 *
 */
Ext.define('Ck.form.plugin.GridColumnRenderer', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridcolumnrenderer',

	store: null,
	displayField: null,
	valueField: null,
	
	// TODO : On passe ici 2 fois !! a cause du this.grid.reconfigure(conf.columns); des autres plugins (actions)
	
	init: function(column) {
		this.column = column;
		var grid = column.up('grid');
		var formController = grid.lookupController();
		

		// Init Store
		// Default StoreID
		var storeId = (grid.reference || grid.id) +'-'+ column.dataIndex;
		
		// Get store in ViewModel (global store pre-loaded) by default storeId or by store defined by user
		this.dataStore = formController.getViewModel().get(storeId);
		if(!this.dataStore) this.dataStore =  formController.getViewModel().get(this.store);
		
		// Get store in Application
		if(!this.dataStore) this.dataStore = Ext.getStore(storeId);
		if(!this.dataStore) this.dataStore = Ext.getStore(this.store);
		
		// Create local store
		if(!this.dataStore) {
			if(!this.store) {
				Ck.log("gridcolumnrenderer : store is not set.");
				return;
			}
			this.dataStore = Ext.create('Ext.data.Store',{
				storeId: storeId,
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: formController.getFullUrl(this.store),
					noCache: false
				}
			});
		}
		
		grid.getStore().on('load', function(){
			if(!this.dataStore.isLoaded()){
				this.dataStore.on('load', function(str, records, successful, eOpts) {
					this.updateRecords(grid, column);				 
				}, this);
			} else {
				this.updateRecords(grid, column);
			}
		}, this);
	},

	/**
	 * @private
	 * Component calls destroy on all its plugins at destroy time.
	 */
	destroy: function() {
		// this.dataStore.destroy();
	},
	
	updateRecords: function(grid, column) {
		grid.getStore().each(function(rec){
			rec.set(column.dataIndex, this.renderer(rec.get(this.valueField)), {
				dirty: false
			} );
		}, this);
	},
	
	renderer: function(val) {
		if(!this.dataStore) return val;
		if(!this.dataStore.isLoaded()) return '...';
		
		var rec = this.dataStore.findRecord(this.valueField, val);
		if(rec) val = rec.get(this.displayField);
		
		return val;
	}
});
