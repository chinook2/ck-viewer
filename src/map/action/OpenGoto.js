/**
 *
 */
Ext.define('Ck.map.action.OpenGoto', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenGoto",

	requires: ['Ck.Goto'],

	itemId: 'opengoto',
	iconCls: 'ckfont ck-crosshairs',
	tooltip: Ck.text('goto_open'),

	config: {
		/**
		 * Width of window
		 * @prop {Integer}
		 */
		winWidth: 400,

		/**
		 * Height of window
		 * @prop {Integer}
		 */
		winHeight: 200,

		/**
		 * Title of window
		 * @prop {Integer}
		 */
		winTitle: Ck.text('goto_wintitle'),

		/**
		 * Set if window is collapsible
		 * @prop {Boolean}
		 */
		winCollapsible: true,

		/**
		 * Config passed to goto component
		 * @prop {Object}
		 */
		gotoConfig: {},

		/**
		 * To empty fields on window show
		 * @prop {Boolean}
		 */
		clearCoordinates: false
	},

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		this.button = btn || {};

		if(this.getGotoConfig().clearCoordinates != null) {
			this.setClearCoordinates(this.getGotoConfig().clearCoordinates);
		}

		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: this.getWinTitle(),
				width: this.getWinWidth(),
				height: this.getWinHeight(),
				autoHeight: true,
				modal: false,
				layout: 'fit',
				closeAction: 'hide',
				collapsible: this.getWinCollapsible(),
				parentMap: this.getMap(),
				items: {
					xtype: 'ckgoto',
					ckview: this.getCkView().getView(),
					openner: this,
					gotoConfig: this.getGotoConfig()
				}
			});
		}

		if(this.win.isVisible()) {
			this.win.hide();
		} else {
			this.win.show();
			if (this.getGotoConfig().clearCoordinates === true) {
				this.win.down('ckgoto').getController().clearCoordinates();
			}
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
		this.win.hide();
		if(isDestroying!==true) this.button.setPressed(false);
	}
});
