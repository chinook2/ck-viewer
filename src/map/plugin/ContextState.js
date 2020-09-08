/**
 * This is the map State manager
 */
Ext.define('Ck.map.plugin.ContextState', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.contextstate',
    
    ready: false,
    loaded: false,

	/**
	 * Init the map component, init the viewModel
	 * @protected
	 */
	init: function(ckMap) {
        this.map = ckMap;
        
        // Prevent save state on map loading with default extent
        this.map.on('beforestatesave', function() {
            return this.ready;
        }, this);

        // Restore state when map is ready & loaded (context loaded)
        this.map.getController().on({
            ready: function() {
                this.ready = true;
                ckMap.initState();
            },
            loaded: function() {
                this.loaded = true;
            },
            scope: this
        });
	},
	
	destroy: function(){
	},

	getState : function() {
        if(!this.ready) return;

        var v = this.map,
            map = v.getController(),
		    state = null;
			
		state = v.addPropertyToState(state, 'context', map.contextName);
        
		return state;
	},
	
    applyState: function (state) {
        if(!state) return;
        if(!this.ready) return;
        if(this.loaded) return;

		var v = this.map,
            map = v.getController(),
            contextName = state.context;

        delete state.context;

        if (contextName) {
            v.setContext(contextName);
        }
    }
    
});
