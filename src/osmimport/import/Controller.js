/**
 * ViewController used to manage the Import Panel of OSM Import.
 * @author Florent RICHARD
 */
Ext.define('Ck.osmimport.import.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckosmimportimport',
	/**
	 * Initialisation of components.
	 * @protected
	 */
	init: function() {
		this.control({
			"ckosmimportimport button#cancel": {
				click: this.cancel
			},
			"ckosmimportimport treepanel#osmtags-tree": {
				load: this.onTreeOsmTagsLoad,
				checkchange: this.onTreeOsmTagsChange
			}
		});
	},
		
	/**
	 * Hide the import panel
	 */
	cancel: function() {
		this.getView().openner.close();
	},
	
	/**
	 * Method launched once the tree store is loaded and displayed
	 * Adds a checkbox to each leaf in the tree used to display OSM Tags.
	 */
	onTreeOsmTagsLoad: function(tree) {
		tree.getRootNode().cascadeBy(function(node) {
			if (node.isLeaf()) {
				node.set("checked", false);
			}
		});
	},
	
	/**
	 * Method launched when a node in the OSM Tags Tree is checked or unchecked.
	 * - update the list of checked tags in the ViewModel.
	 */
	onTreeOsmTagsChange: function(node, checked) {
		var vm = this.getViewModel();
		var checkedTags = vm.data.checkedTags;
		var obj = {
			text: node.data.text,
			tag: node.data.tag
		};
		if (checked) {
			checkedTags.push(obj);
		} else {
			var index = -1;
			for (var i = 0; i < checkedTags.length; i++) {
				if (checkedTags[i].tag === obj.tag) {
					index = i;
				}
			}
			if (index > -1) {
				checkedTags.splice(index, 1);
			}
		}
		var textexpert = checkedTags.map(function(a) {return a.tag;}).join(";");
		this.lookupReference("tagsexpert").setValue(textexpert);
	}
});
