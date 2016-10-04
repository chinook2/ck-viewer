/**
 * @class Ck.button.Group
 *
 * This class manage a button that can hide or shows a collection of button.
 * Buttons are disposed in a Ext Toolbar.
 */
 Ext.define('Ck.button.Group', {
	alias: 'widget.ckgroup',

	extend: 'Ext.button.Button',
	alternateClassName: 'Ck.GroupButton',

	enableToggle: true,

    /**
     * CLose the sub toolbar when click on button.
     * @type {Boolean}
     */
	autoClose: false,

    /**
     * Toggle off all the actions when close the toolbar.
     * Do not use with autoClose true.
     * @type {Boolean}
     */
    toggleOnClose: false,

	/**
	 * Anchor point of the toolbar.
	 */
	anchor: 'r-l',

	offsets: [0,0],

	items: [],

	cls: 'ck-group-button',

	/**
	 * @type Ext.toolbar.Toolbar
	 * Associate toolbar
	 */
	toolbar: null,

	/**
	 * Extra class for the sub toolbar
	 */
	toolbarCls: 'ck-toolbar ck-toolbar-group',

	onRender: function() {
		// The container of the group button
		var mainToolbar = this.ownerCt;
		var vertical;
		if(mainToolbar.dock == 'left') {
			this.anchor = 'l-r';
		}
		if(mainToolbar.dock == 'top') {
			vertical = true;
			this.anchor = 'tl-bl';
			this.offsets = [-8,0];
		}

		var w = this.getWidth();
        var ckview = this.up('ckview');
        if (ckview) {
            ckview.getController().on({
                mapready: function (ckmap) {
                    var domEl = ckmap.getOlMap().getViewport();
            		this.toolbar = Ext.create('Ext.toolbar.Toolbar', {
                        xtype: 'toolbar',
            			items: this.items,
            			hidden: true,
            			renderTo: mainToolbar.ownerCt.getEl(), // The map, the container of the mainToolbar (in general)
            			cls: this.toolbarCls,
            			width: (((w + 10) * this.items.length)) +'px',
            			vertical: vertical,
            			defaults: Ext.apply(this.defaults || mainToolbar.defaults || {}, {
                            ckview: ckview
                        })
            		});

                    // Move toolbar inside ol viewport
            		// When drawing on map can move over the toolbar
            		Ext.get(domEl.id).appendChild(this.toolbar.getEl());
            		//

            		if(this.autoClose === true) {
            			this.toolbar.items.each(function(cmp, idx, len) {
            				cmp.on('click', function() {
            					this.collapse();
            				}, this);
            			}, this);
            		}

            		// fix hide when multiple group button
            		this.toolbar.getEl().setVisibilityMode(Ext.Element.VISIBILITY);
            		//
            	},
                scope: this
            });
        }

		// Fix anchor of sub-toolbar when mainToolbar is right align and overlay=true
		mainToolbar.on('positionUpdated', function() {
			this.updatePosition();
		}, this);

		this.callParent();
	},

	beforeDestroy: function(){
		this.toolbar.destroy();
		this.callParent();
	},

	handler: function(btn) {
		if (btn.pressed) {
			this.expand();
		} else {
			this.collapse();
    	}
	},

	expand: function(){
		this.toolbar.show();

		// last fix for right align and overlay !
		var btns = Ext.query('.'+this.cls);
		for(b=0; b<btns.length; b++) {
			var btn = Ext.getCmp(btns[b].id);
			if(btn) btn.updatePosition();
		}
	},

	collapse: function(){
		this.toolbar.hide();
        if (this.toggleOnClose === true) {
            this.toolbar.items.each(function(cmp, idx, len) {
				if(cmp.toggle) cmp.toggle(false);
			}, this);
        }
    },

	updatePosition: function() {
		this.toolbar.getEl().anchorTo(this.getEl(), this.anchor, this.offsets);
	}
});
