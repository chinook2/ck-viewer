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
	
	autoClose: false,
	
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
		this.toolbar = Ext.create('Ext.toolbar.Toolbar', {
			items: this.items,
			hidden: true,
			renderTo: mainToolbar.ownerCt.getEl(), // The map, the container of the mainToolbar (in general)
			cls: this.toolbarCls,
			width: (((w + 10) * this.items.length)) +'px',
			vertical: vertical,
			defaults: Ext.apply(this.defaults || {}, mainToolbar.defaults)
		});
		
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
		
		// Fix anchor of sub-toolbar when mainToolbar is right align and overlay=true
		mainToolbar.on('positionUpdated', function() {
			this.updatePosition();
		}, this);

		this.callParent(arguments);
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
	},
	
	updatePosition: function() {
		this.toolbar.getEl().anchorTo(this.getEl(), this.anchor, this.offsets);
	}	
});
