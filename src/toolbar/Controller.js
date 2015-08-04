/**
 * 
 */
Ext.define('Ck.toolbar.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cktoolbar',
	
	ckReady: function() {
		var v = this.getView();
		
		// Fix right align of toolbar when overlay=true
		if(v.overlay === true && v.dock == 'right') {
			// workaround of post layout process
			v.on('afterlayout', function() {
				v.el.setLeft(null);
				v.el.setRight(0);
				
				v.fireEvent("positionUpdated", v);
			}, this);
		}
		
		this.updateOlControls();
	},
	
	/*
	 *
	 */
	updateOlControls: function() {
		var v = this.getView();
		var size = v.getSize();
		
		// Move the ol zoom control.
		var zoom = Ext.query('.ol-zoom').shift();
		if(zoom) {
			if(v.dock == 'top') {
				Ext.get(zoom).setTop(size.height + 2);
			}
			
			if(v.dock == 'left') {
				Ext.get(zoom).setLeft(size.width + 0);
			}
			
		}
	}
});
