/**
 * @private
 */
Ext.define('Ck.form.plugin.Subform', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.gridsubform',

    init: function(grid) {
        if(!grid.subform) return;

        // Ajoute la barre d'outils au grid
        grid.addDocked([{
            xtype: 'toolbar',
            dock: 'top',
            items: ['->',{
                text: 'Add',
                handler: this.addItem,
                scope: grid
            }]
        },{
        // Ajoute le subform 'inline' à droite du grid
            xtype: 'ckform',
            dock: 'right',
            itemId: 'subform',
            width: 500,
            
            isSubForm: true, 
                // TODO voir a mettre en param ds le json
                layout: 'form',
                scrollable: 'y',

            formName: '/' + grid.subform,
            layer: grid.name
        }]);
        
        // Ajoute la colonne pour supprimer
        var column = Ext.create('Ext.grid.column.Action', {
            width: 30,
            sortable: false,
            menuDisabled: true,
            items: [{
                icon: 'resources/theme/images/delete.gif',
                tooltip: 'Delete',
                scope: this,
                handler: this.deleteItem
            }]
        });
        grid.headerCt.insert(grid.columns.length, column);
        grid.getView().refresh();        
        //
                
        grid.on('rowclick', this.editItem, grid);
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
        var form = this.getDockedComponent('subform');
        if(!form) return;
        form.rowIndex = rowIndex;
        form.loadRecord(rec);
    },
    
    deleteItem: function(grid, rowIndex) {
        grid.getStore().removeAt(rowIndex);
    }
});
