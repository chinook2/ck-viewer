/**
 * 
 */
Ext.define('Ck.form.plugin.GridColumnRenderer', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.gridcolumnrenderer',

	// Id or Url of Store 
	store: null,
	
	// Field of store to display in the columun
	displayField: null,
	
	// Field of store to match record to read for display (match with dataField)
	valueField: null,
	
	// Field of the grid record to match with valueField - default to column dataIndex
	dataField: null,
	
	// Filters for the store (optionnal)
	filters: null,
	
	
	// TODO : On passe ici 2 fois !! a cause du this.grid.reconfigure(conf.columns); des autres plugins (actions)
	init: function(column) {	
		this.column = column;
		var grid = column.up('grid');
		var formController = grid.lookupController();
		
		if(!this.dataField) this.dataField =  column.dataIndex;

		// Init Store
		// Default StoreID
		var storeId = (grid.reference || grid.id) +'-'+ column.dataIndex;
		
		// Get store in ViewModel (global store pre-loaded) by default storeId or by store defined by user
		this.dataStore = formController.getViewModel().get(storeId);
		// if(!this.dataStore) this.dataStore =  formController.getViewModel().get(this.store);
		
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
			// Ck.log('gridcolumnrenderer init dataStore : '+ this.store);
		}
		
		grid.getStore().on({
			load: function(){
				// Ck.log('gridcolumnrenderer grid store load');
				grid.getView().refresh();
			},
			add: function(){
				// Ck.log('gridcolumnrenderer add row');
				grid.getView().refresh();
			},
			update: function() {
				// Ck.log('gridcolumnrenderer update row');
				grid.getView().refresh();
			},
			scope: this
		});
		
		// Ensure call refresh once on main grid load and on gridcolumnrenderer dataStore load.
		this.dataStore.on('load', function(str, records, successful, eOpts) {
			// Ck.log('gridcolumnrenderer dataStore loaded');
			if(grid.view) grid.getView().refresh();
		}, this);
		
		// Assign the renderer
		column.scope = this;
		column.renderer = this.renderer;
	},

	/**
	 * @private
	 * Component calls destroy on all its plugins at destroy time.
	 */
	destroy: function() {
		// this.dataStore.destroy();
	},
	
	renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
		if(!this.dataStore.isLoaded()) {
			return '...';
		}
		
		// TODO : Check mapping reader, bind...
		var getValue = function(obj, path){
			for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
				if(obj) obj = obj[path[i]];
			};
			return obj || '';
		};	
		var val = getValue(record.data, this.dataField);
		//
		
		if(this.filters){
			this.filters.forEach(function(f, idx, fs){
				f.value = record.get(f.property);
				fs[idx] = f;
			}, this);
			this.dataStore.filter(this.filters);
		}
		
		var frec = this.dataStore.findRecord(this.valueField, val);
		if(frec) val = frec.get(this.displayField);
		
		this.dataStore.clearFilter();		
		return val;
	}
});
