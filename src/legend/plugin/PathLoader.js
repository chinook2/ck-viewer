
Ext.define('ck.legend.plugin.PathLoader', {
	extend: 'Ext.plugin.Abstract',
	alias: 'plugin.treepathloader',

	init: function(cmp) {
		// cmp.on('beforeitemappend', this.onBeforeItemAppend, this);
		cmp.on('beforeiteminsert', this.onBeforeItemInsert, this);
	},
	
	onBeforeItemInsert: function(me, node, refNode) {
		var layer = node.getData();
		// if (!(layer instanceof ol.layer.Base)) return true;
		
		node.set('leaf', true);
		node.set('text', layer.get('title'));		
		node.set('checked', layer.get('visible'));
		
		var path = layer.get('path')
		if(!path) return true;
		
		var keys = path.split('/');
		var keyId = pKeyId = '';
		
		// alert(path);
		// keys.forEach(function(k){
		for(i=0; i<keys.length; i++) {
			keyId += '_' + keys[i];
			if(me.findChild('id', keyId)) continue;
			
			refNode = me.insertBefore({
				text: keys[i],
				id: keyId //,
				// parentId: pKeyId,
			}, refNode ,true);
			
			// pKeyId = keyId;
			
		};
		
		// node.set('parentId', keyId);
		// node.set('parentNode', root);
		
		return true;
	}
});