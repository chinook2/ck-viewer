/*
 * JML 2014
 * Composant légende à base de Tree.
 * Ajout de cartouche pour la légende, de slider pour la transparence...
 */

Ext.define('Ext.ux.tree.checker', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.ux.checker',
	
	init: function(cmp) {
		cmp.on('checkchange', this.onCheckChange, this);
	},
	
	onCheckChange: function(node, isChecked){
		// Propagate change downwards (for all children of current node).
		if (node.hasChildNodes()) {
			node.eachChild(this.setChildrenCheckedStatus);
		}		

		// Propagate change upwards (if all siblings are the same, update parent).
		this.updateParentCheckedStatus(node);
	},
	
	/* private */
	setChildrenCheckedStatus: function (current) {
		if (current.parentNode) {
			var parent = current.parentNode;
			if(current.get('checked') !== null){
				current.set('checked', parent.get('checked'));
			}
		}
		
		if (current.hasChildNodes()) {
			current.eachChild(arguments.callee);
		}
	},
	
	updateParentCheckedStatus: function (current) {
		if (current.parentNode) {
			var parent = current.parentNode;
			
			var checkedCount = 0;
			parent.eachChild(function(n) {
				checkedCount += (n.get('checked') ? 1 : 0);
			});
			
			// Children have same value if all of them are checked or none is checked.
			// var sameValue = (checkedCount == parent.childNodes.length) || (checkedCount == 0);
			 var sameValue = (checkedCount > 0);
			if(parent.get('checked') !== null){
				// if (sameValue) {
					// var checkedValue = (checkedCount == parent.childNodes.length);
					// parent.set('checked', checkedValue);
				// } else {
					// // Not all of the children are checked, so uncheck the parent.
					// parent.set('checked', false);
				// }
				parent.set('checked', sameValue);
			}
			this.updateParentCheckedStatus(parent);
		}
	}
	
});



Ext.define('Ext.ux.tree.slider', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.ux.slider',
	
	init: function(cmp) {
		// this.preRenderer = this.renderer || this.defaultRenderer;
		// this.oScope = this.scope || window;
		
		// cmp.on('itemclick', this.onItemclick, this);
		// cmp.on('itemappend', this.onItemappend, this);
	}

	/*
	onItemclick: function(tree, record, item, index, e, eOpts ) {
		var i = item;
		
		this.slider = Ext.create('Ext.slider.Single', {
			width: 200,
			value: 50,
			increment: 10,
			minValue: 0,
			maxValue: 100,
			renderTo: item
		});	   
	}
	*/
});
