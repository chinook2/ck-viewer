﻿/**
 * Checkbox to manage layer visiblity
 */
Ext.define('Ck.legend.plugin.Checker', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.legendchecker',
	
	init: function(cmp) {
		this.treeView =  cmp.getView();
		
		cmp.on('checkchange', this.onCheckChange, this);
		
		//
		cmp.getController().on('ready', function(treeController) {
			treeController.getView().getChecked().forEach(function(node){
				this.onCheckChange(node);
			}, this);
		}, this);
	},
	
	/**
	 * Method called when checkbox status change
	 * @params {Ext.data.NodeStore}
	 * @params {Boolean}
	 */
	onCheckChange: function(node, isChecked){
		node.set('cls', null);

		// Propagate change downwards (for all children of current node).
		if (node.hasChildNodes()) {
			node.eachChild(this.setChildrenCheckedStatus);
		}		

		// Propagate change upwards (if all siblings are the same, update parent).
		this.updateParentCheckedStatus(node);
	},
	
	/**
	 * @params {Ext.data.NodeStore}
	 */
	setChildrenCheckedStatus: function (current) {
		if (current.parentNode) {
			var parent = current.parentNode;
			if(parent.get('checked') !== null){
				current.set('checked', parent.get('checked'));
			}
		}
		
		if (current.hasChildNodes()) {
			current.eachChild(arguments.callee);
		}
	},
	
	/**
	 * Update parent checkbox status. Called recursively
	 * @params {Ext.data.NodeStore}
	 */
	updateParentCheckedStatus: function (current) {
		if (current.parentNode) {
			var parent = current.parentNode;
			
			var checkedCount = 0;
			parent.eachChild(function(n) {
				checkedCount += (n.get('checked') ? 1 : 0);
			});
			
			// Children have same value if all of them are checked or none is checked.
			var sameValue = (checkedCount == parent.childNodes.length) || (checkedCount == 0);
			if(parent.get('checked') !== null){
				if(sameValue) {
					var checkedValue = (checkedCount == parent.childNodes.length);
					parent.set('checked', checkedValue);
					
					parent.set('cls', '');
				} else {
					// Not all of the children are checked, so partiel check the parent 'tri-state'.
					parent.set('checked', true);
					parent.set('cls', 'x-tree-checkbox-tristate');
				}
			}
			this.updateParentCheckedStatus(parent);
		}
	}
	
});