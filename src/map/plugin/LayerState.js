/**
 * This is the map State manager
 */
Ext.define('Ck.map.plugin.LayerState', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.layerstate',
    
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
            
        var layers = [];
        map.getLayers().forEach(function(layer) {
            if (layer.getVisible()) {
                layers.push(layer.get('id'));
            }
        });
        	
        state = v.addPropertyToState(state, 'visibility', layers);
        state = v.addPropertyToState(state, 'visibilitycontext', map.contextName);
        
		return state;
	},
	
    applyState: function (state) {
        if(!state) return;
        if(!this.loaded) return;

		var v = this.map,
            map = v.getController(),
            contextName = state.visibilitycontext;
            visibility = state.visibility;

        delete state.visibility;
        delete state.visibilitycontext;
            
        // Ignore if we changed context
        if(map.contextName != contextName) return;

        if (Ext.isArray(visibility)) {
            map.getLayers().forEach(function(layer) {
                var visible = false;
                if (visibility.indexOf(layer.get('id')) != -1) visible = true;
                layer.setVisible(visible);
            });
        }
    }
    
});
