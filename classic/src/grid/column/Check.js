/**
 * Created by fri on 6 Jan 2022
 * Specific checkcolumn for Ck with no possibity to change the checked status of the column.
 */
Ext.define('Ck.grid.column.Check', {
	extend: 'Ext.grid.column.Check',
	alias: 'widget.ckcheckcolumn',
	listeners: {
		beforecheckchange: function() {
			return false;
		}
	}
});
