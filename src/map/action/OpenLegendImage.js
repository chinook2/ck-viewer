/**
 *
 */
Ext.define('Ck.map.action.OpenLegendImage', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenLegendImg",

	iconCls: 'fa fa-list-ul',
	tooltip: 'Open Legend',
	
	toggleGroup: 'ckLegendImage',

	requires: [
		'Ck.Window'
	],
	firstView: true,
	config: {
		/**
		 * Width of window
		 * @prop {Integer}
		 */
		winWidth: 250,

		/**
		 * Height of window
		 * @prop {Integer}
		 */
		winHeight: 400,

		/**
		 * Title of window
		 * @prop {Integer}
		 */
		winTitle: 'Legend',
		imgSrc: null,
		imgPackage: null,
		imgHeight: null,
		imgWidth: null
	},

	/**
	 * Create and display a windows with print form
	 */
	toggleAction: function(btn, pressed) {
		this.button = btn || {};

		if(!this.win) {
			var imgSrcTpl = new Ext.Template(this.getImgSrc()); // Allow to use template text in img path
			var imgSrc = Ck.getPath(this.getImgPackage()) + imgSrcTpl.apply(Ext.manifest.ckClient);
			this.win = Ext.create(this.classWindow, {
				title: this.getWinTitle(),
				height: this.getWinHeight(),
				scrollable: 'y',
				resizable: false,
				modal: false,
				layout: 'vbox',
				closeAction: 'hide',
				parentMap: this.getMap(),
				items: [{
					xtype:"container",
					layout:'fit',
					scrollable: 'y',
					bodyPadding: 20,
					items: [{
						xtype: 'image',
						src:imgSrc,
						width: this.getImgWidth(),
						height: this.getImgHeight()
					}]
				}],
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
			if(this.firstView) {
				this.win.alignTo(this.getMap().getOlMap().getViewport(), "tr", [-40 -this.getWinWidth(), 40]);
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
