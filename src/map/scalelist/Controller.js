/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.map.ScaleList.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckmap.scalelist',
	
	/**
	 * @protected
	 * Load combo store and select the right value. Then add listeners
	 */
	ckLoaded: function() {
		var view = this.getView();
		
		// Re-render 
		if(view.isFloating()) {
			var flCfg = view.floatConfig;
			flCfg.alignTo = document.getElementsByClassName(flCfg.alignTo);
			flCfg.alignTo = flCfg.alignTo[flCfg.alignTo.length - 1];
			if(flCfg.alignTo) {
				view.show();
				if(!Ext.isArray(flCfg.alignOff)) {
					flCfg.alignOff = [-(view.getWidth() + 10), 0];
				}
				
				view.onAlignToScroll = Ext.emptyFn; // Hard fix (when scroll list)
				this.alignTo();
				this.getOlMap().on("change:size", this.alignTo, this);
			} else {
				Ck.log({
					msg: "Element of \"" + flCfg.alignTo + "\" doesn't exist. Scale list rendering impossible",
					level: "error"
				});
				return false;
			}
		}
		
		// Load scales
		view.setStore(this.getMap().getViewModel().getStore("scales"));
		this.getView().setValue(this.getOlView().getResolution());
		
		this.getOlView().on("change:resolution", this.mapResolutionChange, this);
		view.on("select", this.resolutionChange, this);
	},
	
	/**
	 * Align to a element using view.floatConfig
	 */
	alignTo: function() {
		var view = this.getView();
		var flCfg = view.floatConfig;
		view.alignTo(flCfg.alignTo, flCfg.alignPos, flCfg.alignOff);
	},
	
	mapResolutionChange: function(evt) {
		this.getView().setValue(evt.target.getResolution());
	},
	
	resolutionChange: function(cbx, rcd) {
		this.getOlView().setResolution(rcd.data.res);
	}
});
