/**
 * Created by frichard on 12/03/2021.
 * Extension of the ExtJS filefield component:
 * * hide the fakepath displayed (use only the filename)
 * * manage an extension filter.
 */
Ext.define('Ck.form.field.File', {
    extend: 'Ext.form.field.File',
    alias: 'widget.ckfilefield',
    // use accept value https://www.w3schools.com/TAGS/att_input_accept.asp
    filterExtension: '', // by default accept all.

    /** On render, apply the filter extension if defined.
     */
    onRender: function () {
        var me = this,
        fileInputEl,
        name;

        me.callParent();
        fileInputEl = me.getTrigger('filebutton').component.fileInputEl.dom;
        if (me.filterExtension) {
            fileInputEl.setAttribute('accept', me.filterExtension);
        }
    },

    /** Overrides the default behaviour to clean the filepath.
     */
    onFileChange: function (button, e, value) {
        this.duringFileSelect = true;
        var cleanedValue = value;
        if (cleanedValue) {
            cleanedValue = cleanedValue.replace(/^.*\\/, ""); // keep only the filename.
        }
        Ext.form.field.File.superclass.setValue.call(this, cleanedValue);
        delete this.duringFileSelect;
    },
});
