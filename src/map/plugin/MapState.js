/**
 * This is the map State manager
 */
Ext.define('Ck.map.plugin.State', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.mapstate',
    
    loaded: false,

	/**
	 * Init the map component, init the viewModel
	 * @protected
	 */
	init: function(ckMap) {
        this.map = ckMap;
        
        // Prevent save state on map loading with default extent
        this.map.on('beforestatesave', function() {
            return this.loaded;
        }, this);

        // Restore state when map is ready & loaded (context loaded)
        this.map.getController().on({
            loaded: function() {
                this.loaded = true;
                ckMap.initState();
            },
            scope: this
        });
	},
	
	destroy: function(){
	},

	getState : function() {
        if(!this.loaded) return;

        var v = this.map,
            map = v.getController(),
		    state = null;
        
        state = v.addPropertyToState(state, 'center',  map.getCenter());
        state = v.addPropertyToState(state, 'zoom',  map.getZoom());
        
		return state;
	},
	
    applyState: function (state) {
        if(!state) return;
        if(!this.loaded) return;

		var v = this.map,
            map = v.getController(),
            center = state.center,
            zoom = state.zoom;

        delete state.center;
        delete state.zoom;

        if (center) {
            map.setCenter(center);
        }
        if (zoom) {
            map.setZoom(zoom);
        }
    }
    
});
