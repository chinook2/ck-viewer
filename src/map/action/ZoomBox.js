/**
 * Created by FRI on 13/10/2016.
 *
 * Let user to zoom on a zone by drawing a box.
 *
 */
Ext.define('Ck.map.action.ZoomBox', {
    extend: 'Ck.Action',
    alias: "widget.ckmapZoomBox",

    text: '',
    iconCls: 'ckfont ck-zoom-box',
    tooltip: Ck.text('zoom_box'),
    toggleGroup: 'ckmapAction',

    /**
     * Active the
     */
    toggleAction: function(btn, pressed) {
        var me = this;
        var olMap = this.getMap().getOlMap();
        if (pressed) {
            this.btn = btn;
            if (!this.dragZoomInteraction) {
                var interactions = olMap.getInteractions();
                interactions.forEach(function(it) {
                    if (it instanceof ol.interaction.DragZoom) {
                        me.dragZoomInteraction = it;
                    }
                });
                if (!this.dragZoomInteraction) {
                    if (!Ext.isFunction(me.btn.additionalCondition)) {
                        me.btn.additionalCondition = function() {return true;};
                    }

                    this.dragZoomInteraction = new ol.interaction.DragZoom({
                        condition: function() {return me.btn.pressed && me.btn.additionalCondition();}
                    });
                    var previousDragZoomBoxEnd = this.dragZoomInteraction.onBoxEnd;
                    olMap.addInteraction(this.dragZoomInteraction);
                }
            }
            this.getMap().getView().addCls("ck-map-mouse-dragzoom");
        } else {
            this.getMap().getView().removeCls("ck-map-mouse-dragzoom");
        }
    }
});
