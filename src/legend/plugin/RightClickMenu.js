/**
 * Define a right-click context menu on leaves in the legend.
 * Available menus:
 * - only for leaf = true
 * - zoom on extent (if extent is defined)
 * - delete layer (if noted as "removable")
 */
Ext.define('Ck.legend.plugin.RightClickMenu', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.legendrightclickmenu',
   
    init: function(cmp) {
        var me = this;
        this.cklegend = cmp.getController();
        this.cklegend.on("ready", function() {
            me.getCmp().getView().on('itemcontextmenu', function(view, rec, item, index, e, eOpts) {
                e.preventDefault(); // By default, no context menu
                if (rec && rec.get('leaf')) {
                    var lyr = rec.get('layer');
                    if (lyr) {
                        var menus = [];
                        if (lyr.get('extent')) {
                            menus.push({
                                text: Ck.text('zoom_on_layer'),
                                iconCls: 'ckfont ck-zoom',
                                handler: function() {
                                    me.cklegend.getMap().setExtent(lyr.get('extent'));
                                }
                            });
                        }
                        if (lyr.get('extension') && lyr.get('extension').removable === true) {
                             menus.push({
                                text: Ck.text('action_remove'),
                                iconCls: 'ckfont ck-remove',
                                handler: function() {
                                    me.cklegend.getMap().removeLayer(lyr);
                                }
                            });
                        }
                        if (menus.length > 0) {
                            var contextMenu = new Ext.menu.Menu({
                                items: menus
                            });
                            contextMenu.showAt(e.event.x, e.event.y);
                        }
                    }
                }
            });
        });
    }
});
