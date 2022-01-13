/**
 * Created by fri on 12 Jan 2022
 * Specific column for color picker. Displays the text + the color.
 */
Ext.define('Ck.grid.column.Color', {
	extend: 'Ext.grid.column.Template',
	alias: 'widget.ckcolorcolumn',
	initComponent: function() {
		this.tpl = '<div class="ckcolumncolor" style="background-color: {' + this.dataIndex + '}"></div>{' + this.dataIndex + '}';
		this.callParent();
	}
});
