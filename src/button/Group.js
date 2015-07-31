/**
 *
 */
 Ext.define('Ck.button.Group', {
	alias: 'widget.ckgroup',

	extend: 'Ext.button.Button',
	alternateClassName: 'Ck.GroupButton',

	autoClose: false,
	
	/**
	 * Point d'ancrage de la subtoolbar. Par défaut elle est alignée à gauche du bouton.
	 */
	anchor: "r-l",
	
	offsets: [0,0],
	
	items: [],
	
	/**
	 * Classe cls de la toolbar. Par défaut initialisée à "x-toolbar-eastbar"
	 */
	toolbarCls: "ck-toolbar ck-toolbar-group",
	
	collapsed: true,
	
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
			defaults: this.defaults || mainToolbar.defaults
		});
		
		if(this.autoClose === true) {
			this.toolbar.items.each(function(cmp, idx, len) {
				cmp.on("click", function() {
					this.collapse();				
				}, this);			
			}, this);
		}
		
		// Fix anchor of sub-toolbar when mainToolbar is right align and overlay=true
		mainToolbar.on('positionUpdated', function() {
			this.updatePosition();
		}, this);
		
		
		this.callParent();
	},
	
	
	handler: function(){
		if (this.collapsed){
			this.expand();
		}else{
			this.collapse();
		}
	},
	
	expand: function(){
		if (!this.collapsed) return;
		this.collapsed = false;
		// this.addCls("x-subtoolbar-active");
		this.toolbar.show();
		this.updatePosition();
	},
	
	collapse: function(){
		if (this.collapsed) return;
		this.collapsed = true;
		// this.removeCls("x-subtoolbar-active");
		this.toolbar.hide();
	},
	
	updatePosition: function() {
		this.toolbar.getEl().anchorTo(this.getEl(), this.anchor, this.offsets);
	}
	
});