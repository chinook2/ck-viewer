/**
 * Controller of toolbar overwrite. Need to resize and replace the toolbar due to ExtJS overlay issue
 *
 * @TODO Cleanly manage overflow
 */
Ext.define('Ck.toolbar.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.cktoolbar',

	init: function () {
		this.callParent(arguments);

		// OL Override
		// Check if not click on a button.
		// floating toolbar is in viewport to prevent problems with drawing tools
		// when pass hover? So need to check now if click on button or map !
		var olHandleMapBrowserEvent = ol.Map.prototype.handleMapBrowserEvent;
		ol.Map.prototype.handleMapBrowserEvent = function (mapBrowserEvent) {
			var t = mapBrowserEvent.originalEvent.target;
			if (t && t.className.indexOf('x-btn') != -1) return false;

			return olHandleMapBrowserEvent.call(this, mapBrowserEvent);
		};
		//
		//
	},

	ckReady: function() {
		var v = this.getView();
		v.offset = 10;

		// Move toolbar inside ol viewport
		// When drawing on map can move over the toolbar
		var domEl = this.getOlMap().getViewport();
		var panel = Ext.get(domEl.id);
		if(panel) panel.appendChild(v.getEl());
		//

		// Note: with Ext 5.x afterlayout seem to be ignored !

		// Fix add left margin for zoomslider + btn
		if(v.overlay === true && v.dock == 'top') {
			// workaround of post layout process
			//v.on('afterlayout', function() {
			v.el.setLeft(30);
			//	v.fireEvent("positionUpdated", v);
			//}, this);
		}

		// Fix right align of toolbar when overlay=true
		if(v.overlay === true && v.dock == 'right') {
			// workaround of post layout process
			v.on('afterlayout', function() {
				v.el.setLeft(null);
				v.el.setRight(6);


				var height = (v.items.length * 50); // + 10;
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

		// sometimes layout is already done.
		// need to call it first to init position
		Ext.Function.defer(this.updateOlControls, 100, this);
	},

	/*
	 *
	 */
	updateOlControls: function() {
		var v = this.getView();
		var size = v.getSize();

		// Fix add left margin for zoomslider + btn
		if(v.overlay === true && v.dock == 'top') {
			// workaround of post layout process
			//v.on('afterlayout', function() {
			v.el.setLeft(30);
			//	v.fireEvent("positionUpdated", v);
			//}, this);
		}
	}
});
