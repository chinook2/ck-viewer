/**
 * @private
 */
Ext.define('Ck.form.plugin.Store', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.gridstore',

    init: function(grid) {
        
        // Get associate form of the grid (assume first parent form)
        var formView = grid.view.up('form');
        if(!formView) return;

		var formController = formView.getController();

        //On data loaded >
		formController.on('afterload', this.loadRecord, grid);
        
        // A l'enregistrement du form recup les valeurs du grid
		formController.on('beforesave', this.getValues, grid);

        // A l'enregistrement du form recup les valeurs du grid
		formController.on('beforesave', this.resetData, grid);
    },

    /**
     * @private
     * Component calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
    },
    
    loadRecord: function(res) {
        if(!res) return;
		
		var n = this.name; // nom de la table = nom de la relation = clé dans la table des résultats
        if(res[n]) this.getStore().loadData(res[n]);
    },
    
    getValues: function() {
        // return this.store.getData();
        var dtg = [];
        this.getStore().each( function (model) {
            dtg.push(model.data);
        });            
        // dt[grid.name] = dtg;
        return dtg;
    },


    resetData: function () {
		/*
		// GRID : reset data
		var grids = v.query('gridpanel');
		for (var g = 0; g < grids.length; g++) {
			var grid = grids[g];

			// Suppr tous les enregistrements du grid.
			grid.getStore().removeAll();

			// TODO : revoir le clean pour le subform...
			// Récup le subform
			var form = grid.getDockedComponent('subform');
			if (form) {
				form.reset();
				delete form.rowIndex;
			}
		}
		*/

		return true;
    }

});
