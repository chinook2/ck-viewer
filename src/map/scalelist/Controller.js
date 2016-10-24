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
			var el = flCfg.alignTo;
			el = document.getElementsByClassName(el);
			el = el[el.length - 1];
			if(el) {
				view.show();
				var off = flCfg.alignOff;
				if(!Ext.isArray(off)) {
					off = [-(view.getWidth() + 10), 0];
				}
				view.onAlignToScroll = Ext.emptyFn; // Hard fix (when scroll list)
				view.alignTo(el, flCfg.alignPos, off);
				
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
	
	mapResolutionChange: function(evt) {
		this.getView().setValue(evt.target.getResolution());
	},
	
	resolutionChange: function(cbx, rcd) {
		this.getOlView().setResolution(rcd.data.res);
	}
});
