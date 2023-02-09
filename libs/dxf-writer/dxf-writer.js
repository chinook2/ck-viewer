var __defProp = Object.defineProperty;
var __publicField = (obj, key, value) => {
  if (typeof key !== "symbol")
    key += "";
  if (key in obj)
    return __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value});
  return obj[key] = value;
};
const Handle2 = class {
  static next() {
    return (++Handle2.seed).toString(16).toUpperCase();
  }
  static peek() {
    return (Handle2.seed + 1).toString(16).toUpperCase();
  }
};
let Handle = Handle2;
__publicField(Handle, "seed", 0);
var Handle_1 = Handle;
class DatabaseObject {
  constructor(subclass = null) {
    this.handle = Handle_1.next();
    this.ownerObjectHandle = "0";
    this.subclassMarkers = [];
    if (subclass) {
      if (Array.isArray(subclass)) {
        this.subclassMarkers.push(...subclass);
      } else {
        this.subclassMarkers.push(subclass);
      }
    }
  }
  tags(manager) {
    manager.push(5, this.handle);
    manager.push(330, this.ownerObjectHandle);
    for (const s of this.subclassMarkers) {
      manager.push(100, s);
    }
  }
}
var DatabaseObject_1 = DatabaseObject;
class LineType extends DatabaseObject_1 {
  constructor(name, description, elements) {
    super(["AcDbSymbolTableRecord", "AcDbLinetypeTableRecord"]);
    this.name = name;
    this.description = description;
    this.elements = elements;
  }
  tags(manager) {
    manager.push(0, "LTYPE");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(3, this.description);
    manager.push(70, 0);
    manager.push(72, 65);
    manager.push(73, this.elements.length);
    manager.push(40, this.getElementsSum());
    this.elements.forEach((element) => {
      manager.push(49, element);
      manager.push(74, 0);
    });
  }
  getElementsSum() {
    return this.elements.reduce((sum, element) => {
      return sum + Math.abs(element);
    }, 0);
  }
}
var LineType_1 = LineType;
class Layer extends DatabaseObject_1 {
  constructor(name, colorNumber, lineTypeName = null) {
    super(["AcDbSymbolTableRecord", "AcDbLayerTableRecord"]);
    this.name = name;
    this.colorNumber = colorNumber;
    this.lineTypeName = lineTypeName;
    this.shapes = [];
    this.trueColor = -1;
  }
  tags(manager) {
    manager.push(0, "LAYER");
    super.tags(manager);
    manager.push(2, this.name);
    if (this.trueColor !== -1)
      manager.push(420, this.trueColor);
    else
      manager.push(62, this.colorNumber);
    manager.push(70, 0);
    if (this.lineTypeName)
      manager.push(6, this.lineTypeName);
    manager.push(390, 1);
  }
  setTrueColor(color) {
    this.trueColor = color;
  }
  addShape(shape) {
    this.shapes.push(shape);
    shape.layer = this;
  }
  getShapes() {
    return this.shapes;
  }
  shapesTags(space, manager) {
    for (const shape of this.shapes) {
      shape.ownerObjectHandle = space.handle;
      shape.tags(manager);
    }
  }
}
var Layer_1 = Layer;
class Table extends DatabaseObject_1 {
  constructor(name) {
    super("AcDbSymbolTable");
    this.name = name;
    this.elements = [];
  }
  add(element) {
    element.ownerObjectHandle = this.handle;
    this.elements.push(element);
  }
  tags(manager) {
    manager.push(0, "TABLE");
    manager.push(2, this.name);
    super.tags(manager);
    manager.push(70, this.elements.length);
    this.elements.forEach((element) => {
      element.tags(manager);
    });
    manager.push(0, "ENDTAB");
  }
}
var Table_1 = Table;
class DimStyleTable extends Table_1 {
  constructor(name) {
    super(name);
    this.subclassMarkers.push("AcDbDimStyleTable");
  }
  tags(manager) {
    manager.push(0, "TABLE");
    manager.push(2, this.name);
    DatabaseObject_1.prototype.tags.call(this, manager);
    manager.push(70, this.elements.length);
    manager.push(71, 1);
    for (const e of this.elements) {
      e.tags(manager);
    }
    manager.push(0, "ENDTAB");
  }
}
var DimStyleTable_1 = DimStyleTable;
class TextStyle extends DatabaseObject_1 {
  constructor(name) {
    super(["AcDbSymbolTableRecord", "AcDbTextStyleTableRecord"]);
    __publicField(this, "fontFileName", "txt");
    this.name = name;
  }
  tags(manager) {
    manager.push(0, "STYLE");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(70, 0);
    manager.push(40, 0);
    manager.push(41, 1);
    manager.push(50, 0);
    manager.push(71, 0);
    manager.push(42, 1);
    manager.push(3, this.fontFileName);
    manager.push(4, "");
  }
}
var TextStyle_1 = TextStyle;
class Viewport extends DatabaseObject_1 {
  constructor(name, height) {
    super(["AcDbSymbolTableRecord", "AcDbViewportTableRecord"]);
    this.name = name;
    this.height = height;
  }
  tags(manager) {
    manager.push(0, "VPORT");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(40, this.height);
    manager.push(70, 0);
  }
}
var Viewport_1 = Viewport;
class AppId extends DatabaseObject_1 {
  constructor(name) {
    super(["AcDbSymbolTableRecord", "AcDbRegAppTableRecord"]);
    this.name = name;
  }
  tags(manager) {
    manager.push(0, "APPID");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(70, 0);
  }
}
var AppId_1 = AppId;
class Block extends DatabaseObject_1 {
  constructor(name) {
    super(["AcDbEntity", "AcDbBlockBegin"]);
    this.name = name;
    this.end = new DatabaseObject_1(["AcDbEntity", "AcDbBlockEnd"]);
    this.recordHandle = null;
  }
  tags(manager) {
    manager.push(0, "BLOCK");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(70, 0);
    manager.point(0, 0);
    manager.push(3, this.name);
    manager.push(1, "");
    manager.push(0, "ENDBLK");
    this.end.tags(manager);
  }
}
var Block_1 = Block;
class BlockRecord extends DatabaseObject_1 {
  constructor(name) {
    super(["AcDbSymbolTableRecord", "AcDbBlockTableRecord"]);
    this.name = name;
  }
  tags(manager) {
    manager.push(0, "BLOCK_RECORD");
    super.tags(manager);
    manager.push(2, this.name);
    manager.push(70, 0);
    manager.push(280, 0);
    manager.push(281, 1);
  }
}
var BlockRecord_1 = BlockRecord;
class Dictionary extends DatabaseObject_1 {
  constructor() {
    super("AcDbDictionary");
    this.children = {};
  }
  addChildDictionary(name, dictionary) {
    dictionary.ownerObjectHandle = this.handle;
    this.children[name] = dictionary;
  }
  tags(manager) {
    manager.push(0, "DICTIONARY");
    super.tags(manager);
    manager.push(281, 1);
    const entries = Object.entries(this.children);
    for (const entry of entries) {
      const [name, dic] = entry;
      manager.push(3, name);
      manager.push(350, dic.handle);
    }
    const children = Object.values(this.children);
    for (const c of children) {
      c.tags(manager);
    }
  }
}
var Dictionary_1 = Dictionary;
class Line extends DatabaseObject_1 {
  constructor(x1, y1, x2, y2) {
    super(["AcDbEntity", "AcDbLine"]);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
  tags(manager) {
    manager.push(0, "LINE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x1, this.y1);
    manager.push(11, this.x2);
    manager.push(21, this.y2);
    manager.push(31, 0);
  }
}
var Line_1 = Line;
class Line3d extends DatabaseObject_1 {
  constructor(x1, y1, z1, x2, y2, z2) {
    super(["AcDbEntity", "AcDbLine"]);
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.x2 = x2;
    this.y2 = y2;
    this.z2 = z2;
  }
  tags(manager) {
    manager.push(0, "LINE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x1, this.y1, this.z1);
    manager.push(11, this.x2);
    manager.push(21, this.y2);
    manager.push(31, this.z2);
  }
}
var Line3d_1 = Line3d;
class Arc extends DatabaseObject_1 {
  constructor(x, y, r, startAngle, endAngle) {
    super(["AcDbEntity", "AcDbCircle"]);
    this.x = x;
    this.y = y;
    this.r = r;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }
  tags(manager) {
    manager.push(0, "ARC");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y);
    manager.push(40, this.r);
    manager.push(100, "AcDbArc");
    manager.push(50, this.startAngle);
    manager.push(51, this.endAngle);
  }
}
var Arc_1 = Arc;
class Circle extends DatabaseObject_1 {
  constructor(x, y, r) {
    super(["AcDbEntity", "AcDbCircle"]);
    this.x = x;
    this.y = y;
    this.r = r;
  }
  tags(manager) {
    manager.push(0, "CIRCLE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y);
    manager.push(40, this.r);
  }
}
var Circle_1 = Circle;
class Cylinder extends DatabaseObject_1 {
  constructor(x, y, z, r, thickness, extrusionDirectionX, extrusionDirectionY, extrusionDirectionZ) {
    super(["AcDbEntity", "AcDbCircle"]);
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
    this.thickness = thickness;
    this.extrusionDirectionX = extrusionDirectionX, this.extrusionDirectionY = extrusionDirectionY, this.extrusionDirectionZ = extrusionDirectionZ;
  }
  tags(manager) {
    manager.push(0, "CIRCLE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y, this.z);
    manager.push(40, this.r);
    manager.push(39, this.thickness);
    manager.push(210, this.extrusionDirectionX);
    manager.push(220, this.extrusionDirectionY);
    manager.push(230, this.extrusionDirectionZ);
  }
}
var Cylinder_1 = Cylinder;
const H_ALIGN_CODES = ["left", "center", "right"];
const V_ALIGN_CODES = ["baseline", "bottom", "middle", "top"];
class Text extends DatabaseObject_1 {
  constructor(x, y, height, rotation, value, horizontalAlignment = "left", verticalAlignment = "baseline") {
    super(["AcDbEntity", "AcDbText"]);
    this.x = x;
    this.y = y;
    this.height = height;
    this.rotation = rotation;
    this.value = value;
    this.hAlign = horizontalAlignment;
    this.vAlign = verticalAlignment;
  }
  tags(manager) {
    manager.push(0, "TEXT");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y);
    manager.push(40, this.height);
    manager.push(1, this.value);
    manager.push(50, this.rotation);
    if (H_ALIGN_CODES.includes(this.hAlign, 1) || V_ALIGN_CODES.includes(this.vAlign, 1)) {
      manager.push(72, Math.max(H_ALIGN_CODES.indexOf(this.hAlign), 0));
      manager.push(11, this.x);
      manager.push(21, this.y);
      manager.push(31, 0);
      manager.push(100, "AcDbText");
      manager.push(73, Math.max(V_ALIGN_CODES.indexOf(this.vAlign), 0));
    } else {
      manager.push(100, "AcDbText");
    }
  }
}
var Text_1 = Text;
class Polyline extends DatabaseObject_1 {
  constructor(points, closed = false, startWidth = 0, endWidth = 0) {
    super(["AcDbEntity", "AcDbPolyline"]);
    this.points = points;
    this.closed = closed;
    this.startWidth = startWidth;
    this.endWidth = endWidth;
  }
  tags(manager) {
    manager.push(0, "LWPOLYLINE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.push(6, "ByLayer");
    manager.push(62, 256);
    manager.push(370, -1);
    manager.push(90, this.points.length);
    manager.push(70, this.closed ? 1 : 0);
    this.points.forEach((point) => {
      const [x, y, z] = point;
      manager.push(10, x);
      manager.push(20, y);
      if (this.startWidth !== 0 || this.endWidth !== 0) {
        manager.push(40, this.startWidth);
        manager.push(41, this.endWidth);
      }
      if (z !== void 0)
        manager.push(42, z);
    });
  }
}
var Polyline_1 = Polyline;
class Vertex extends DatabaseObject_1 {
  constructor(x, y, z) {
    super(["AcDbEntity", "AcDbVertex", "AcDb3dPolylineVertex"]);
    this.x = x;
    this.y = y;
    this.z = z;
  }
  tags(manager) {
    manager.push(0, "VERTEX");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y, this.z);
    manager.push(70, 32);
  }
}
var Vertex_1 = Vertex;
class Polyline3d extends DatabaseObject_1 {
  constructor(points) {
    super(["AcDbEntity", "AcDb3dPolyline"]);
    this.verticies = points.map((point) => {
      const [x, y, z] = point;
      const vertex = new Vertex_1(x, y, z);
      vertex.ownerObjectHandle = this.handle;
      return vertex;
    });
    this.seqendHandle = Handle_1.next();
  }
  tags(manager) {
    manager.push(0, "POLYLINE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.push(66, 1);
    manager.push(70, 0);
    manager.point(0, 0);
    this.verticies.forEach((vertex) => {
      vertex.layer = this.layer;
      vertex.tags(manager);
    });
    manager.push(0, "SEQEND");
    manager.push(5, this.seqendHandle);
    manager.push(100, "AcDbEntity");
    manager.push(8, this.layer.name);
  }
}
var Polyline3d_1 = Polyline3d;
class Face extends DatabaseObject_1 {
  constructor(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
    super(["AcDbEntity", "AcDbFace"]);
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.x2 = x2;
    this.y2 = y2;
    this.z2 = z2;
    this.x3 = x3;
    this.y3 = y3;
    this.z3 = z3;
    this.x4 = x4;
    this.y4 = y4;
    this.z4 = z4;
  }
  tags(manager) {
    manager.push(0, "3DFACE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x1, this.y1, this.z1);
    manager.push(11, this.x2);
    manager.push(21, this.y2);
    manager.push(31, this.z2);
    manager.push(12, this.x3);
    manager.push(22, this.y3);
    manager.push(32, this.z3);
    manager.push(13, this.x4);
    manager.push(23, this.y4);
    manager.push(33, this.z4);
  }
}
var Face_1 = Face;
class Point extends DatabaseObject_1 {
  constructor(x, y) {
    super(["AcDbEntity", "AcDbPoint"]);
    this.x = x;
    this.y = y;
  }
  tags(manager) {
    manager.push(0, "POINT");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y);
  }
}
var Point_1 = Point;
class Spline extends DatabaseObject_1 {
  constructor(controlPoints, degree = 3, knots = null, weights = null, fitPoints = []) {
    super(["AcDbEntity", "AcDbSpline"]);
    if (controlPoints.length < degree + 1) {
      throw new Error(`For degree ${degree} spline, expected at least ${degree + 1} control points, but received only ${controlPoints.length}`);
    }
    if (knots == null) {
      knots = [];
      for (let i = 0; i < degree + 1; i++) {
        knots.push(0);
      }
      for (let i = 1; i < controlPoints.length - degree; i++) {
        knots.push(i);
      }
      for (let i = 0; i < degree + 1; i++) {
        knots.push(controlPoints.length - degree);
      }
    }
    if (knots.length !== controlPoints.length + degree + 1) {
      throw new Error(`Invalid knot vector length. Expected ${controlPoints.length + degree + 1} but received ${knots.length}.`);
    }
    this.controlPoints = controlPoints;
    this.knots = knots;
    this.fitPoints = fitPoints;
    this.degree = degree;
    this.weights = weights;
    const closed = 0;
    const periodic = 0;
    const rational = this.weights ? 1 : 0;
    const planar = 1;
    const linear = 0;
    this.type = closed * 1 + periodic * 2 + rational * 4 + planar * 8 + linear * 16;
  }
  tags(manager) {
    manager.push(0, "SPLINE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.push(210, 0);
    manager.push(220, 0);
    manager.push(230, 1);
    manager.push(70, this.type);
    manager.push(71, this.degree);
    manager.push(72, this.knots.length);
    manager.push(73, this.controlPoints.length);
    manager.push(74, this.fitPoints.length);
    manager.push(42, 1e-7);
    manager.push(43, 1e-7);
    manager.push(44, 1e-10);
    this.knots.forEach((knot) => {
      manager.push(40, knot);
    });
    if (this.weights) {
      this.weights.forEach((weight) => {
        manager.push(41, weight);
      });
    }
    this.controlPoints.forEach((point) => {
      manager.point(point[0], point[1]);
    });
  }
}
var Spline_1 = Spline;
class Ellipse extends DatabaseObject_1 {
  constructor(x, y, majorAxisX, majorAxisY, axisRatio, startAngle, endAngle) {
    super(["AcDbEntity", "AcDbEllipse"]);
    this.x = x;
    this.y = y;
    this.majorAxisX = majorAxisX;
    this.majorAxisY = majorAxisY;
    this.axisRatio = axisRatio;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }
  tags(manager) {
    manager.push(0, "ELLIPSE");
    super.tags(manager);
    manager.push(8, this.layer.name);
    manager.point(this.x, this.y);
    manager.push(11, this.majorAxisX);
    manager.push(21, this.majorAxisY);
    manager.push(31, 0);
    manager.push(40, this.axisRatio);
    manager.push(41, this.startAngle);
    manager.push(42, this.endAngle);
  }
}
var Ellipse_1 = Ellipse;
class TagsManager {
  constructor() {
    this.lines = [];
  }
  point(x, y, z = 0) {
    this.push(10, x);
    this.push(20, y);
    this.push(30, z);
  }
  start(name) {
    this.push(0, "SECTION");
    this.push(2, name);
  }
  end() {
    this.push(0, "ENDSEC");
  }
  addHeaderVariable(name, tagsElements) {
    this.push(9, `$${name}`);
    tagsElements.forEach((tagElement) => {
      this.push(tagElement[0], tagElement[1]);
    });
  }
  push(code, value) {
    this.lines.push(code, value);
  }
  toDxfString() {
    return this.lines.join("\n");
  }
}
var TagsManager_1 = TagsManager;
class Drawing {
  constructor() {
    this.layers = {};
    this.activeLayer = null;
    this.lineTypes = {};
    this.headers = {};
    this.tables = {};
    this.blocks = {};
    this.dictionary = new Dictionary_1();
    this.setUnits("Unitless");
    for (const ltype of Drawing.LINE_TYPES) {
      this.addLineType(ltype.name, ltype.description, ltype.elements);
    }
    for (const l of Drawing.LAYERS) {
      this.addLayer(l.name, l.colorNumber, l.lineTypeName);
    }
    this.setActiveLayer("0");
    this.generateAutocadExtras();
  }
  addLineType(name, description, elements) {
    this.lineTypes[name] = new LineType_1(name, description, elements);
    return this;
  }
  addLayer(name, colorNumber, lineTypeName) {
    this.layers[name] = new Layer_1(name, colorNumber, lineTypeName);
    return this;
  }
  setActiveLayer(name) {
    this.activeLayer = this.layers[name];
    return this;
  }
  addTable(name) {
    const table = new Table_1(name);
    this.tables[name] = table;
    return table;
  }
  addBlock(name) {
    const block = new Block_1(name);
    this.blocks[name] = block;
    return block;
  }
  drawLine(x1, y1, x2, y2) {
    this.activeLayer.addShape(new Line_1(x1, y1, x2, y2));
    return this;
  }
  drawLine3d(x1, y1, z1, x2, y2, z2) {
    this.activeLayer.addShape(new Line3d_1(x1, y1, z1, x2, y2, z2));
    return this;
  }
  drawPoint(x, y) {
    this.activeLayer.addShape(new Point_1(x, y));
    return this;
  }
  drawRect(x1, y1, x2, y2, cornerLength, cornerBulge) {
    const w = x2 - x1;
    const h = y2 - y1;
    cornerBulge = cornerBulge || 0;
    let p = null;
    if (!cornerLength) {
      p = new Polyline_1([
        [x1, y1],
        [x1, y1 + h],
        [x1 + w, y1 + h],
        [x1 + w, y1]
      ], true);
    } else {
      p = new Polyline_1([
        [x1 + w - cornerLength, y1, cornerBulge],
        [x1 + w, y1 + cornerLength],
        [x1 + w, y1 + h - cornerLength, cornerBulge],
        [x1 + w - cornerLength, y1 + h],
        [x1 + cornerLength, y1 + h, cornerBulge],
        [x1, y1 + h - cornerLength],
        [x1, y1 + cornerLength, cornerBulge],
        [x1 + cornerLength, y1]
      ], true);
    }
    this.activeLayer.addShape(p);
    return this;
  }
  drawPolygon(x, y, numberOfSides, radius, rotation = 0, circumscribed = false) {
    const angle = 2 * Math.PI / numberOfSides;
    const vertices = [];
    let d = radius;
    const rotationRad = rotation * Math.PI / 180;
    if (circumscribed)
      d = radius / Math.cos(Math.PI / numberOfSides);
    for (let i = 0; i < numberOfSides; i++) {
      vertices.push([
        x + d * Math.sin(rotationRad + i * angle),
        y + d * Math.cos(rotationRad + i * angle)
      ]);
    }
    this.activeLayer.addShape(new Polyline_1(vertices, true));
    return this;
  }
  drawArc(x1, y1, r, startAngle, endAngle) {
    this.activeLayer.addShape(new Arc_1(x1, y1, r, startAngle, endAngle));
    return this;
  }
  drawCircle(x1, y1, r) {
    this.activeLayer.addShape(new Circle_1(x1, y1, r));
    return this;
  }
  drawCylinder(x1, y1, z1, r, thickness, extrusionDirectionX, extrusionDirectionY, extrusionDirectionZ) {
    this.activeLayer.addShape(new Cylinder_1(x1, y1, z1, r, thickness, extrusionDirectionX, extrusionDirectionY, extrusionDirectionZ));
    return this;
  }
  drawText(x1, y1, height, rotation, value, horizontalAlignment = "left", verticalAlignment = "baseline") {
    this.activeLayer.addShape(new Text_1(x1, y1, height, rotation, value, horizontalAlignment, verticalAlignment));
    return this;
  }
  drawPolyline(points, closed = false, startWidth = 0, endWidth = 0) {
    this.activeLayer.addShape(new Polyline_1(points, closed, startWidth, endWidth));
    return this;
  }
  drawPolyline3d(points) {
    points.forEach((point) => {
      if (point.length !== 3) {
        throw "Require 3D coordinates";
      }
    });
    this.activeLayer.addShape(new Polyline3d_1(points));
    return this;
  }
  setTrueColor(trueColor) {
    this.activeLayer.setTrueColor(trueColor);
    return this;
  }
  drawSpline(controlPoints, degree = 3, knots = null, weights = null, fitPoints = []) {
    this.activeLayer.addShape(new Spline_1(controlPoints, degree, knots, weights, fitPoints));
    return this;
  }
  drawEllipse(x1, y1, majorAxisX, majorAxisY, axisRatio, startAngle = 0, endAngle = 2 * Math.PI) {
    this.activeLayer.addShape(new Ellipse_1(x1, y1, majorAxisX, majorAxisY, axisRatio, startAngle, endAngle));
    return this;
  }
  drawFace(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
    this.activeLayer.addShape(new Face_1(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4));
    return this;
  }
  _ltypeTable() {
    const t = new Table_1("LTYPE");
    const ltypes = Object.values(this.lineTypes);
    for (const lt of ltypes)
      t.add(lt);
    return t;
  }
  _layerTable(manager) {
    const t = new Table_1("LAYER");
    const layers = Object.values(this.layers);
    for (const l of layers)
      t.add(l);
    return t;
  }
  header(variable, values) {
    this.headers[variable] = values;
    return this;
  }
  setUnits(unit) {
    let value = typeof Drawing.UNITS[unit] != "undefined" ? Drawing.UNITS[unit] : Drawing.UNITS["Unitless"];
    this.header("INSUNITS", [[70, Drawing.UNITS[unit]]]);
    return this;
  }
  generateAutocadExtras() {
    if (!this.headers["ACADVER"]) {
      this.header("ACADVER", [[1, "AC1021"]]);
    }
    if (!this.lineTypes["ByBlock"]) {
      this.addLineType("ByBlock", "", []);
    }
    if (!this.lineTypes["ByLayer"]) {
      this.addLineType("ByLayer", "", []);
    }
    let vpTable = this.tables["VPORT"];
    if (!vpTable) {
      vpTable = this.addTable("VPORT");
    }
    let styleTable = this.tables["STYLE"];
    if (!styleTable) {
      styleTable = this.addTable("STYLE");
    }
    if (!this.tables["VIEW"]) {
      this.addTable("VIEW");
    }
    if (!this.tables["UCS"]) {
      this.addTable("UCS");
    }
    let appIdTable = this.tables["APPID"];
    if (!appIdTable) {
      appIdTable = this.addTable("APPID");
    }
    if (!this.tables["DIMSTYLE"]) {
      const t = new DimStyleTable_1("DIMSTYLE");
      this.tables["DIMSTYLE"] = t;
    }
    vpTable.add(new Viewport_1("*ACTIVE", 1e3));
    styleTable.add(new TextStyle_1("standard"));
    appIdTable.add(new AppId_1("ACAD"));
    this.modelSpace = this.addBlock("*Model_Space");
    this.addBlock("*Paper_Space");
    const d = new Dictionary_1();
    this.dictionary.addChildDictionary("ACAD_GROUP", d);
  }
  _tagsManager() {
    const manager = new TagsManager_1();
    const blockRecordTable = new Table_1("BLOCK_RECORD");
    const blocks = Object.values(this.blocks);
    for (const b of blocks) {
      const r = new BlockRecord_1(b.name);
      blockRecordTable.add(r);
    }
    const ltypeTable = this._ltypeTable();
    const layerTable = this._layerTable();
    manager.start("HEADER");
    manager.addHeaderVariable("HANDSEED", [[5, Handle_1.peek()]]);
    const variables = Object.entries(this.headers);
    for (const v of variables) {
      const [name, values] = v;
      manager.addHeaderVariable(name, values);
    }
    manager.end();
    manager.start("CLASSES");
    manager.end();
    manager.start("TABLES");
    ltypeTable.tags(manager);
    layerTable.tags(manager);
    const tables = Object.values(this.tables);
    for (const t of tables) {
      t.tags(manager);
    }
    blockRecordTable.tags(manager);
    manager.end();
    manager.start("BLOCKS");
    for (const b of blocks) {
      b.tags(manager);
    }
    manager.end();
    manager.start("ENTITIES");
    const layers = Object.values(this.layers);
    for (const l of layers) {
      l.shapesTags(this.modelSpace, manager);
    }
    manager.end();
    manager.start("OBJECTS");
    this.dictionary.tags(manager);
    manager.end();
    manager.push(0, "EOF");
    return manager;
  }
  toDxfString() {
    return this._tagsManager().toDxfString();
  }
}
Drawing.ACI = {
  LAYER: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
  CYAN: 4,
  BLUE: 5,
  MAGENTA: 6,
  WHITE: 7
};
Drawing.LINE_TYPES = [
  {name: "CONTINUOUS", description: "______", elements: []},
  {name: "DASHED", description: "_ _ _ ", elements: [5, -5]},
  {name: "DOTTED", description: ". . . ", elements: [0, -5]}
];
Drawing.LAYERS = [
  {name: "0", colorNumber: Drawing.ACI.WHITE, lineTypeName: "CONTINUOUS"}
];
Drawing.UNITS = {
  Unitless: 0,
  Inches: 1,
  Feet: 2,
  Miles: 3,
  Millimeters: 4,
  Centimeters: 5,
  Meters: 6,
  Kilometers: 7,
  Microinches: 8,
  Mils: 9,
  Yards: 10,
  Angstroms: 11,
  Nanometers: 12,
  Microns: 13,
  Decimeters: 14,
  Decameters: 15,
  Hectometers: 16,
  Gigameters: 17,
  "Astronomical units": 18,
  "Light years": 19,
  Parsecs: 20
};
var Drawing_1 = Drawing;
var dxfWriter = Drawing_1;
var ACI = dxfWriter.ACI;
var LAYERS = dxfWriter.LAYERS;
var LINE_TYPES = dxfWriter.LINE_TYPES;
var UNITS = dxfWriter.UNITS;
//export default dxfWriter;
//export {ACI, LAYERS, LINE_TYPES, UNITS, dxfWriter as __moduleExports};
