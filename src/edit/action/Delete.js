/**
 * Edit tool used to delete a feature
 */
Ext.define('Ck.edit.action.Delete', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditDelete',

	/**
	 * Default properties when this action is used through a button
	 */
	iconCls: 'ckfont ck-minus',
	tooltip: 'Delete feature',

	/**
	 * Ask confirmation to the user before remove
	 */
	deleteConfirmation: true,

	toggleAction: function(btn, status) {
		if(!this.used) {
			this.callParent([btn]);
		}
		
		// Force disable action when change tab or close window
		if (!this.initialized) {
			var win = btn.up('window');
			if (win) {
				win.on({
					hide: function () {
						btn.toggle(false);
					}
				});
			}
			this.initialized = true;
		}

		var source = this.getLayerSource();

		if(!this.delInteraction) {
			this.delInteraction = Ck.create("Ck.Selection", {
				layers			: [this.getLayer()],
				type			: "Point",
				callback		: this.onSelect,
				scope			: this,
				map				: this.getMap(),
				drawStyle		: null,
				selectId		: "ckmapEditDelete",
				overHighlight	: true,
				highlightStyle	: Ck.Style.deleteStyle,
				stackSelection	: true
			});
			this.interactions["delInteraction"] = this.delInteraction;
		}

		this.delInteraction.setActive(status);
	},

	/**
	 * When a feature is selected.
	 * @params {Object[]}
	 */
	onSelect: function(layers) {
		var feature;

		if(layers[0]) {
			var ft = layers[0].features;
			if(ft.length == 1) {
				feature = ft[0];
			}
		}

		if(!Ext.isEmpty(feature)) {

			if(this.deleteConfirmation) {
				Ext.Msg.show({
					title: "Edition",
					message: "Are you sure to delete this feature ?",
					buttons: Ext.Msg.YESNO,
					icon: Ext.Msg.QUESTION,
					scope: this,
					fn: function(btn) {
						if (btn === 'yes') {
							this.controller.deleteFeature(feature);
						}
						this.delInteraction.resetSelection();
					}
				});
			} else {
				this.controller.deleteFeature(feature);
				this.delInteraction.resetSelection();
			}
		}
	},

	/**
	 * Remove feature from source and launch featureremove edit controller event.
	 * @param {ol.Feature}
	 */
	removeFeature: function(feature) {
		this.delInteraction
		var source = this.getLayerSource();
		source.removeFeature(feature);
		this.controller.fireEvent("featureremove", feature);
	}
});
