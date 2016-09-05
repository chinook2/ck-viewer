if (!Ext.manifest.ckClient) {

        /**
         * Chinook Ck-Client (ck-viewer, ck-admin, ...) configuration properties.
         */
    Ext.manifest.ckClient = {
        /**
         * Prefix all Ajax request
         * "api": "${app.servicesUrl}"
         */
        "api": "/api/",

		/**
		 * Param for template Url in context
		 */
		"mapApi": "http://mem-ouganda:8090/geoserver",

        /**
         * Use LocalStorage to cache all Ajax request.
         */
        "ajaxCache": false,

        /**
         * Set package name to load static resource (default is application level)
         */
        "inlineResources": "packages/ck-viewer/resources/"
    };
}
