// FIXME: remove out of global scope
let memoryStack = [];
let memory = [];

function vertexPlacement(pidJson) {
  console.group("Positioning vertices in graph...");
  let vertices = pidJson.filter(object => object._vertex === "1");
  let edges = pidJson.filter(object => object._edge === "1");
  //console.log(JSON.stringify(vertices));
  console.table(vertices);
  //console.table(edges);
  //console.log(JSON.stringify(edges));

  // s:settings, m:memory, i:index, p:previous, v:vertex
  // SET ONCE AND NEVER RESET
  let s = {
    spacing: 100,
    margin: 25,
    groupSpacing: 300,
    groupMargin: 25,
    groupPadding: 100,
    pageWidth: 1654,
    pageHeight: 1169,
  };
  let i = 0;
  let m = {};
  let p = {}; // p: previousObject clone

  vertices.forEach((v) => {
    console.group(`${v.pidLevel}: ${v.pidClass} (${v.shortName})`);
    console.log("memoryStack:");
    console.log(memoryStack);
    // Frequently accessed variables pushed to memory object ('_' indicates mxGraph private variable)
    m = {
      // Constants:
      name: v.shortName,
      lvl: v.pidLevel,
      pidClass: v.pidClass,
      id: v.id,
      parent: vertices.find(vertex => vertex.id === v.parentId),
      siblings: vertices.filter(sibling => sibling.parentId === v.parentId),
      // To be calculated:
      tags: [],
      x: parseInt(v.mxGeometry._x, 10),
      y: parseInt(v.mxGeometry._y, 10),
      w: parseInt(v.mxGeometry._width, 10),
      h: parseInt(v.mxGeometry._height, 10),
      area: parseInt(v.mxGeometry._width, 10) * parseInt(v.mxGeometry._height, 10),
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };

    if (v.shapeName && v.parentId) {
      /*************************************************************************
       *                     SPECIFICATION OF CONSTRAINTS:                      *
       *************************************************************************
       * // TODO: Make an sequence diagram to modell if-elses of constraint specification
       * Non-group Tags:
       *  - tag[0]: isNonGroup || isGroup
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: Positioning1: inline(if childOfGroup) || aboveParent(else if engines) || aroundParent(else if instruments)
       *  - tag[3]: Positioning2: aboveParent(if aboveParent) || nucleus(if vessel) || undefined(else)
       *  -
       * Group Tags:
       *  - tag[0]: isNonGroup || isGroup
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: sizeSetting: visualizedGroup || nonVisualizedGroup
       *  - tag[3]: Positioning1: inlineBlock(if visualizedGroup) || undefined (else)
       * 
       */
      // Determine tag (loosely coupled specification to)
      // Set tags for spacial relationships

      console.group(`1. Tag:`);
      /*****************************NON-GROUPS**********************************/
      if ("equipment" === v.pidClass || "instrument" === v.pidClass || "arrow" === v.pidClass) {
        m.tags.push("isNonGroup");
        if ("group" === m.parent.pidClass) {
          m.tags.push("childOfGroup");
          if ("equipment" === m.pidClass) m.tags.push("inline"); // vertical center-aligned, shifted right
        } else if ("group" !== m.parent.pidClass) {
          m.tags.push("childOfNonGroup");
          if ("engines" === v.shapeCategory) m.tags.push("aboveParent");
          if ("instruments" === v.shapeCategory) m.tags.push("aroundParent");
        }
        if ("vessels" === v.shapeCategory) m.tags.push("nucleus");
        if ("agitators" === v.shapeCategory) m.tags.push("insideParent");

        /*******************************GROUPS************************************/
      } else if ("group" === v.pidClass) {
        m.tags.push("isGroup");
        if (undefined === m.parent) m.tags.push("childOfGroup"); // catches undefined parent (for child with 'Legato' or Enterprise level root node as parent)
        else if ("group" === m.parent.pidClass) m.tags.push("childOfGroup");
        else if ("group" !== m.parent.pidClass) m.tags.push("childOfNonGroup");
        if ("0" === v.pidLevel) m.tags.push("root");
        if ("Site" === v.pidHierarchy) m.tags.push("nonVisualizedGroup");
        else if ("Area" === v.pidHierarchy) m.tags.push("nonVisualizedGroup");
        else if ("Cell" === v.pidHierarchy) m.tags.push("nonVisualizedGroup");
        else {
          m.tags.push("visualizedGroup");
          m.tags.push("inlineBlock"); // vertical top-aligned, shifted right
        }
      }
      console.log(m.tags);
      console.groupEnd();
      /******************END OF SPECIFICATION OF CONSTRAINTS********************/

      /*************************************************************************
       *       GRAPHING ALGORITHM: (ORTHOGONAL, INCLUSIVE VERTEX PLACEMENT)     *
       *************************************************************************/
      console.group(`2. Graph:`);

      /*****************************NON-GROUPS**********************************/
      if (m.tags.includes('isNonGroup')) {
        console.log("NON-GROUP");

        if (m.tags.includes('childOfGroup')) {

        } else if (m.tags.includes('childOfNonGroup')) {

        }

        if (m.tags.includes("inline")) {
          console.log(p);
          // Set x,y-coordinates relative to previous cell (if group then set at origin (0, 0), else space it from previous cell) (Using conditional (ternary) Operator)
          m.x = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.x + p.w + s.spacing);
          m.y = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.y + m.h / 2 - p.h / 2);
          console.log(`Coordinates: (${m.x}, ${m.y})`);
          //}
          m.left = m.x;
          m.top = m.y;
          m.right = m.x + m.w;
          m.bottom = m.y + m.h;
          console.log(m);
        }
        if (m.tags.includes("nucleus")) {

        }
        if (m.tags.includes("insideParent")); // No agitators or heat exchangers modelled
        if (m.tags.includes("aroundParent")) {
          // Shift right
          m.x = m.parent._w + s.spacing;
          // Shift down (offset from previous slot)
          if (!p.tags.includes("aroundParent")) m.x = s.margin; // skip offset for first childOfNonParent
          else m.y = p.y + p.h + s.margin;
        }
      }
      /*******************************GROUPS************************************/
      else if (m.tags.includes('isGroup')) {
        console.log("GROUP");

        if (m.tags.includes('childOfGroup')) {
          if (m.tags.includes("nonVisualizedGroup")) {
            if (m.tags.includes("root")) {} // TODO: ;
            // Set width and height of selected root node (graph container) and site, area, cell to equal the pageWidth and pageHeight
            m.w = s.pageWidth - 2;
            m.h = s.pageHeight - 2;
          } else if (m.tags.includes("visualizedGroup")) {
            if (m.tags.includes("inlineBlock")) {

              // 1) Calculate groupArea (with groupPadding)
              let groupWidth = Math.abs(getMin("left")) + getMax("right");
              let groupHeight = Math.abs(getMin("top")) + getMax("bottom");
              let groupArea = groupWidth * groupHeight;
              let groupWidthPadded = 2 * s.groupPadding + groupWidth;
              let groupHeightPadded = 2 * s.groupPadding + groupHeight;
              let groupAreaPadded = (2 * s.groupPadding + groupWidth) * (2 * s.groupPadding + groupHeight);
              console.log(`strippedOutArea = ${totalSum("area")}  ->  groupArea = ${groupArea}  ->  groupAreaPadded = ${groupAreaPadded}`);
              console.log(`groupAreaPadded = (${s.groupPadding}+${groupWidth}+${s.groupPadding}) * (${s.groupPadding}+${groupHeight}+${s.groupPadding}) = ${groupAreaPadded}`);

              // Update group dimensions in memory
              m.w = groupWidthPadded;
              m.h = groupHeightPadded;
              m.area = groupAreaPadded;
              m.left = m.x;
              m.top = m.y;
              m.right = m.x + m.w;
              m.bottom = m.y + m.h;

              // 3) Offset all contained vertices within the group to center groupArea
              memoryStack.forEach((m) => {
                console.group(`Centering ${m.name} by ${s.groupPadding} in Group`);
                applyOffset("x", s.groupPadding, m);
                applyOffset("y", s.groupPadding, m);
                console.groupEnd();
              });

              // 4) Clear memory
              memoryStack.length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
              memoryStack = []; // pushes empty array so that array isn't empty if next vertex also a group

              // Set w and h (of current group) to groupArea sides
              console.log(m);
            }
          }
        } else if (m.tags.includes('childOfNonGroup')) {
          // Shouldn't ever exist
        }

      }

      console.groupEnd();

      /****************************SET VARIABLES********************************/
      v.mxGeometry._x = m.x;
      v.mxGeometry._y = m.y;
      v.mxGeometry._width = m.w;
      v.mxGeometry._height = m.h;

      console.group(`3. Set:`);
      console.log(`id: ${v.id}`);
      console.log(`parent: ${v.parent !== undefined ? v.parent.shortName : "N/A"}`);
      console.log(`m.x: ${v.mxGeometry._x} -> _x`);
      console.log(`m.y: ${v.mxGeometry._y} -> _y`);
      console.log(`m.w: ${v.mxGeometry._width} -> _width`);
      console.log(`m.h: ${v.mxGeometry._height} -> _height`);
      console.groupEnd();

      /*************************END OF ALGORITHM********************************/
      p = m; // Replace previous vertex p with current and re-iterate]
      console.log("previous");
      console.table(p);
      memoryStack.push(m); // Push memory m to data memoryStack
      memory.push({
        lvl: m.lvl,
        id: m.id,
        name: m.name,
        pidClass: m.pidClass,
        tag0: m.tags[0],
        tag1: m.tags[1],
        tag2: m.tags[2],
        tag3: m.tags[3],
        tag4: m.tags[4],
        x: m.x,
        y: m.y,
        w: m.w,
        h: m.h,
        area: m.area,
        left: m.left,
        top: m.top,
        right: m.right,
        bottom: m.bottom,
      }); // Push memory m to data memoryStack
      i += 1; // Increment index counter
      console.log(memoryStack);
      console.groupEnd();
    }
    console.groupEnd();
  });
  console.log('memory:');
  console.table(memory);

  /*************************END OF VERTICES LOOP********************************/

  function totalSum(variable) {
    /**
     * Receives a variable name (string), maps corresponding values from memoryStack
     * to an array and returns the sum of all elements in array.
     */
    let array = memoryStack.map(obj => obj[variable]);
    return array.reduce((totalArea, a) => totalArea + a);
  }

  function getMin(variable) {
    /**
     * Receives a variable name (string), maps corresponding values from memoryStack
     * to an array and returns the minimum.
     */
    return memoryStack.reduce(
      (min, vertex) => (vertex[variable] < min ? vertex[variable] : min),
      memoryStack[0][variable]
    );
  }

  function getMax(variable) {
    /**
        * Receives a variable name(string), maps corresponding values from memoryStack *
          to an array and returns the maximum.
        */
    return memoryStack.reduce(
      (max, vertex) => (vertex[variable] > max ? vertex[variable] : max),
      memoryStack[0][variable]
    );
  }

  function getVertexWithMin(variable) {
    /**
     * Receives a variable name (string), maps corresponding values from memoryStack
     * to an array and returns the vertex with the minimum.
     */
    return memoryStack.reduce(
      (min, vertex) => (vertex[variable] < min[variable] ? vertex : min),
      memoryStack[0]
    );
  }

  function getVertexWithMax(variable) {
    /**
        * Receives a variable name(string), maps corresponding values from memoryStack *
          to an array and returns the vertex with the maximum.
        */
    return memoryStack.reduce(
      (max, vertex) => (vertex[variable] > max[variable] ? vertex : max),
      memoryStack[0]
    );
  }

  function applyOffset(coordinate, offset, stackedVertex) {
    console.log(`Shifting '${coordinate}'-coordinate by ${offset}`);
    if (coordinate === "x") {
      // Add x-offset to the mxGeometry._x property of the original vertex in vertices (and return value for setting to m.x)
      stackedVertex.x += offset;
      let originalVertex = vertices.find(v => v.id === stackedVertex.id);
      console.log(`x-Coordinate: (${originalVertex.mxGeometry._x}) ->  (${stackedVertex.x})`);
      originalVertex.mxGeometry._x = stackedVertex.x;
    } else if (coordinate === "y") {
      // Add y-offset directly to the mxGeometry._y property of the original vertex in vertices (and return value for setting to m.x)
      stackedVertex.y += offset;
      let originalVertex = vertices.find(v => v.id === stackedVertex.id);
      console.log(`y-Coordinate: (${originalVertex.mxGeometry._y}) ->  (${stackedVertex.y})`);
      originalVertex.mxGeometry._y = stackedVertex.y;
    }
  }
}


function generatePidXmlString(pidJson) {
  console.groupCollapsed("Generating pidXmlString from pidJson...");
  console.log("pidJson:");
  console.table(pidJson);
  // Filter nodes by their individual pidClasses and create new
  // individual objects (not too expensive and filtered once before
  // layout algorithm and string generation, both which need filtered data
  let pidEquipments;
  pidEquipments = pidJson.filter(
    pidInstance => pidInstance.pidClass === "equipment"
  );
  let pidInstruments;
  pidInstruments = pidJson.filter(
    pidInstance => pidInstance.pidClass === "instrument"
  );
  let pidArrows;
  pidArrows = pidJson.filter(pidInstance => pidInstance.pidClass === "arrow");
  let pidGroups;
  pidGroups = pidJson.filter(pidInstance => pidInstance.pidClass === "group");
  let pidLines;
  pidLines = pidJson.filter(pidInstance => pidInstance.pidClass === "line");

  // let pidDatabaseBindings;
  // pidDatabaseBindings = pidJson.filter(
  //     pidInstance => pidInstance.pidClass === 'data_binding' ??? pidClass or xml object or what
  // );

  console.log(`pidEquipments: ${pidEquipments.length}`);
  console.log(`pidInstruments: ${pidInstruments.length}`);
  console.log(`pidArrows: ${pidArrows.length}`);
  console.log(`pidGroups: ${pidGroups.length}`);
  console.log(`pidLines: ${pidLines.length}`);

  const graphSettings = {
    dx: 0,
    dy: 0,
    grid: 0,
    gridSize: 10,
    guides: 1,
    tooltips: 1,
    connect: 1,
    arrows: 1,
    fold: 1,
    page: 1,
    pageScale: 1,
    pageWidth: 1654,
    pageHeight: 1169,
    background: "#ffffff",
    math: 0,
    shadow: 0
  };

  console.groupCollapsed("XML String generation started...");

  // FIXME: Fix pid-current-value in xml-string-templates which is currently set to the ID
  const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
  const htmlLabelInstrument = '&lt;table cellpadding=&quot;4&quot; cellspacing=&quot;0&quot; border=&quot;0&quot; style=&quot;font-size:1em;width:100%;height:100%;&quot;&gt;&lt;tr&gt;&lt;td&gt;%pid-function%&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;%pid-number%&lt;/td&gt;&lt;/table&gt; ';
  const htmlLabelGroup = '%pid-hierarchy%: %pid-label%';
  // Add mxGraph and mxGraphModel boilerplate settings
  let xmlString = `
<mxGraphModel dx="${graphSettings.dx}" dy="${graphSettings.dy}" grid="${graphSettings.grid}" gridSize="${graphSettings.gridSize}" guides="${graphSettings.guides}" tooltips="${graphSettings.tooltips}" connect="${graphSettings.connect}" arrows="${graphSettings.arrows}" fold="${graphSettings.fold}" page="${graphSettings.page}" pageScale="${graphSettings.pageScale}" pageWidth="${graphSettings.pageWidth}" pageHeight="${graphSettings.pageHeight}" background="${graphSettings.background}" math="${graphSettings.math}" shadow="${graphSettings.shadow}">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>`;

  // Add vertices:
  const equipmentCount = pidEquipments.length;
  console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
  pidEquipments.forEach((pidEquipment) => {
    // Conditional inside template literal to set either parent or default _parent
    // Values not preceeded with '_' are instance attributes (from database)
    // FIXME: Remove id attribute in mxCell and leave it only in object?
    xmlString += `
    <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : (pidEquipment.shortName ? pidEquipment.shortName : (pidEquipment.germanName ? pidEquipment.germanName : (pidEquipment.englishName ? pidEquipment.englishName : null )))}" pid-current-value="${pidEquipment.id}" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="">
        <mxCell style="${concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}">
          <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
  });

  const instrumentCount = pidInstruments.length;
  console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
  pidInstruments.forEach((pidInstrument) => {
    xmlString += `
    <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : (pidInstrument.shortName ? pidInstrument.shortName : (pidInstrument.germanName ? pidInstrument.germanName : (pidInstrument.englishName ? pidInstrument.englishName : null )))}" pid-current-value="${pidInstrument.id}" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
        <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  const arrowCount = pidArrows.length;
  console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
  pidArrows.forEach((pidArrow) => {
    xmlString += `
    <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : (pidArrow.shortName ? pidArrow.shortName : (pidArrow.germanName ? pidArrow.germanName : (pidArrow.englishName ? pidArrow.englishName : null )))}" pid-current-value="${pidArrow.id}" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
        <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  const groupCount = pidGroups.length;
  console.log(`Generating XML-tags for ${groupCount} group instances...`);
  pidGroups.forEach((pidGroup) => {
    xmlString += `
    <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : (pidGroup.shortName ? pidGroup.shortName : (pidGroup.germanName ? pidGroup.germanName : (pidGroup.englishName ? pidGroup.englishName : null )))}" pid-hierarchy="${pidGroup.pidHierarchy}" pid-current-value="${pidGroup.id}" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" connectable="${pidGroup._connectable}" parent="${pidGroup.parentId ? pidGroup.parentId : pidGroup._parent}">
        <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : 50}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : 50}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  // Add edges:
  const lineCount = pidLines.length;
  console.log(`Generating XML-tags for ${lineCount} line instances...`);
  pidLines.forEach((pidLine) => {
    xmlString += `
    <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : (pidLine.shortName ? pidLine.shortName : (pidLine.germanName ? pidLine.germanName : (pidLine.englishName ? pidLine.englishName : null )))}" pid-current-value="${pidLine.id}" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${pidLine.parentId ? pidLine.parentId : pidLine._parent}">
        <mxGeometry relative="${pidLine.mxGeometry._relative ? pidLine.mxGeometry._relative : 1}" as="${pidLine.mxGeometry._as ? pidLine.mxGeometry._as : 'geometry'}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  // TODO:  Add database bindings

  // Add boilerplate closing tags
  xmlString += `
  </root>
</mxGraphModel>`;

  console.log('pidXmlString');
  console.log(xmlString);
  console.groupEnd();
  console.groupEnd();
  return xmlString;
}


function concatenateStyles(styleObject) {
  let styleString = '';
  //console.log(styleObject);
  // Converts object to array to iterate through all entries with forEach
  let valuesArray = Object.values(styleObject);
  valuesArray.forEach((value) => {
    if (value === '') {
      // Skip empty attribute
    } else {
      // Concatenate attribute
      styleString += value + ';';
    }
  });
  //console.log(styleString);
  return styleString;
}


function renderXml(xmlString) {
  //console.log('Rendering pidXmlString as innerHTML...');
  // Formats raw XML-string to pretty print
  let formattedXmlString = formatXml(xmlString, "  ");
  // Encodes XML string to valid HTML string (HTML characters)
  let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
  //console.log(`pidHtmlString = \n${formattedHtmlString}`);
  document.getElementById("xml-container-div").innerHTML = formattedHtmlString;
}

function formatXml(xml, tab) {
  // tab = optional indent value, default is tab (\t)
  //console.log('Formatting pidXmlString...');
  var formatted = "",
    indent = "";
  tab = tab || "\t";
  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
    formatted += indent + "<" + node + ">\r\n";
    if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
  });
  return formatted.substring(1, formatted.length - 3);
}

function escapeXmlToHtml(xmlString) {
  //console.log('Escaping pidXmlString to pidHtmlString...');
  let htmlString = String(xmlString)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;")
    .replace(/\n/g, "<br />");
  return htmlString;
}

vertexPlacement(pidJson);
console.log("pidJson after:");
console.log(pidJson);
pidXmlString = generatePidXmlString(pidJson);
renderXml(pidXmlString);