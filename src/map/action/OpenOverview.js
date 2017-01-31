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
		'Ck.Overview'
	],

	itemId: 'openoverview',
	text: '',

	iconCls: 'fa fa-eye',
	tooltip: 'Display overview',

	firstView: true,

	/**
	 * Create and display a windows with print form
	 */
	toggleAction: function(btn, pressed) {
		this.button = btn || {};

		if(!this.win) {
			this.ov = Ext.create({
				xtype: "ckoverview",
				ckview: this.getCkView().getView(),
				resolutions: this.button.resolutions,
				openner: this
			});

			this.win = Ext.create(this.classWindow, {
				resizable: false,
				modal: false,
				layout: 'fit',
				closeAction: 'hide',
				items: this.ov,
				header: {
					height: 20,
					cls: "ck-header-20"
				},
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
			if(this.firstView || this.ov.config.replaceEverytime) {
				this.win.alignTo(this.getMap().getOlMap().getViewport(), "tl", [50, 40]);
				this.firstView = false;
			}
		} else {
			this.win.hide();
		}

		// Auto close overview popup when CkView or CkMap is hidden or destroy
		this.getCkView().getView().on({
			hide: function () {
				this.close();
			},
			destroy: function () {
				this.close();
			},
			scope: this
		});

		this.getMap().getView().on({
			hide: function () {
				this.close();
			},
			destroy: function () {
				this.close();
			},
			scope: this
		});
	},

	close: function() {
		this.win.hide();
		this.button.setPressed(false);
	}
});
