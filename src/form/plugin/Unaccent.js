/**
 * To be used on combobox
 * Tested only with local store
 * 
 * Juste add this config to combobox
 * plugins: "unaccent",
 * 
 * Perform a local doQuery on new local field without accent
 */
Ext.define('Ck.form.plugin.Unaccent', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.unaccent',

	// DisplayField
	originalDisplayField: null,
    
    // Unaccent DisplayField
    unaccentDisplayField: null,
    
	// Init plugin
	init: function(cmp) {
        if(!cmp) return;
        if(!cmp.getStore) {
            console.warn("Component must have a Store for plugin Unaccent.")
            return;
        }

        // cmp is combobox
        var store = cmp.getStore();
        if(!store) {
            console.warn("Component Store is empty.")
            return;
        }

        this.originalDisplayField = cmp.displayField;
        this.unaccentDisplayField = cmp.displayField + '_noaccent';

        // Add the unaccent field to local store
        store.on('load', function (str, records, successful, operation, eOpts ) {
            store.each(function(r){
                var v = r.get(this.originalDisplayField);
                if (v) {
                    v = Ext.String.stripAccent(v);
                    r.set(this.unaccentDisplayField, v);
                }
            }, this);            
        }, this);

        // ByPass doQuery to filter on the new unaccent field
        cmp.on('beforequery', function (queryPlan) {
            // Pass a query without accent
            queryPlan.query = Ext.String.stripAccent(queryPlan.query);

            cmp.lastQuery = queryPlan.query;
            if (cmp.queryMode === 'local') {
                this.doLocalQuery(queryPlan, cmp);
                // Cancel standard query
                return false;
            }else {
                cmp.doRemoteQuery(queryPlan);
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


    /**
     * Override Ext method
     * @param {*} queryPlan 
     */
    doLocalQuery: function(queryPlan, cmp) {
        var queryString = queryPlan.query,
            store = cmp.getStore(),
            value = queryString,
            filter;
 
        cmp.clearLocalFilter();
 
        // Querying by a string...
        if (queryString) {
            // User can be typing a regex in here, if it's invalid
            // just swallow the exception and move on
            if (cmp.enableRegEx) {
                try {
                    value = new RegExp(value);
                } catch(e) {
                    value = null;
                }
            }
            if (value !== null) {
                // Must set changingFilters flag for this.checkValueOnChange.
                // the suppressEvents flag does not affect the filterchange event
                cmp.changingFilters = true;
                filter = cmp.queryFilter = new Ext.util.Filter({
                    id: cmp.id + '-filter',
                    anyMatch: cmp.anyMatch,
                    caseSensitive: cmp.caseSensitive,
                    root: 'data',
                    // Override here - filter on new field without accent
                    property: this.unaccentDisplayField,
                    // ---
                    value: value
                });
                store.addFilter(filter, true);
                cmp.changingFilters = false;
            }
        }
 
        // Expand after adjusting the filter if there are records or if emptyText is configured.
        if (cmp.store.getCount() || cmp.getPicker().emptyText) {
            // The filter changing was done with events suppressed, so
            // refresh the picker DOM while hidden and it will layout on show.
            cmp.getPicker().refresh();
            cmp.expand();
        } else {
            cmp.collapse();
        }
 
        cmp.afterQuery(queryPlan);
    }    
});
