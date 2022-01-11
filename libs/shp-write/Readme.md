GitHub link: https://github.com/mapbox/shp-write

Added to Ck-viewer on January 2022.

The methods "download()" and "zip()" don't work. They are deprecated and/or use deprecated functions.

Only use the method "write()".
It:
- takes as input: attributes, geometry type, geometries and a callback
- the callback returns an object with shp, shx and dbf as DataView objects
- in addition, when saving you need to add a prj file with correct content to generate the corresponding projection
