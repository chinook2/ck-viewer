/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */
Ext.define('ck.legend.Controller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.cklegend',
    
    listen: {
        controller: {
            'ckmap': {
                // 
                ckmapReady: 'onMapReady'
            }
        }
    },
    
    
    init: function() {
        var olMap = this.getMap();
        if(!(olMap instanceof ol.Map)) return;
        
        this.initTree();
    },
    
    onMapReady: function(ckmap) {
        this.getView().setMap( ckmap.getMap() );
        this.init();
    },
    
    getMap: function() {
        return this.getView().getMap();
    },
    
    initTree: function() {
        var me = this;
        var v = me.getView();
        var root = v.getRootNode();
        
        var olMap = me.getMap();
        var layers = olMap.getLayers();
        
        layers.forEach(function(layer){            
            var node = {
                leaf: true,
                text: layer.get('title'),
                checked: layer.get('visible'),
                layer: layer
            };
            var pNode = root;
            
            var path = layer.get('path')
            if(path) {
                var keys = path.split('/');
                var keyId = pKeyId = '';
                
                for(i=0; i<keys.length; i++) {
                    keyId += '_' + keys[i];
                    var isNode = root.findChild('id', keyId);
                    if(!isNode) {
                        pNode = pNode.appendChild({
                            text: keys[i],
                            id: keyId,
                            checked: false
                        }, true);
                    } else {
                        pNode = isNode;
                    }
                };
            }
            
            pNode.appendChild(node);
        });
        
        
        v.getStore().on('update', this.onUpdate);
        
        // olMap.on('addlayer', function() {
            // root.insertBefore(lyr, root); // Pour inserer le layer dans un dossier après
        // });
        
        this.fireEvent('cklegendReady', v);
    },
    
    // bind tree panel to ol map
    onUpdate: function(store, rec, operation, modifiedFieldNames, details, eOpts) {
        var layer = rec.get('layer');
        if(!layer) return;
        
        if(modifiedFieldNames=='checked') {
            layer.set('visible', rec.get('checked'));
        }
    }
});
