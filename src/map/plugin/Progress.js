/**
 * This is the layer loading element manager
 */
Ext.define('Ck.map.plugin.Progress', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.mapprogress',


	/**
	 * Init the map component, init the viewModel
	 * @protected
	 */
	init: function(ckMap) {
		this.map = ckMap;
		this.loaded = 0;
		this.loading = 0;
		this.el = this.createLoadElement();

		ckMap.getController().on("addLayer", this.addLoadListeners, this);
	},

	destroy: function(){
		this.el.remove();
	},

	/**
	 * Create the element that will be modified by update method
	 */
	createLoadElement: function() {
		var el = document.createElement("div");
		el.className = "ck-progress";
		document.body.appendChild(el);
		return el;
	},

	/**
	 * Add listeners to each layer (except vector)
	 * @param {ol.layer}
	 */
	addLoadListeners: function(layer) {
		if(!(layer instanceof ol.layer.Group)) {
			var olSource = layer.getSource();
			if(!olSource) return;
			
			// Add loading event
			if(typeof olSource.getImage == "function") {
				olSource.on('imageloadstart', this.addLoading, this);
				olSource.on('imageloadend', this.addLoaded, this);
				olSource.on('imageloaderror', this.addLoaded, this);
			}

			if(typeof olSource.getTile == "function") {
				olSource.on('tileloadstart', this.addLoading, this);
				olSource.on('tileloadend', this.addLoaded, this);
				olSource.on('tileloaderror', this.addLoaded, this);
			}
		}
	},

	/**
	 * Increment the count of loading tiles
	 */
	addLoading: function() {
		if (this.loading === 0) {
			this.map.getController().fireEvent("layersloading");
			this.show();
		}
		++this.loading;
		this.update();
	},

	/**
	 * Increment the count of loaded tiles
	 */
	addLoaded: function() {
		setTimeout(function() {
		++this.loaded;
		this.update();
		}.bind(this), 100);
	},


	/**
	 * Update the progress bar
	 */
	update: function() {
		var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
		this.el.style.width = width;
		if (this.loading === this.loaded) {
			this.loading = 0;
			this.loaded = 0;
			setTimeout(this.hide.bind(this), 500);
			this.map.getController().fireEvent("layersloaded");
		}
	},


	/**
	 * Show the progress bar
	 */
	show: function() {
		this.el.style.visibility = 'visible';
	},

	/**
	 * Hide the progress bar
	 */
	hide: function() {
		if (this.loading === this.loaded) {
			this.el.style.visibility = 'hidden';
			this.el.style.width = 0;
		}
	}
});
