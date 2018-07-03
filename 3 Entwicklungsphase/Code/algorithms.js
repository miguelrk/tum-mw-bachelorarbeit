// FIXME: remove out of global scope
let memory = []; // Needed to keep track (permanently until end of algorithm) of frequently accessed and calculated variables

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
    cellSpacing: 100, // spacing between 2 shapeCells
    cellMargin: 25,
    blockMargin: 60, // Margin between parent group and the contained block (area from cellLeft-and-uppermost cell corner and cellRight-and-lowermost cell corner (calculated with cellTop-, cellRight-, cellBottom- and cellLeft-boundaries))
    groupSpacing: 300, // Spacing between 2 innerGroups
    groupMargin: 60, // Margin between parent innerGroup and child innerGroup (between units, and maybe emodules)
    outerGroupPadding: 15, // Padding between outerGroup and either outerGroup or innerGroup (between site and area and processCells (skips enterprise because it has no shape and therefore not present in visualization))
    pageWidth: 1654,
    pageHeight: 1169,
  };
  let m = {};
  let p = {}; // p: previousObject clone
  const pidLevelCount = findMax('pidLevel', vertices);
  let stack = []; // Needed to keep track (temporarily until innerGroup of next level reached, where it is cleared) of frequently accessed and calculated variables
  for (let i = 0; i <= pidLevelCount; i++) {
    stack[i] = []; // Builds two-dimmensional array of stacks (one for each pidLevel)
  }
  console.log(`Instance Hierarchy (pidJson) has a total depth of ${pidLevelCount} pidLevels.`);


  vertices.forEach((v) => {
    console.group(`${v.pidLevel}: ${v.pidClass} (${v.shortName})`);
    console.log(`stack[${v.pidLevel}]`);
    console.table(stack[v.pidLevel]);
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
      cellLeft: 0,
      cellTop: 0,
      cellRight: 0,
      cellBottom: 0
    };

    if (v.shapeName && v.parentId) {
      /*************************************************************************
       *                     SPECIFICATION OF CONSTRAINTS:                      *
       *************************************************************************
       * // TODO: Make an sequence diagram to modell if-elses of constraint specification
       * Non-group Tags:
       *  - tag[0]: isCell
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: [nucleus || funnel || inline] || [aboveParent || aroundParent || insideParent]      (if childOfGroup: [nucleus || funnel || inline] else if childOfNonGroup: [aboveParent || aroundParent || insideParent])
       *  
       * Group Tags:
       *  - tag[0]: isGroup
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: outerGroup || innerGroup      (if shapeCategory='Site'||'Area'||'Cell': [outerGroup] else [innerGroup] )
       */
      // Determine tag (loosely coupled specification to)
      // Set tags for spacial relationships

      console.group(`1. Tag:`);
      /********************************CELLS************************************/
      if ("equipment" === v.pidClass || "instrument" === v.pidClass || "arrow" === v.pidClass) {
        m.tags.push("isCell");
        if ("group" === m.parent.pidClass) {
          m.tags.push("childOfGroup");
          if ("vessels" === v.shapeCategory) m.tags.push("nucleus");
          else if ("funnel" === v.shapeType) m.tags.push("funnel");
          else m.tags.push("inline"); // inline: vertical center-aligned, shifted right (all children of groups except vessels)
        } else if ("group" !== m.parent.pidClass) {
          m.tags.push("childOfNonGroup");
          if ("engines" === v.shapeCategory) m.tags.push("aboveParent");
          if ("instruments" === v.shapeCategory) m.tags.push("aroundParent");
          if ("agitators" === v.shapeCategory) m.tags.push("insideParent");
        }


      /*******************************GROUPS************************************/
      } else if ("group" === v.pidClass) {
        m.tags.push("isGroup");
        if (undefined === m.parent) m.tags.push("childOfGroup"); // catches undefined parent (for child with 'Legato' or Enterprise level root node as parent)
        else if ("group" === m.parent.pidClass) m.tags.push("childOfGroup");
        else if ("group" !== m.parent.pidClass) m.tags.push("childOfNonGroup");
        if ("Site" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Area" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Cell" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Unit" === v.pidHierarchy) m.tags.push(`innerGroupLevel${v.pidLevel}`);
        else m.tags.push(`innerGroupLevel${v.pidLevel}`);
      }
      console.log(m.tags);
      console.groupEnd();
      /******************END OF SPECIFICATION OF CONSTRAINTS********************/

      /*************************************************************************
       *       GRAPHING ALGORITHM: (ORTHOGONAL, INCLUSIVE VERTEX PLACEMENT)     *
       *************************************************************************/
      console.group(`2. Graph:`);

      /********************************CELLS************************************/
      if (m.tags.includes('isCell')) {
        console.log("#isCell");
        if (m.tags.includes('childOfGroup')) {
          console.log("#childOfGroup");
        } else if (m.tags.includes('childOfNonGroup')) {
          console.log("#childOfNonGroup");
        }
        if (m.tags.includes("inline")) {
          console.log("#inline");
          // Set x,y-coordinates relative to previous cell (if previous was group then set at origin (0, 0), else space it from previous cell) (Using conditional (ternary) Operator)
          m.x = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.x + p.w + s.cellSpacing);
          m.y = (p.pidClass === undefined || p.pidClass === "group" ? 0 : p.y + m.h / 2 - p.h / 2);
          console.log(`Coordinates: (${m.x}, ${m.y})`);
          //}
          m.cellLeft = m.x;
          m.cellTop = m.y;
          m.cellRight = m.x + m.w;
          m.cellBottom = m.y + m.h;
          console.log(m);
        }
        if (m.tags.includes("nucleus")) {
          console.log("#nucleus");
          // TODO: Nuclei treated as innerGroups at their corresponding pidLevel
        }
        if (m.tags.includes("insideParent")) {
          console.log("#insideParent");
          // No agitators or heat exchangers modelled
        }
        if (m.tags.includes("aroundParent")) {
          console.log("#aroundParent");
          // Shift right
          m.x = m.parent._w + s.cellSpacing;
          // Shift down (offset from previous slot)
          if (!p.tags.includes("aroundParent")) m.x = s.cellMargin; // skip offset for first childOfNonParent
          else m.y = p.y + p.h + s.cellMargin;
        }
      }
      /*******************************GROUPS************************************/
      else if (m.tags.includes('isGroup')) {
        console.log("#isGroup");
        if (m.tags.includes('childOfGroup')) {
          console.log("#childOfGroup");
          if (m.tags.some((tag) => tag.match(/innerGroup/g))) {
            console.log(`#innerGroupLevel${m.lvl}`);
            console.info(`innerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);
            // 1) Calculate groupArea (with blockWidth and height plus blockMargin on both sides)
            let blockWidth = Math.abs(getMin("cellLeft", stack[p.lvl])) + getMax("cellRight", stack[p.lvl]);
            let blockHeight = Math.abs(getMin("cellTop", stack[p.lvl])) + getMax("cellBottom", stack[p.lvl]);
            let blockArea = blockWidth * blockHeight;
            let groupWidth = 2 * s.blockMargin + blockWidth;
            let groupHeight = 2 * s.blockMargin + blockHeight;
            let groupArea = (2 * s.blockMargin + blockWidth) * (2 * s.blockMargin + blockHeight);
            console.log(`strippedOutArea = ${totalSum("area", stack[p.lvl])}  ->  blockArea = ${blockArea}  ->  groupArea = ${groupArea}`);
            console.log(`groupArea = (${s.blockMargin}+${blockWidth}+${s.blockMargin}) * (${s.blockMargin}+${blockHeight}+${s.blockMargin}) = ${groupArea}`);

            // Update group dimensions in memory
            m.w = groupWidth;
            m.h = groupHeight;
            m.area = groupArea;



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // Set x,y-coordinates to origin (if previous was group then set at origin (0, 0), else space it from previous cell) (Using conditional (ternary) Operator)
            const stackLength = stack[m.lvl].length;
            if (stackLength === 0) {
              // Catch first innerGroup in stack of current level
              console.warn(`${stackLength + 1}st innerGroup in stack[${m.lvl}].`);
              m.x = 0;
              m.y = 0;
              console.warn(`Coordinates set to: (0, 0)`);
            } else if (stackLength >= 1) {
              console.warn(`innerGroup number ${stackLength + 1} in stack[${m.lvl}].`);         
              const indexOfPrevious = stackLength - 1;
              console.warn(stackLength);
              console.warn(indexOfPrevious);
              const xOfPrevious = stack[m.lvl][indexOfPrevious].x;
              const yOfPrevious = stack[m.lvl][indexOfPrevious].y;
              console.warn(xOfPrevious);
              console.warn(yOfPrevious);
              m.x = (xOfPrevious !== undefined ? 0 : p.x + p.w + s.cellSpacing);
              m.y = (yOfPrevious ? 0 : p.y + m.h / 2 - p.h / 2);
              console.warn(m.x);
              console.warn(m.y);
              console.warn(`Coordinates set to: (0, 0)`);
            }
            console.log(`Coordinates: (${m.x}, ${m.y})`);

            m.cellLeft = m.x;
            m.cellTop = m.y;
            m.cellRight = m.x + m.w;
            m.cellBottom = m.y + m.h;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // 3) Offset all contained vertices within the group to center groupArea
            stack[p.lvl].forEach((containedVertex) => {
                if ('group' !== m.pidClass) {
                  console.group(`Applying blockMargin offset of ${s.blockMargin} to ${containedVertex.name}`);
                  console.log(`CHECK ${m.id} !== ${containedVertex.id}?`);
                  applyOffset("x", s.blockMargin, containedVertex);
                  applyOffset("y", s.blockMargin, containedVertex);
                } else if ('group' === m.pidClass) { // Case for innerGroups that have other innerGroups as chidlren (for example units, and maybe emodules). groupMargin must be different
                  console.log(`Applying groupMargin offset (${s.groupMargin})`);
                  applyOffset("x", s.groupMargin, containedVertex);
                  applyOffset("y", s.groupMargin, containedVertex);
                }
                if (m.id === containedVertex.id) console.warn(`WARNING: Group container not excluded from for each because ${m.id} === ${containedVertex.id} --> TRUE`);
                console.groupEnd();
            });

            // 4) Clear stack[p.lvl] of previousPidLevel after offsetting them relative to their parrent (currentPidLevel)
            stack[p.lvl].length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
            stack[p.lvl] = []; // pushes empty array so that array isn't empty if next vertex also a group
            console.log(`Cleared stack[${p.lvl}] of previous pidLevel (${p.lvl}) after offsetting the children relative to their parent (current vertex with pidLevel ${m.lvl})`);

            // Set w and h (of current group) to groupArea sides
            console.log(m);
          }
          else if (m.tags.includes("outerGroup")) {
            console.log("#outerGroup");
            //m.w = 
            // TODO: // pidLevel as multiplicator: Enterprise: lvl=0, Site: lvl=1, area: lvl=2, processCell: lvl=3
            // outerGroups have page dimmensions (each group child has a padding of )
            m.w = s.pageWidth - m.lvl * 2 * s.outerGroupPadding;
            m.h = s.pageHeight - m.lvl * 2 * s.outerGroupPadding;
            m.area = m.w * m.h;
            
          } 
        } else if (m.tags.includes('childOfNonGroup')) {
          console.log("#childOfNonGroup");
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
      //console.log("previous");
      //console.table(p);
      // Push current memory m to current level stack
      stack[m.lvl].push(m);
      // Push  current memory m to memory array
      memory.push({
        lvl: m.lvl,
        id: m.id,
        name: m.name,
        pidClass: m.pidClass,
        tag0: m.tags[0],
        tag1: m.tags[1],
        tag2: m.tags[2],
        tag3: m.tags[3],
        x: m.x,
        y: m.y,
        w: m.w,
        h: m.h,
        area: m.area,
        cellLeft: m.cellLeft,
        cellTop: m.cellTop,
        cellRight: m.cellRight,
        cellBottom: m.cellBottom,
      });
      console.log(stack[m.lvl]);
      console.groupEnd();
    }
    console.groupEnd();
  });
  // FIXME: PROVISIONAL TO PLOT WANTED DATA (LIKE X Y W AND H AS TABLE) AFTER SETTING PIDJSON
  let table = [];
  let verticesData = pidJson.filter(object => object._vertex === "1");
  verticesData.forEach((v) => {
    tableData = {
      // Constants:
      lvl: v.pidLevel,
      id: v.id,
      name: v.shortName,
      pidClass: v.pidClass,
      x: v.mxGeometry._x,
      y: v.mxGeometry._y,
      w: v.mxGeometry._width,
      h: v.mxGeometry._height,
    };
    table.push(tableData);
  });
  console.log('memory:');
  console.table(memory);
  console.log('table:');
  console.table(table);
  console.log('pidJson:');
  console.table(pidJson);

  /*************************END OF VERTICES LOOP********************************/


  function findMax(variable, array) {
    /**
        * Receives a variable name(string) and an array, maps corresponding values from array
          to an array and returns the maximum.
        */
    return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]
    );
  }

  function totalSum(variable, array) {
    /**
     * Receives a variable name (string) and an array, maps corresponding values from array
     * to an array of values and returns the sum of all elements in array.
     */
    return array.map((obj) => obj[variable]).reduce((totalArea, a) => totalArea + a);
  }

  function getMin(variable, array) {
    /**
     * Receives a variable name (string) and an array, and returns the minimum.
     */
    return array.reduce((min, vertex) => (vertex[variable] < min ? vertex[variable] : min), array[0][variable]);
  }

  function getMax(variable, array) {
    /**
     * Receives a variable name (string) and an array, and returns the maximum.
     */
    return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
  }

  function getVertexWithMin(variable, array) {
    /**
     * Receives a variable name (string) and an array, and returns the vertex with the minimum.
     */
    return array.reduce((min, vertex) => (vertex[variable] < min[variable] ? vertex : min), array[0]);
  }

  function getVertexWithMax(variable, array) {
    /**
     * Receives a variable name (string) and an array, and returns the vertex with the maximum.
     */
    return array.reduce((max, vertex) => (vertex[variable] > max[variable] ? vertex : max), array[0]);
  }

  function applyOffset(coordinate, offset, stackedVertex) {
    console.log(`Shifting '${coordinate}'-coordinate by ${offset}`);
    if (coordinate === "x") {
      // Add x-offset to the mxGeometry._x property of the original vertex in vertices (and return value for setting to m.x)
      stackedVertex.x += offset;
      let originalVertex = vertices.find(v => v.id === stackedVertex.id);
      console.log(`x-Coordinate: (${originalVertex.mxGeometry._x}) ->  (${stackedVertex.x})`);
      originalVertex.mxGeometry._x = stackedVertex.x;
      m.cellLeft = m.x;
      m.cellTop = m.y;
      m.cellRight = m.x + m.w;
      m.cellBottom = m.y + m.h;
    } else if (coordinate === "y") {
      // Add y-offset directly to the mxGeometry._y property of the original vertex in vertices (and return value for setting to m.x)
      stackedVertex.y += offset;
      let originalVertex = vertices.find(v => v.id === stackedVertex.id);
      console.log(`y-Coordinate: (${originalVertex.mxGeometry._y}) ->  (${stackedVertex.y})`);
      originalVertex.mxGeometry._y = stackedVertex.y;
    }
  }
  return pidJson;
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
    shadow: 0,
    // FIXME: DELETE THIS WHEN -x and _y VALUES ALLWAYS VALID AFTER VERTEXPLACEMENT (NEVER NaN of Undefined)
    defaultPadding: 15
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
        <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : graphSettings.defaultPadding}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : graphSettings.defaultPadding}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
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

let pidJsonAfter = vertexPlacement(pidJson);
console.log("pidJson after:");
console.log(pidJsonAfter);
pidXmlString = generatePidXmlString(pidJsonAfter);
renderXml(pidXmlString);