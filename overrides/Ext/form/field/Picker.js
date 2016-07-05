/**
 * JMA 05/07/2016
 * Fix "datePicker" position
 */

Ext.define('Ext.overrides.form.field.Picker', {
	override: 'Ext.form.field.Picker',

	alignPicker: function() {
		if (!this.destroyed) {
			var picker = this.getPicker();

			if (picker.isVisible() && picker.isFloating()) {
				// Override / Hack
				// Sometimes picker x,y is outside body view and doAlign() with constrain rules fail !!
				// so init picker position with dateField input position and doAlign is happy ;)
				picker.setXY(this.getXY());
				//

				this.doAlign();
			}
		}
	}
});
