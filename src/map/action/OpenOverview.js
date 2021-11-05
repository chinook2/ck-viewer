/**
 * Basic action to zoom in the map (zoom level + 1).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomin"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.OpenOverview', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenOverview",

	toggleGroup: 'ckOverview',

	requires: [
		'Ck.Overview',
		'Ck.Window'
	],

	itemId: 'openoverview',
	text: '',

	iconCls: 'fa fa-eye',
	tooltip: Ck.text('open_overview'),
	
	config: {
		light: true,
		winClass: undefined
	},

	firstView: true,

	/**
	 * Create and display a windows with print form
	 */
	toggleAction: function(btn, pressed) {
		this.button = btn || {};

		if(!this.win) {
			this.ov = Ext.create({
				xtype: "ckoverview",
				ckview: this.button.up('ckview'),
				resolutions: this.button.resolutions,
				openner: this
			});

			var header = this.getLight() ? {height: 20,cls: "ck-header-20"} : undefined;
			this.win = Ext.create(this.getWinClass() ? this.getWinClass() : this.classWindow, {
				resizable: false,
				modal: false,
				layout: 'fit',
				closeAction: 'method-destroy',
				items: this.ov,
				bodyPadding: "0 0 0 0",
				parentMap: this.getMap(),
				header: header,
				listeners: {
					close: function() {
						this.close();
					},
					scope: this
				}
			});
		}

		if(pressed) {
			this.win.show();
			this.win.alignTo(this.button.up('ckview').down('ckmap').getController().getOlMap().getViewport(), "tl", [50, 40]);
		} else {
			this.win.close();
		}

		// Auto close overview popup when CkView or CkMap is hidden or destroy
		this.getCkView().getView().on({
			hide: function () {
				this.close();
			},
			destroy: function () {
				this.close(true);
			},
			scope: this
		});

		this.getMap().getView().on({
			hide: function () {
				this.close();
			},
			destroy: function () {
				this.close(true);
			},
			scope: this
		});
	},

	close: function(isDestroying) {
		if (this.win) {
			this.win.destroy();
			this.win = null;
			if(isDestroying!==true) this.button.setPressed(false);
		}
	}
});
