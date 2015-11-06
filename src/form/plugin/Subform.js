/**
 * @private
 */
Ext.define('Ck.form.plugin.Subform', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.gridsubform',

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
    
	
	initSubForm: function(grid, subForm) {
		this._grid = grid;
		var subForm = grid.subform;

		this._subform = Ext.create({
			xtype: 'ckform',
			itemId: 'subform',
			isSubForm: true, 
			editing: subForm.editing || grid.lookupViewModel().get('editing'),
			urlTemplate: subForm.urlTemplate || grid.lookupController().getView().getUrlTemplate(),
			
			// TODO use param from json
			layout: 'form',
			scrollable: 'y',
			
			formName: '/' + subForm.url,
			layer: grid.name,
			
			// Default toolbar
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
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
				items: this._subform
			}, subForm.window));
		}
		
		/*
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
        */
		
        grid.on('rowclick', this.loadItem, this);
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
    },
    
	updateItem: function() {
		// Init update mode
		var vm = this._subform.getViewModel();
		vm.set('updating', false);
		
		
		var form = this._subform.getForm();
		form.reset();
		
		if(this._subformWindow) {
			this._subformWindow.hide();
		}
		
	},

    deleteItem: function(grid, rowIndex) {
        grid.getStore().removeAt(rowIndex);
    },
	
    loadItem: function(grid, rec, tr, rowIndex) {
        if(!this._subform) return;
		
		if(this._subformWindow) {
			this._subformWindow.show();
		}
		
		var formController = this._subform.getController();
		// grid = tableview, grid.grid = gridpanel ...
		grid = grid.grid;
		
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
		
		// Finally load subform data with fid, url or data
		formController.loadData(options);
		
        // this._subform.rowIndex = rowIndex;
        // this._subform.loadRecord(rec);
    }
});
