/**
 * This class is the view model for the Main view of the application.
 */
Ext.define('ck.map.Model', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.ckmap',

    data: {
        // view
        olview: {
            center: undefined,
            resolution: undefined,
            rotation: undefined,
            
            projection:  {
                code: undefined,
                units: undefined
            }
        },
        
        zoom: undefined,
        extent: undefined
    },

    formulas: {
        xmin: function(get){
            return get('extent')[0];
        },
        ymin: function(get){
            return get('extent')[1];
        },
        xmax: function(get){
            return get('extent')[2];
        },
        ymax: function(get){
            return get('extent')[3];
        },
        
        
        
        x: {
            get: function(get) {
                return Number(ol.coordinate.format(get('olview.center'), '{x}', this.getCoordPrecision()));
            },
            set: function(x) {
                this.set('center', [Number(x), this.get('y')]);
            }
        },
        y: {
            get: function(get) {
                return Number(ol.coordinate.format(get('olview.center'), '{y}', this.getCoordPrecision()));
            },
            set: function(y) {
                this.set('center', [this.get('x'), Number(y)]);
            }
        },
        
        scale: function(get){
            return this.getScale(get('olview.resolution'), get('olview.projection.units'));
        },

        
        center: {
            get: function(get) {
                return get('olview.center');
            },
            set: function(value) {
                this.getViewController().setCenter(value);
            }
        },
        
        resolution: {
            get: function(get) {
                return get('olview.resolution');
            },
            set: function(value) {
                this.getViewController().setResolution(value);
            }
        },
        
        rotation: {
            get: function(get) {
                return get('olview.rotation');
            },
            set: function(value) {
                this.getViewController().setRotation(value);
            }
        }        
    },
    
    stores: {
        scales: {
            fields: ['res', 'scale'],
            data: [
                {res: 1222.99245256282, scale: "1 / 4 367 821"},
                {res: 2445.98490512564, scale: "1 / 8 735 643"}
            ]
        }
    },
    
    
    
    getScale: function(res, unit) {
        var dpi = 25.4 / 0.28;
        var mpu = ol.proj.METERS_PER_UNIT[unit];
        return Math.round(res * mpu * 39.37 * dpi);
    },
    
    
    getViewController: function() {
        return this.getView().getController();
    },
    
    
    getCoordPrecision: function() {
        if(!this.coordPrecision) {
            this.coordPrecision = this.getView().getCoordPrecision();
        }
        return this.coordPrecision;
    }
});