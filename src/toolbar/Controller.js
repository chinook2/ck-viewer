/**
 * Controller of toolbar overwrite. Need to resize and replace the toolbar due to ExtJS overlay issue
 *
 * @TODO Cleanly manage overflow
 */
Ext.define('Ck.toolbar.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cktoolbar',
	
	ckReady: function() {
		var v = this.getView();
		v.offset = 10;
		
		// Fix right align of toolbar when overlay=true
		if(v.overlay === true && v.dock == 'right') {
			// workaround of post layout process
			v.on('afterlayout', function() {
				v.el.setLeft(null);
				v.el.setRight(0);
				
				// get total Height (visible items)
				var height = 0;
				var items = v.items.each(function(it){
					if(it.isVisible()) height += it.getHeight() + 6;
				});

				/*
				var maxHeight = Ck.getMap().getOlMap().getSize()[1] - 80;
				// If toolbar taller than map
				if(height > (maxHeight)) {
					height = maxHeight;
				}
				
				childHeight = height - v.offset
				
				v.el.first().setHeight(childHeight.toString() + "px");
				v.setHeight(childHeight.toString() + "px");
				*/
				v.el.setHeight(height.toString() + "px");
				
				v.fireEvent("positionUpdated", v);
			}, this);
			
			/*
			v.on("overflowchange", function(lastHiddenCount, hiddenCount) {
				if(hiddenCount > 0) {
					this.offset = 60;
				} else {
					this.offset = 10;
				}
			}, v);*/
		}
		
		v.on('afterlayout', this.updateOlControls, this);
	},
	
	/*
	 *
	 */
	updateOlControls: function() {
		var v = this.getView();
		var size = v.getSize();
		
		// Move the ol zoom control if Toolbar is above OL controls
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
