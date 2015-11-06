/**
 * @private
 */
Ext.define('Ck.form.plugin.Subform', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.gridsubform',

	_subform: null,
	
    init: function(grid) {
        if(!grid.subform) return;

		var subForm = {};
		if(Ext.isString(grid.subform)){
			subForm.url = grid.subform;
			grid.subform = subForm;
		} else {
			subForm = grid.subform;
		}
		
		// add subform in a panel
		if(subForm.renderTo) {
			grid.on('afterrender', function() {
				var ct = Ext.getCmp(subForm.renderTo);
				if(!ct){
					Ck.Notify.error("Enable to render subform '"+ subForm.url +"' in '"+ subForm.renderTo +"'")
					return;
				}
				var vm = grid.lookupViewModel();
				this._subform = Ext.create({
					xtype: 'ckform',
					itemId: 'subform',
					isSubForm: true, 
					editing: subForm.editing || vm.get('editing'),
					
					// TODO use param from json
					layout: 'form',
					scrollable: 'y',
					
					formName: '/' + subForm.url,
					layer: grid.name,
					
					// Default toolbar
					dockedItems: [{
						xtype: 'toolbar',
						dock: 'bottom',
						items: ['->',{
							text: 'Add',
							handler: this.addItem,
							scope: grid
						}]
					}]
				});
				ct.add(this._subform);
			}, this, {delay: 50});
			
		// (default) dock subform on right of the grid
		} else {
			// Adding toolbar for subform on grid
			grid.addDocked([{
				xtype: 'toolbar',
				dock: 'top',
				items: ['->',{
					text: 'Add',
					handler: this.addItem,
					scope: grid
				}]
			},{
			// add subform 'inline'
				xtype: 'ckform',
				dock: 'right',
				itemId: 'subform',
				width: 500,
				
				isSubForm: true, 
					// TODO use param from json
					layout: 'form',
					scrollable: 'y',

				formName: '/' + subForm.url,
				layer: grid.name
			}]);
		}
        
		// TODO : add subform in popup
		
        // Add column to delete row
        var column = Ext.create('Ext.grid.column.Action', {
            width: 30,
            sortable: false,
            menuDisabled: true,
            items: [{
                iconCls: 'fa fa-close',
                tooltip: 'Delete row',
                scope: this,
                handler: this.deleteItem
            }]
        });
        grid.headerCt.insert(grid.columns.length, column);
        grid.getView().refresh();        
        //
        
        grid.on('rowclick', this.editItem, this);
    },

    /**
     * @private
     * Component calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
    },
    
    addItem: function() {
		return; 
		
		/*
        // this = grid
        
        // Récup le subform
        var form = this.getDockedComponent('subform');
        if(!form) return;
        
        var lyr = this.name; // this = grid. name = nom de la table et du form
        
        if (!form.isValid()) {
            return;
        }
        
        // [asString], [dirtyOnly], [includeEmptyText], [useDataValues]
        var res = form.getValues(false, false, false, true);
        
        if(form.rowIndex >= 0) {
            // Update record
            var rec = this.getStore().getAt(form.rowIndex);
            if(rec) rec.set(res);
            
            delete form.rowIndex;
        } else {
            // Add new record
            var md =  'Storage.'+lyr;
            var rec = Ext.create(md, res);
            
            this.getStore().insert(0, rec);
        }

        this.getView().refresh();
        form.reset();
        */
		
        // TODO : gestion d'un mode 'inline' et d'un mode popup...
        /*
        Ext.create('Ext.window.Window', {
            height: 400,
            width: 400,
            layout: 'fit',
            // headerPosition: 'top',
            // maximized: true,
            // closable: false,
            // listeners:{
                // close: this.clearSelection,
                // scope: this
            // },
            items: {
                xtype: 'forms',
                layer: lyr,
                fid: -1 // nouvel item
            }
        }).show();*/
    },
        
    editItem: function(grid, rec, tr, rowIndex) {
        // var form = this.getDockedComponent('subform');
        if(!this._subform) return;
		var formController = this._subform.getController();
		// grid = tableview, grid.grid = gridpanel ...
		grid = grid.grid;
		
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
		
		// Finally load subform data with fid, url or data
		formController.loadData(options);
		
        // this._subform.rowIndex = rowIndex;
        // this._subform.loadRecord(rec);
    },
    
    deleteItem: function(grid, rowIndex) {
        grid.getStore().removeAt(rowIndex);
    }
});
