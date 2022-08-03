/**
 *
 */
Ext.define('Ck.Notify', {
	//alternateClassName: 'Ckn',
	singleton: true,

    requires: [
		'Ck'
	],
	
	align: 'tr',

	info: function(msg, e) {
		Ext.window.Toast({
			html: msg,
			align: this.align,
			hideDuration: 1500,
			slideInDuration: 400
		});
		Ck.log(msg);
		if(e && e.stack) Ck.log(e.stack);
	},

	error: function(msg, e) {
		var cfg = {
			html: msg,
			autoClose: false,
			closable: true,
			minHeight: 60,
			headerPosition: 'right',
			align: this.align,
			bodyStyle: {
				'color': 'red',
				'font-weight': 'bold'
			}
		};
		if(e) {
			cfg.tools = [{
			    type:'help',
			    tooltip: 'Show details',
			    callback: function(panel, tool, event) {
			        // show help here
			        this.eventDetails(e);
			    },
				scope: this
			}];
		}

		Ext.window.Toast(cfg);
		Ck.error(msg);
		if(e && e.stack) Ck.log(e.stack);
	},

	eventDetails: function (e) {
		if(e && e.stack) Ck.alert('Ck.Notify error details',  Ext.util.Format.nl2br(e.stack));
	},
    /**
     * Shows a simple toast on the middle top of the screen.
     * See the corresponding SCSS in all.scss
     */
    showToast: function(msg, mapView, additionalClass, timing) {
        var duration = timing || 3500;
        // Class x-panel-body-default is too ensure the CkFont is not applied
        var baseCls = 'cktoast cktoast-temp x-panel-body-default' + (additionalClass ? ' ' + additionalClass : '');
        var toast = document.createElement('div');
        toast.innerHTML = '<div class="cktoast-child">' + msg + '</div>';
        mapView.el.dom.appendChild(toast);
        toast.className = baseCls + ' show'; // Shows the toast
        Ext.defer(function() { // Hide the toast
            toast.className = baseCls;
            Ext.defer(function() { // Remove the toast
                mapView.el.dom.removeChild(toast);
            }, 1000);
        }, duration);
    },
    showFixedToast: function(msg, mapView, additionalClass, icon) {
        // Class x-panel-body-default is too ensure the CkFont is not applied
        var baseCls = 'cktoast cktoast-container cktoast-fixed x-panel-body-default' + (additionalClass ? ' ' + additionalClass : '');
        var toast = document.createElement('div');
        toast.innerHTML = '<div class="cktoast-child">' + (icon ? '<span class="'+ icon + '"></span>&nbsp;' : '' ) + msg + '</div>';
        toast.className = baseCls;
        mapView.el.dom.appendChild(toast);
        return toast;
    },
    hideFixedToast: function(toast, mapView) {
        if (mapView && mapView.el && mapView.el.dom) {
            mapView.el.dom.removeChild(toast);
        }
    }
});
