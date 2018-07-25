function vertexPlacement(pidJson) {
  console.group("Positioning vertices in graph...");
  let vertices = pidJson.filter(object => object._vertex === "1");
  let edges = pidJson.filter(object => object._edge === "1");
  //console.log(JSON.stringify(vertices));
  console.log(JSON.stringify(vertices));
  console.table(vertices);
  console.table(edges);
  //console.log(JSON.stringify(edges));

  let simplifiedEdges = simplifyConnections(vertices, edges);
  console.log('simplifiedEdges:');
  console.table(simplifiedEdges);

  // s:settings, m:memory, i:index, p:previous, v:vertex
  // SET ONCE AND NEVER RESET
  let s = {
    cellSpacing: 125, // spacing between 2 shapeCells
    cellMargin: 25,
    margin: 60, // Margin between parent group and the contained block (area from left-and-uppermost cell corner and right-and-lowermost cell corner (calculated with top-, right-, bottom- and left-boundaries))
    groupSpacing: 200, // Spacing between 2 innerGroups
    pageWidth: 1654,
    pageHeight: 1169,
  };
  // Set after iteration if any side of the iterated vertex exceeds the global:
  let globalLeft = 0; // min
  let globalRight = 0; // max
  let globalTop = 0; // min
  let globalBottom = 0; // max
  let m = {};
  let p = {}; // p: previousObject clone
  const pidLevelCount = findMax('pidLevel', vertices);
  let memory = []; // Needed to keep track (permanently until end of algorithm) of frequently accessed and calculated variables
  let stack = []; // Needed to keep track ONLY OF VERTICES WITH #CHILDOFGROUP (temporarily until ANY innerGroup of next level reached, where it is cleared) 
  // of frequently accessed and calculated variables #childOfNonGroup elements are not pushed to stack because they don't need to be offset by margin,
  // only their parent and they move with it with their relative position to their parent
  for (let i = 0; i <= pidLevelCount; i++) {
    stack[i] = []; // Builds two-dimmensional array of stacks (one for each pidLevel)
  }

  console.log(`Instance Hierarchy (pidJson) has a total depth of ${pidLevelCount} pidLevels.`);


  vertices.forEach((v) => {
    console.group(`${v.pidLevel}: ${v.pidClass} (${v.shortName})`);
    console.log(`stack[${v.pidLevel}]`);
    console.table(stack[v.pidLevel]);

    if (v.shapeName && v.parentId) {
      // Frequently accessed variables pushed to memory object ('_' indicates mxGraph private variable)
      m = {
        // Already there:
        name: v.shortName,
        lvl: v.pidLevel,
        pidClass: v.pidClass,
        pidHierarchy: v.pidHierarchy,
        id: v.id,
        parent: getParent(v.parentId, vertices),
        siblings: getSiblings(v.parentId, memory),
        children: getChildren(v.id, memory),
        descendants: getDescendants(v.id, memory),
        // To be calculated:
        tags: [],
        x: parseInt(v.mxGeometry._x, 10),
        y: parseInt(v.mxGeometry._y, 10),
        w: parseInt(v.mxGeometry._width, 10) ? parseInt(v.mxGeometry._width, 10) : 1000, // if width empty (groups) set to 1000 for now
        h: parseInt(v.mxGeometry._height, 10) ? parseInt(v.mxGeometry._height, 10) : 1000, // if width empty (groups) set to 1000 for now
        area: parseInt(v.mxGeometry._width, 10) * parseInt(v.mxGeometry._height, 10),
        left: parseInt(v.mxGeometry._x, 10),
        top: parseInt(v.mxGeometry._y, 10),
        right: parseInt(v.mxGeometry._width, 10),
        bottom: parseInt(v.mxGeometry._height, 10)
      };
      console.warn(m.children);
      console.warn(m.descendants);

      /*************************************************************************
       *                     SPECIFICATION OF CONSTRAINTS:                      *
       *************************************************************************
       * Non-group Tags:
       *  - tag[0]: isShape
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: [nucleus || funnel || inline] || [centeredAboveParent || aroundParent || insideParent]
       *  
       * Group Tags:
       *  - tag[0]: isGroup
       *  - tag[1]: childOfGroup || childOfNonGroup
       *  - tag[2]: outerGroup || innerGroup
       */

      console.group(`1. Tag:`);

      /********************************SHAPES***********************************/
      if ("equipment" === v.pidClass || "instrument" === v.pidClass || "arrow" === v.pidClass) {
        m.tags.push("isShape");

        if ("group" === m.parent.pidClass) {
          m.tags.push("childOfGroup");
          if ("vessels" === v.shapeCategory) m.tags.push(`nucleusGroup`);
          else if ("funnel" === v.shapeType) m.tags.push("funnel");
          else if ("instrument" === v.shapeType) m.tags.push("centeredAboveParent");
          else m.tags.push("inline"); // inline: vertical center-aligned, shifted right (all children of groups except vessels)
        } else if ("group" !== m.parent.pidClass) {
          m.tags.push("childOfNonGroup");
          if ("engines" === v.shapeCategory) m.tags.push("centeredAboveParent");
          if ("instruments" === v.shapeCategory) {
            if ("vessels" !== m.parent.shapeCategory) m.tags.push("centeredAboveParent");
            else if ("vessels" === m.parent.shapeCategory) m.tags.push("aroundParent");
          }
          if ("agitators" === v.shapeCategory) m.tags.push("insideParent");
        }

      }
      /*******************************GROUPS************************************/
      else if ("group" === v.pidClass) {
        m.tags.push("isGroup");
        if (undefined === m.parent) m.tags.push("childOfGroup"); // catches undefined parent (for child with 'Legato' or Enterprise level root node as parent)
        else if ("group" === m.parent.pidClass) m.tags.push("childOfGroup");
        else if ("group" !== m.parent.pidClass) m.tags.push("childOfNonGroup");
        if ("Site" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Area" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Cell" === v.pidHierarchy) m.tags.push("outerGroup");
        else if ("Unit" === v.pidHierarchy) m.tags.push(`innerGroup`);
        else m.tags.push(`innerGroup`);
      }
      console.log(m.tags);
      console.groupEnd();
      /******************END OF SPECIFICATION OF CONSTRAINTS********************/

      /*************************************************************************
       *       GRAPHING ALGORITHM: (ORTHOGONAL, INCLUSIVE VERTEX PLACEMENT)     *
       *************************************************************************/
      console.group(`2. Graph:`);

      /********************************CELLS************************************/
      if (m.tags.includes('isShape')) {
        console.group("#isShape");

        if (m.tags.includes('childOfGroup')) {
          console.group("#childOfGroup");

          let descendantsWithParent = memory.filter((child) => (child.parentId === m.id));
          descendantsWithParent.push(m); // Push root/parent vertex as well
          console.warn('descendantsWithParent:')
          console.warn(descendantsWithParent);

          if (m.tags.includes("inline")) {
            console.group("#inline");

            // Set x,y-coordinates relative to previous cell ) (Using conditional (ternary) Operator)
            m.x = (() => {
              if (p.pidClass === undefined || p.pidClass === "group") return 0; // if group set at origin (0, 0)
              else if (p.lvl === m.lvl) return (p.right + s.cellSpacing); // else if in current inline level space shape from previous one
              else if (p.lvl < m.lvl) {
                // skip if child (one level lower than current inline shapes). These children move already relative to their parent (next shape)
              } else if (p.lvl > m.lvl) return 0; // reset when back at level of current inline shapes
              else return 0;
            })();
            m.y = (() => {
              if (p.pidClass === undefined || p.pidClass === "group") return 0; // if group set at origin (0, 0)
              else if (p.lvl === m.lvl) return (p.y + (p.h - m.h) / 2); // else if in current inline level space shape from previous one
              else if (p.lvl < m.lvl) {
                // skip if child (one level lower than current inline shapes). These children move already relative to their parent (next shape)
              } else if (p.lvl > m.lvl) return s.spacing + Math.abs(measureBlock('height', descendantsWithParent)); // reset to new line when back at level of current inline shapes
            })();

            console.log(`Coordinates: (${m.x}, ${m.y})`);
            //}

            console.log(m);
            console.groupEnd();
          } else if (m.tags.includes("funnel")) {
            m.x = p.x + s.margin;
            m.y = p.y + p.w + s.margin;
          } else if (m.tags.includes("nucleusGroup")) {
            console.group(`#nucleusGroup`); // nucleusGroups of all pidLevels
            console.log(`nucleusGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

            // Measure:
            const blockWidth = measureBlock('width', descendantsWithParent);
            const blockHeight = measureBlock('height', descendantsWithParent);
            const blockX = getMin('left', descendantsWithParent);
            const blockY = getMin('top', descendantsWithParent);

            // Scale:
            scaleGroup(blockWidth, blockHeight, s.margin, descendantsWithParent);

            // Shift: needs to directly modify the v._mxGeometry._x and v._mxGeometry._y properties of all children
            // (and with that, its relatively positioned descendants of the children) so function must be 
            // passed descendantsWithParent and not m.descendants
            //shiftNucleusGroup(m.descendants);
            shiftNucleusGroup(blockX, blockY, m.descendants);

            console.groupEnd();
          }

          console.groupEnd();
        } else if (m.tags.includes('childOfNonGroup')) {
          console.group("#childOfNonGroup");

          if (m.tags.includes('centeredAboveParent')) {
            console.group("#centeredAboveParent");
            console.log(`Centering shape above its parent (${m.parent.id}: ${m.parent.shortName}).`);
            const parentWidth = parseInt(m.parent.mxGeometry._width);
            console.log(`(${parentWidth} / 2) - (${m.w} / 2)`);
            m.x = (parentWidth / 2) - (m.w / 2);
            m.y = -m.h - s.cellSpacing;

            console.groupEnd();
          } else if (m.tags.includes('aroundParent')) {
            console.group("#aroundParent");

            // Set x,y-coordinates relative to previous childOfNonGroup
            const stackLength = stack[m.lvl].length;
            const parentWidth = parseInt(m.parent.mxGeometry._width);

            if (!p.tags.includes('aroundParent')) { // Case for first aroundParent in current level stack (because of order of vertices)
              console.log(`1st aroundParent child of ${m.parent.shortName} set to take 1st slot.`);
              m.x = parentWidth + s.cellSpacing;
              m.y = s.cellSpacing;
            } else if (p.tags.includes('childOfNonGroup')) {
              // Case for second, third, ..., n-th childOfNonGroup in current level stack
              console.log(`aroundParent child of ${m.parent.shortName} set to take next slot (offset relative to previous).`);
              m.x = parentWidth + s.cellSpacing;
              console.warn('p.y:');
              console.warn(p.y);
              m.y = p.y + p.h + s.cellMargin;
            }
            console.groupEnd();
          }
          console.groupEnd();
        }
      }
      /*******************************GROUPS************************************/
      else if (m.tags.includes('isGroup')) {
        console.group("#isGroup");

        if (m.tags.includes('childOfGroup')) {
          console.group("#childOfGroup");

          if (m.tags.includes("innerGroup")) {
            console.group(`#innerGroup`);
            console.log(`innerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

            console.log(m.pidHierarchy);

            // if ('Unit' === m.pidHierarchy) {
            //   // innerGroup with only group children (either innerGroups or nucleusGroups)
            //   let children = getChildren(m.id, memory);
            //   children.forEach((child) => child.tag2)
            //   console.log(children);
            //   let childrenGroups = children.filter((child) => child.tag2 === 'innerGroup' || 'nucleusGroup' === child.tag2);
            //   console.log('childrenGroups');
            //   console.log(childrenGroups);
            //   let scaledGroup = packBlocks(childrenGroups, vertices, memory); // function returns scaled group dimmensions
            //   m.w = scaledGroup.width;
            //   m.h = scaledGroup.height;
            //   // Scale:
            //   //scaleGroup(blockWidth, blockHeight, s.margin, m.descendants);
            //   // Center:
            //   //shiftChildren(blockWidth, blockHeight, m.children);
            //   // Clear:
            //   clearStack(stack[p.lvl]);
            // } else {


            // innerGroup with at least one shape as children

            // Measure: get absolute measures of all descendants (relative to current parent/grandparent: m)
            let descendantSides = getAbsoluteSides(m.descendants, m);

            let blockLeft = Math.abs(getMin("left", descendantSides));
            let blockRight = getMax("right", descendantSides);
            let blockTop = Math.abs(getMin("top", descendantSides));
            let blockBottom = getMax("bottom", descendantSides);
            let blockWidth = measureBlock('width', descendantSides);
            let blockHeight = measureBlock('height', descendantSides);
            console.log('descendantSides');
            console.log(descendantSides);
            console.log(blockLeft);
            console.log(blockRight);
            console.log(blockTop);
            console.log(blockBottom);
            console.log(blockWidth);
            console.log(blockHeight);
            // Set sides of block
            m.left = blockLeft;
            m.right = blockRight;
            m.top = blockTop;
            m.bottom = blockBottom;

            // Scale:
            scaleGroup(blockWidth, blockHeight, s.margin, descendantSides);
            // Shift:
            shiftInnerGroup(stack[m.lvl]);
            // Center:
            shiftChildren(blockWidth, blockHeight, m.children);
            // Clear:
            clearStack(stack[p.lvl]);
            // }


          } else if (m.tags.includes("outerGroup")) {
            console.group("#outerGroup");
            console.log(`outerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

            // Measure:
            if (m.children.length > 1) {
              // Case for m: Brewhouse with units as children
              let scaledGroup = packBlocks(m.children, vertices, memory); // function returns scaled group dimmensions
              m.w = scaledGroup.width;
              m.h = scaledGroup.height;
            } else {
              m.w = 2 * s.margin + measureBlock('width', m.children);
              m.h = 2 * s.margin + measureBlock('height', m.children);
            }

            // Scale: 
            //scaleGroup(blockWidth, blockHeight, s.margin, m.children);
            // Shift:
            //shiftOuterGroup(stack[m.lvl]);

            // Center:       before: shiftChildren(blockWidth, blockHeight, m.children);
            // Clear:
            clearStack(stack[p.lvl]);
            // m.w = measureBlock('width', m.children); // get width of the only child
            // m.h = measureBlock('height', m.children); // get height of the only child
            // centerBlock(m.children);

          }

          console.groupEnd();
        console.groupEnd();

      } else if (m.tags.includes('childOfNonGroup')) {
        console.group("#childOfNonGroup");
        // Shouldn't ever exist
        console.groupEnd();
      }

      // Reset all global sides after each group uses them
      globalLeft = 0; // min
      globalRight = 0; // max
      globalTop = 0; // min
      globalBottom = 0; // max

      console.groupEnd();
    }

      /****************************SET VARIABLES********************************/

      console.group(`3. Set:`);

      // 1) Algorithm variables:
      m.left = m.x;
      m.top = m.y;
      m.right = m.x + m.w;
      m.bottom = m.y + m.h;
      console.log(`Sides updated for new coordinates: \nx: ${m.x}\ny: ${m.y}\nw: ${m.w}\nh: ${m.h}\nleft: ${m.left}\ntop: ${m.top}\nright: ${m.right}\nbottom: ${m.bottom}`);

      // 2) pidJson variables:
      v._children = m.children.map((child) => child.id);
      v.mxGeometry._x = m.x;
      v.mxGeometry._y = m.y;
      if (!m.tags.includes('nucleusGroup')) {
        // Skip setting width of shapeCell to width of group because m.w and
        // m.h of nucleus was set to groupWidth and groupHeight already
        v.mxGeometry._width = m.w;
        v.mxGeometry._height = m.h;
      }

      // 3) Global sides:
      globalLeft = (m.left < globalLeft ? m.left : globalLeft); // min
      globalRight = (m.right > globalRight ? m.right : globalRight); // max
      globalTop = (m.top < globalTop ? m.top : globalTop); // min
      globalBottom = (m.bottom > globalBottom ? m.bottom : globalBottom); // max

      console.log(`id: ${v.id}`);
      console.log(`parent: ${m.parent !== undefined ? m.parent.shortName : "N/A"}`);
      console.log(`m.x: ${v.mxGeometry._x} -> _x`);
      console.log(`m.y: ${v.mxGeometry._y} -> _y`);
      console.log(`m.w: ${v.mxGeometry._width} -> _width`);
      console.log(`m.h: ${v.mxGeometry._height} -> _height`);
      console.warn(`globalLeft: ${globalLeft}, globalRight: ${globalRight}, globalTop: ${globalTop}, globalBottom: ${globalBottom}`);

      console.groupEnd();

      /*************************END OF ALGORITHM********************************/
      p = m; // Replace previous vertex p with current and re-iterate]
      //console.log("previous");
      //console.table(p);
      // For vertices with #childOfGroup: push current memory m to current level stack
      if (m.tags.includes('childOfGroup')) stack[m.lvl].push(m);
      // For all vertices: push  current memory m to memory array (#childOfNonGroup as well)
      memory.push({
        lvl: m.lvl,
        id: m.id,
        name: m.name,
        pidClass: m.pidClass,
        parentId: m.parent ? m.parent.id : 1, // catches vertices with no parent (Enterprise level) and sets parentId to 1 ('Legato' root node)
        parent: vertices.find((vertex) => vertex.id === v.parentId),
        siblings: vertices.filter((sibling) => sibling.parentId === v.parentId),
        children: m.children,
        descendants: m.descendants,
        tag0: m.tags[0],
        tag1: m.tags[1],
        tag2: m.tags[2],
        tag3: m.tags[3],
        x: m.x,
        y: m.y,
        w: m.w,
        h: m.h,
        area: m.area,
        left: m.left,
        top: m.top,
        right: m.right,
        bottom: m.bottom,
      });
      console.log(stack[m.lvl]);
      console.groupEnd();
      console.groupEnd();
    }
    console.groupEnd();
  });

  // FIXME: PROVISIONAL TO PLOT WANTED DATA (LIKE X Y W AND H AS TABLE) AFTER SETTING PIDJSON
  let data = [];
  let verticesData = pidJson.filter(object => object._vertex === "1");
  let tableData;
  verticesData.forEach((v) => {
    tableData = {
      // Constants:
      lvl: v.pidLevel,
      id: v.id,
      name: v.shortName,
      pidClass: v.pidClass,
      pidHierarchy: v.pidHierarchy,
      x: v.mxGeometry._x,
      y: v.mxGeometry._y,
      w: parseInt(v.mxGeometry._width),
      h: parseInt(v.mxGeometry._height),
    };
    data.push(tableData);
  });

  /*************************END OF VERTICES LOOP********************************/

  function getParent(parentId, array) {
    return vertices.find((vertex) => vertex.id === parentId);
  }

  function getSiblings(parentId, array) {
    return memory.filter((sibling) => sibling.parentId === parentId);
  }

  function getChildren(id, array) {
    return array.filter((child) => child.parentId === id);
  }

  function getDescendants(id, array) {
    /**
     * Flattens deeply nested arrays recursively with concat.
     */
    // Termination:
    if (!id) return;
    // Base case:
    let descendants = [];
    // Recursion
    let children = array.filter((child) => child.parentId === id);
    children.forEach((child) => {
      descendants.push(child);
      let grandchildren = getDescendants(child.id, array); // recursive
      descendants = Array.isArray(grandchildren) ? descendants.concat(grandchildren) : descendants; // if grandchildren array is not empty, concatenate it, else, return existing
    });
    return descendants;
  }

  function findMax(variable, array) {
    /**
     * Receives a variable name(string) and an array, maps corresponding values from array
     * to an array and returns the maximum.
     */
    return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
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

  function getAbsoluteSides(descendants, m) {
    /**
     * Gets absolute sides of descendants (considering the parent's/grandparent's position)
     */
    let descendantSides = [];
    descendants.map((descendant) => {
      let cell = {
        left: getAbsolute("left", descendant, m),
        right: getAbsolute("right", descendant, m),
        top: getAbsolute("top", descendant, m),
        bottom: getAbsolute("bottom", descendant, m)
      }
      console.log(cell);
      descendantSides.push(cell);
    });
    return descendantSides;
  }

  function getAbsolute(variable, descendant, parent) {
    /**
     * Receives a variable name (string) and an array and returns the absolute value
     */
    let levelDifference = descendant.lvl - parent.lvl;
    console.log("levelDifference");
    console.log(levelDifference);
    if (1 === levelDifference) return descendant[variable];
    else if (2 === levelDifference) {
      let parent = memory.find((parent) => parent.id === descendant.parentId);
      return descendant[variable] - parent[variable];
    } else if (3 === levelDifference) {
      let parent = memory.find((parent) => parent.id === descendant.parentId);
      let grandparent = memory.find((grandparent) => grandparent.id === parent.id);
      return descendant[variable] - grandparent[variable];
    }
  }

  function packBlocks(children, vertices, memory) {
    /* Runs algorithm to optimally pack blocks based on passed sorting option,
     * updates the original properties in the vertices and memory arrays 
     * and returns scaled group dimmensions for setting m.w and m.h of current group
     */

    console.group(`Packing blocks.`);

    let root;
    let blocks;

    console.table(children);

    // 1) Measure children blocks with included margin (padded blocks)
    blocks = getScaledBlocks(children);

    // 2) Pre-sort input array by longest block side (either width or height) 
    blocks = sortBlocksBy('maxSide', blocks); // Options: flows, none, width, height, area

    console.log('Before:');
    console.log(blocks);

    // 3) Binary tree bin packing algorithm to calculate x and y
    fit(blocks);
    // 4) Set x and y properties of shapes in original arrays
    updateProperties(blocks, vertices, memory);


    console.log('After:');
    console.log(blocks);

    //////////////////////// FUNCTION DECLARATIONS ////////////////////////////////

    function getScaledBlocks(children) {
      console.log(`Measuring and scaling blocks.`);
      let blocks = [];
      children.forEach((child) => {

        let childDescendants = getDescendants(child.id, memory);
        childDescendants.push(child);

        console.log(child);
        console.log(childDescendants);

        blocks.push({
          // Work with properties of scaled block inside 
          id: child.id,
          name: child.name,
          lvl: child.lvl,
          pidClass: child.pidClass,
          pidHierarchy: child.pidHierarchy,
          descendants: childDescendants,
          w: measureBlock('width', childDescendants), // scales block (applies padding)
          h: measureBlock('height', childDescendants), // scales block (applies padding)
          x: 0, // Reset x
          y: 0, // Reset y
          a: child.w * child.h
        })
      });
      return blocks;
    }

    function sortBlocksBy(sortOrder, blocks) {
      if ('maxSide' === sortOrder)
        return blocks.sort((b1, b2) => (b2.w > b2.h ? b2.w : b2.h) - (b1.w > b1.h ? b1.w : b1.h));
      else if ('flows' === sortOrder) {} else if ('none' === sortOrder) {} else if ('width' === sortOrder) {} else if ('height' === sortOrder) {} else if ('area' === sortOrder) {}
      return sortedBlocks;
    }

    function fit(blocks) {
      // Credits: copyright(c) 2011, 2012, 2013, 2014, 2015, 2016 Jake Gordon and contributors
      let count = blocks.length;
      let w = count > 0 ? blocks[0].w : 0;
      let h = count > 0 ? blocks[0].h : 0;
      let node;
      root = {
        x: 0,
        y: 0,
        w: w,
        h: h
      };
      blocks.forEach((block) => {
        if (node = findNode(root, block.w, block.h))
          block.fit = splitNode(node, block.w, block.h);
        else
          block.fit = scaleNode(block.w, block.h)
      });
    }

    function findNode(root, w, h) {
      if (root.used)
        return findNode(root.right, w, h) || findNode(root.down, w, h);
      else if ((w <= root.w) && (h <= root.h))
        return root;
      else
        return null;
    }

    function splitNode(node, w, h) {
      node.used = true;
      node.down = {
        x: node.x,
        y: node.y + h,
        w: node.w,
        h: node.h - h
      };
      node.right = {
        x: node.x + w,
        y: node.y,
        w: node.w - w,
        h: h
      };
      return node;
    }

    function scaleNode(w, h) {
      let canScaleDown = (w <= root.w);
      let canScaleRight = (h <= root.h);

      let shouldScaleDown = canScaleDown && (root.w >= (root.h + h)); // attempt to keep square-ish by scaleing down  when width  is much greater than height
      let shouldScaleRight = canScaleRight && (root.h >= (root.w + w)); // attempt to keep square-ish by scaleing right when height is much greater than width

      if (shouldScaleRight)
        return scaleRight(w, h);
      else if (shouldScaleDown)
        return scaleDown(w, h);
      else if (canScaleRight)
        return scaleRight(w, h);
      else if (canScaleDown)
        return scaleDown(w, h);
      else
        return null; // if group has only one child or if sensible root starting size not ensured
    }

    function scaleRight(w, h) {
      root = {
        used: true,
        x: 0,
        y: 0,
        w: root.w + w,
        h: root.h,
        down: root,
        right: {
          x: root.w,
          y: 0,
          w: w,
          h: root.h
        }
      };
      let node = findNode(root, w, h);
      if (node)
        return splitNode(node, w, h);
      else
        return null;
    }

    function scaleDown(w, h) {
      root = {
        used: true,
        x: 0,
        y: 0,
        w: root.w,
        h: root.h + h,
        down: {
          x: 0,
          y: root.h,
          w: root.w,
          h: h
        },
        right: root
      };
      let node = findNode(root, w, h);
      if (node)
        return splitNode(node, w, h);
      else
        return null;
    }

    function updateProperties(blocks, vertices, memory) {

      blocks.forEach((block) => {
        console.log(block);
        // Updates the mxGeometry._x property of the original vertex in vertices

        // Get corresponding object in vertices and memory arrays
        let originalVertex = vertices.find(v => v.id === block.id);
        let memoryVertex = memory.find(v => v.id === block.id);

        console.log(originalVertex);
        console.log(memoryVertex);

        // Get x and y coordinates and catch null values (if one or zero child exist, set to margin)
        let xWithOffset = block.fit !== null ? Math.round(block.fit.x) + s.margin : s.margin; // offset from parent if one child
        let yWithOffset = block.fit !== null ? Math.round(block.fit.y) + s.margin : s.margin; // offset from parent if one child

        console.log(`Updating coordinates of ${block.id}: ${block.name} to (${xWithOffset}, ${yWithOffset}) ${xWithOffset === null ? '(null)' : ''}`);

        // Update properties in vertices array
        originalVertex.mxGeometry._x = xWithOffset;
        originalVertex.mxGeometry._y = yWithOffset;
        // FIXME: Arreglar que si uncommenteo siguientes dos lineas para que a partir de units w y h no sea NaN desaparecen los units, y si no, no se dibujan los grupos grises
        //originalVertex.mxGeometry._width = isNaN(originalVertex.mxGeometry._width) ? memoryVertex.w : block.fit.width;
        //originalVertex.mxGeometry._height = isNaN(originalVertex.mxGeometry._height) ? memoryVertex.h : block.fit.height;
        // Update properties in memory array
        memoryVertex.x = xWithOffset;
        memoryVertex.y = yWithOffset;
        memoryVertex.a = m.w * m.h;
        memoryVertex.left = xWithOffset;
        memoryVertex.top = yWithOffset;
        memoryVertex.right = xWithOffset + memoryVertex.w;
        memoryVertex.bottom = yWithOffset + memoryVertex.h;
      });
    }

    let scaledGroup = {
      width: Math.abs(getMin("left", memory)) + getMax("right", memory),
      height: Math.abs(getMin("top", memory)) + getMax("bottom", memory)
    };
    console.log('scaledGroup:');
    console.log(scaledGroup);
    console.groupEnd();

    return scaledGroup;
  }

  function measureBlock(dimension, shapes) {
    /**
     * Get all group descendants (not only those in previous stack: stack[p.lvl])
     * and dimension width and height from top-left to bottom-right corner of block.
     */
    if (dimension === 'width') return Math.abs(getMin("left", shapes)) + getMax("right", shapes);
    if (dimension === 'height') return Math.abs(getMin("top", shapes)) + getMax("bottom", shapes);
  }

  function scaleGroup(blockWidth, blockHeight, margin, shapes) {
    /**
     * Update group dimensions by padding them with the corresponding margin
     */
    const blockArea = blockWidth * blockHeight;
    let groupWidth = 2 * margin + blockWidth;
    let groupHeight = 2 * margin + blockHeight;
    let groupArea = (2 * margin + blockWidth) * (2 * margin + blockHeight);
    console.log(`blockWidth = ${Math.abs(getMin("left", shapes))} + ${getMax("right", shapes)} = ${blockWidth}`);
    console.log(`blockHeight = ${Math.abs(getMin("top", shapes))} + ${getMax("bottom", shapes)} = ${blockHeight}`);
    console.log(`blockArea = ${blockWidth} + ${blockHeight} = ${blockArea}`);
    console.log(`groupArea = (margin + blockWidth + margin) * (margin + blockHeight + margin) = groupArea`);
    console.log(`groupArea = (${margin}+${blockWidth}+${margin}) * (${margin}+${blockHeight}+${margin}) = ${groupArea}`);
    console.log(`sumOfCellAreas = ${totalSum("area", shapes)}  ->  blockArea = ${blockArea}  ->  groupArea = ${groupArea}`);
    m.w = groupWidth;
    m.h = groupHeight;
    m.area = groupArea;
  }

  function shiftNucleusGroup(blockX, blockY, stack) {
    /**
     * Shifts nucleus group from its previous sibling by the corresponding offset,
     * if not first sibling, if else set at origin (0,0) relative to its parent
     */

    const stackLength = stack.length;

    // CHANGE COORDINATE SYSTEM:
    // Get coordinates of nucleus in relation to coordinates of block, because 
    // only nucleus should be shifted (and with that, descendants shift as well together with it)
    // (blockX and blockY are relative to nucleus origin of (0,0) and nucleusX 
    // and nucleusY should be relative to the origin of the parent of the nucleus)

    // Set nucleus corner at origin-blockX so that nucleusGroup corner lands on origin (0, 0) (ex: if nucleusGroup at x=10, sets to 0-10 so that nucleus set to - 10 which leaves the nucleusGroup at origin)
    let nucleusX = 0 - blockX; 
    let nucleusY = 0 - blockY;

    if (stackLength === 0) {
      // Case if nucleus is first innerGroup in group of current level
      console.log(`${groupLength + 1}st innerGroup (nucleus) in stack[${m.lvl}].`);

      // Shift NUCLEUS (and with that it's descendants):
      m.x = p.x + p.w + nucleusX;
      m.y = p.y + p.h + nucleusY;

      console.log(`nucleusGroup (innerGroup) is first of stack an thus positioned at (${m.x}, ${m.y})`);
      } else if (stackLength >= 1) {
      // Case if nucleus is second, third, ..., n-th innerGroup in 
      console.log(`nucleusGroup (innerGroup) number ${stackLength + 1} in stack[${m.lvl}].`);
      const indexOfPrevious = stackLength - 1;
      console.log(stackLength);
      console.log(indexOfPrevious);
      const xOfPrevious = stack[indexOfPrevious].x;
      const yOfPrevious = stack[indexOfPrevious].y;
      const wOfPrevious = stack[indexOfPrevious].w;
      const hOfPrevious = stack[indexOfPrevious].h;

      // Shift NUCLEUS (and with that it's descendants): x: offset from previous, y: inline with previous (both analog to #inline)
      m.x = xOfPrevious + wOfPrevious + s.groupSpacing + nucleusX;
      m.y = yOfPrevious + (hOfPrevious - m.h) / 2 + nucleusY;
      //m.y = (yOfPrevious) + (hOfPrevious / 2) + (hOfPrevious / 2) + nucleusY;

      console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.groupSpacing + nucleusX = ${xOfPrevious} + ${wOfPrevious} + ${s.groupSpacing} + ${nucleusX} = ${m.x}`);
      console.log(`y-Coordinate = yOfPrevious + nucleusY = ${yOfPrevious} + ${nucleusY} = ${m.y}`);
      console.log(`nucleusGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
    }

    console.log(`Coordinates set to: (${m.x}, ${m.y})`);
  }

  function shiftInnerGroup(stack) {
    /**
     * Shifts nucleus group from its previous sibling by the corresponding offset,
     * if not first sibling, if else set at origin (0,0) relative to its parent
     */

    const stackLength = stack.length;

    if (stackLength === 0) {
      // Case for first innerGroup in stack of current level
      console.log(`${stackLength + 1}st innerGroup in stack[${m.lvl}].`);
      m.x = 0;
      m.y = 0;
      console.log(`innerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`);
    } else if (stackLength >= 1) {
      // Case for second, third, ..., n innerGoup in stack
      console.log(`innerGroup number ${stackLength + 1} in stack[${m.lvl}].`);
      const indexOfPrevious = stackLength - 1;
      console.log(stackLength);
      console.log(indexOfPrevious);
      const xOfPrevious = stack[indexOfPrevious].x;
      const yOfPrevious = stack[indexOfPrevious].y;
      const wOfPrevious = stack[indexOfPrevious].w;
      const hOfPrevious = stack[indexOfPrevious].h;
      console.log(xOfPrevious);
      console.log(yOfPrevious);

      // Set x and y analog to #inline
      m.x = xOfPrevious + wOfPrevious + s.groupSpacing;
      m.y = yOfPrevious + (hOfPrevious - m.h) / 2;

      console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`);
      console.log(`y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`);
      console.log(`innerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
    }

    console.log(`Coordinates set to: (${m.x}, ${m.y})`);
  }

  // // 3c) #outerGroup
  // function shiftOuterGroup(stack) {
  //   /**
  //    * Shifts nucleus group from its previous sibling by the corresponding offset,
  //    * if not first sibling, if else set at origin (0,0) relative to its parent
  //    */

  //   const stackLength = stack.length;

  //   if (stackLength === 0) {
  //     // Case for first outerGroup in stack of current level
  //     console.log(`${stackLength + 1}st outerGroup in stack[${m.lvl}].`);
  //     m.x = 0;
  //     m.y = 0;
  //     console.log(`outerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`);
  //   } else if (stackLength >= 1) {
  //     // Case for second, third, ..., n innerGoup in stack
  //     console.log(`outerGroup number ${stackLength + 1} in stack[${m.lvl}].`);
  //     const indexOfPrevious = stackLength - 1;
  //     console.log(stackLength);
  //     console.log(indexOfPrevious);
  //     const xOfPrevious = stack[indexOfPrevious].x;
  //     const yOfPrevious = stack[indexOfPrevious].y;
  //     const wOfPrevious = stack[indexOfPrevious].w;
  //     const hOfPrevious = stack[indexOfPrevious].h;
  //     console.log(xOfPrevious);
  //     console.log(yOfPrevious);
  //     // Set x and y analog to #inline
  //     m.x = (xOfPrevious === undefined ? 0 : xOfPrevious + wOfPrevious + s.groupSpacing);
  //     m.y = (yOfPrevious === undefined ? 0 : yOfPrevious + (hOfPrevious - m.h) / 2);
  //     console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`);
  //     console.log(`y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`);
  //     console.log(`outerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
  //   }

  //   console.log(`Coordinates set to: (${m.x}, ${m.y})`);
  // }

  function shiftChildren(blockWidth, blockHeight, stack) {
    /**
     * Center block inside group: offset all contained vertices within the group individually
     */

    stack.forEach((child) => {
      if ("group" !== child.pidClass) {
        // Case for non-group children (ex. nucleus or lone shapes)
        // APPLY margin
        console.group(`Applying margin offset of ${s.margin} to ${child.name} for x and y.`);

        // Get all descendants (block)
        let descendantsWithParent = getDescendants(child.id, memory);
        descendantsWithParent.push(child); // Push root/parent vertex as well

        let rights = descendantsWithParent.map((descendant) => descendant.right);
        let lefts = descendantsWithParent.map((descendant) => descendant.left);
        let tops = descendantsWithParent.map((descendant) => descendant.top);
        let bottoms = descendantsWithParent.map((descendant) => descendant.bottom);

        // Measure block of all descendants
        let blockWidth = measureBlock('width', m.descendants);
        let blockHeight = measureBlock('height', m.descendants);

        // Calculate relative offset for inline alignment of siblings (shift relative to previous sibling):
        const xShift = ((m.w / 2) - (blockWidth / 2));
        const yShift = ((m.h / 2) - (child.h / 2));
        console.warn(`xShift = ${m.w} / 2 - ${blockWidth} / 2 = ${xShift}`);
        console.warn(`yShift = ${m.h} / 2 - ${child.h} / 2 = ${yShift}`);

        // Apply Offset:
        applyOffset("x", xShift, child);
        applyOffset("y", yShift, child);

        // Calculate absolute offset to center siblings in group (relative to containing group):
        const yCenteringOffset = ((m.h / 2) - (child.h / 2) - child.y); // subtracts starting offset of child in parent
        console.warn(`yCenteringOffset = ${blockHeight} / 2 - ${child.h} / 2 = ${yCenteringOffset}`);

        // Apply absolute offset (center vertically in group)
        applyOffset("y", yCenteringOffset, child);

        console.groupEnd();
      } else if ("group" === child.pidClass) {
        // Case for children that are group (ex.innerGroups that have other innerGroups as chidlren like units, and maybe emodules).
        console.group(`Applying margin offset of ${s.margin} to ${child.name} for x and y.`);
        const xOffset = ((m.w / 2) - (blockWidth / 2));
        const yOffset = ((m.h / 2) - (child.h / 2));
        console.warn(`xOffset = ${m.w} / 2 - ${blockWidth} / 2 = ${xOffset}`);
        console.warn(`yOffset = ${m.h} / 2 - ${child.h} / 2 = ${yOffset}`);

        applyOffset("x", xOffset, child);
        applyOffset("y", yOffset, child);
        console.groupEnd();
      }
      if (m.id === child.id) console.warn(`WARNING: Group container not excluded from for each because ids match: ${m.id} === ${child.id} --> TRUE`);
    });

  }

  function clearStack(previousStack) {
    /**
     * Clear stack[p.lvl] of previousPidLevel after offsetting them relative to their parent(currentPidLevel)
     */

    previousStack.length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
    console.log(`Cleared stack[${p.lvl}] of previous pidLevel (${p.lvl}) after offsetting the children relative to their parent (current vertex with pidLevel ${m.lvl})`);
  }

  function applyOffset(coordinate, offset, vertex) {

    if (coordinate === "x") {
      // Add x-offset to the mxGeometry._x property of the original vertex in vertices (and return value for setting to m.x)
      vertex.x += offset;
      let originalVertex = vertices.find(v => v.id === vertex.id);
      console.log(`Offsetting x-Coordinate by ${offset}: (${originalVertex.mxGeometry._x}) ->  (${vertex.x})`);
      originalVertex.mxGeometry._x = vertex.x;
      m.left = m.x;
      m.top = m.y;
      m.right = m.x + m.w;
      m.bottom = m.y + m.h;
    } else if (coordinate === "y") {
      // Add y-offset directly to the mxGeometry._y property of the original vertex in vertices (and return value for setting to m.x)
      vertex.y += offset;
      let originalVertex = vertices.find(v => v.id === vertex.id);
      console.log(`Offsetting y-Coordinate by ${offset}: (${originalVertex.mxGeometry._y}) ->  (${vertex.y})`);
      originalVertex.mxGeometry._y = vertex.y;
    }
  }

  function simplifyConnections(pidVertices, pidEdges) {
    /**
     * Simplifies connections from and to groups by replacing both the preEdge and
     * postEdge of that connection with a single, direct connection when that is
     * the case. NOTE: simplifiedId retains the id of the startEdge (so remaining
     * properties are inherited from the startEdge, which should have same as endEdge)
     */

    console.groupCollapsed("Simplifying connections of pidEdges...");

    let vertices = pidVertices;
    let edges = pidEdges;
    let simplifiedEdges = [];
    let idsToSkip = [];

    edges.forEach((edge) => {

      let startEdge;
      let endEdge;
      let source = getVertexBy('id', edge.sourceId, vertices);
      let target = getVertexBy('id', edge.targetId, vertices);

      // Case: if connection of edge already simplified and thus edge.id pushed to idsToSkip array
      if (idsToSkip.find((id) => id === edge.id)) {
        console.warn(`${edge.id} found in idsToSkip --> return`);
        return;
      }

      // Case: shape --> shape
      if ('group' !== target.pidClass && 'group' !== source.pidClass) {
        console.group(`edge ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass} --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
        idsToSkip.push(edge.id);
        simplifiedEdges.push(edge);
        console.groupEnd();
      }

      // Clse: group --> group
      else {
        console.group(`edge ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass} --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
        // Traverse connection back and forth (to first startPort and last endPort)
        startEdge = getFirstEdge(edge, source, target); // recursively get previousEdge until startEdge
        endEdge = getLastEdge(edge, source, target); // recursively get nextEdge until endEdge
        // Clone targetId and targetPort of endEdge and rest of startEdge
        let simplifiedEdge = startEdge;
        simplifiedEdge.targetId = endEdge.targetId;
        simplifiedEdge.targetPort = endEdge.targetPort;
        // Push a single, direct and simplified edge to the array
        simplifiedEdges.push(simplifiedEdge);

        let simplifiedEdgeSource = getVertexBy('id', simplifiedEdge.sourceId, vertices);
        let previousEdgeTarget = getVertexBy('id', simplifiedEdge.targetId, vertices);
        console.log(`simplifiedEdge ${simplifiedEdge.id}: ${simplifiedEdge.sourceId} | ${simplifiedEdgeSource.shortName} | ${source.pidClass} --> ${previousEdgeTarget.shortName} | ${source.pidClass} | ${edge.targetId}`);
        console.groupEnd();
      }
    });


    function getVertexBy(property, value, array) {
      return array.find((vertex) => vertex[property] === value);
    }

    function getFirstEdge(edge, source, target) {
      /**
       * Recursively get previousEdge until startEdge
       */
      idsToSkip.push(edge.id);
      console.log(idsToSkip.length);
      let previousEdge = getPreviousEdge(edge);
      if (!previousEdge) {
        console.log(`return ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass} --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
        return edge;
      } else {
        let previousEdgeSource = getVertexBy('id', previousEdge.sourceId, vertices);
        let previousEdgeTarget = getVertexBy('id', previousEdge.targetId, vertices);
        let firstEdge = getFirstEdge(previousEdge, previousEdgeSource, previousEdgeTarget);
        return firstEdge;
      }
    }

    function getPreviousEdge(edge) {
      // Find corresponding edge and clone
      return edges.find((previousEdge) => edge.sourcePort === previousEdge.targetPort);
      // Return clone or 'isStartEdge' string if previousEdge = undefined (no previousEdge found)
    }

    function getLastEdge(edge, source, target) {
      /**
       * Recursively get nextEdge until endEdge
       */
      idsToSkip.push(edge.id);
      console.log(idsToSkip.length);
      let nextEdge = getNextEdge(edge);
      if (!nextEdge) {
        console.log(`return ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass}) --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
      } else if (nextEdge) {
        let nextEdgeSource = getVertexBy('id', nextEdge.sourceId, vertices);
        let nextEdgeTarget = getVertexBy('id', nextEdge.targetId, vertices);
        getLastEdge(nextEdge, nextEdgeSource, nextEdgeTarget);
      }
      return edge;
    }

    function getNextEdge(edge) {
      // Find corresponding edge and clone
      return edges.find((nextEdge) => edge.targetPort === nextEdge.sourcePort);
    }

    console.groupEnd();
    return simplifiedEdges;
  }


  pidJson = [...vertices, ...simplifiedEdges];
  console.log('memory:');
  console.table(memory);
  console.log('data:');
  console.table(data);
  console.log('pidJson:');
  console.table(pidJson);
  return pidJson;
}


// TODO:
function rotateVertices() {
  // rotate vertices (ex. valves) based on connections and positioni
}


function generatePidXmlString(pidJson) {
  console.groupCollapsed("Generating pidXmlString from pidJson...");
  console.log("pidJson:");
  console.table(pidJson);
  // Filter nodes by their individual pidClasses and create new
  // individual objects (not too expensive and filtered once before
  // layout algorithm and string generation, both which need filtered data
  let pidEquipments;
  pidEquipments = pidJson.filter(pidInstance => pidInstance.pidClass === "equipment");
  let pidInstruments;
  pidInstruments = pidJson.filter(pidInstance => pidInstance.pidClass === "instrument");
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

  function getSapientBind(shape) {
    // if ('equipment' === shape.pidClass) {
    //   let sapientBind = {
    //     datasources: {
    //       pValueCurrent: {
    //         source: 'var',
    //         params: {
    //         id: shape.id
    //         }
    //     }
    //     },
    //     bindings: {
    //       text: {
    //         value: {
    //         source: 'dataref',
    //         defaultValue: '---',
    //         params: {
    //             ref: 'pValueCurrent'
    //         }
    //         }
    //       }
    //     }
    //   };
    //   const sapientBindString = JSON.stringify(sapientBind);
    //   console.log(sapientBindString);
    //   const escapedSapientBind = this.escapeToHtmlValid(sapientBindString);
    //   console.log(escapedSapientBind);
    // }
    // else if ('instrument' === shape.pidClass) {}
    // else if ('arrow' === shape.pidClass) {}
    // else if ('group' === shape.pidClass) {}
    // else if ('line' === shape.pidClass) {}
    // return escapedSapientBind;
    return '';
  }

  // TODO: Set labels in value attribute in pid-shapes-library and set label=${pidEquipment.value} in template literals
  const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
  const htmlLabelInstrument = '&lt;table cellpadding=&quot;4&quot; cellspacing=&quot;0&quot; border=&quot;0&quot; style=&quot;font-size:1em;width:100%;height:100%;&quot;&gt;&lt;tr&gt;&lt;td&gt;%pid-function%&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;%pid-number%&lt;/td&gt;&lt;/table&gt; ';
  const htmlLabelGroup = '%pid-hierarchy%: %pid-label%';
  const htmlLabelLine = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%pid-current-value%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';
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
    <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${pidEquipment._value !== '' ? pidEquipment._value : htmlLabel}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : (pidEquipment.shortName ? pidEquipment.shortName : (pidEquipment.germanName ? pidEquipment.germanName : (pidEquipment.englishName ? pidEquipment.englishName : null)))}" pid-current-value="${pidEquipment.id}" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="${getSapientBind(pidEquipment)}">
        <mxCell style="${concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" connectable="1" parent="${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}">
          <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
  });

  const instrumentCount = pidInstruments.length;
  console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
  pidInstruments.forEach((pidInstrument) => {
    xmlString += `
    <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : (pidInstrument.shortName ? pidInstrument.shortName : (pidInstrument.germanName ? pidInstrument.germanName : (pidInstrument.englishName ? pidInstrument.englishName : null)))}" pid-current-value="${pidInstrument.id}" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="${getSapientBind(pidInstrument)}">
      <mxCell style="${concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" connectable="1" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
        <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  const arrowCount = pidArrows.length;
  console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
  pidArrows.forEach((pidArrow) => {
    xmlString += `
    <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${pidArrow._value !== '' ? pidArrow._value : htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : (pidArrow.shortName ? pidArrow.shortName : (pidArrow.germanName ? pidArrow.germanName : (pidArrow.englishName ? pidArrow.englishName : null)))}" pid-current-value="${pidArrow.id}" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="${getSapientBind(pidArrow)}">
      <mxCell style="${concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" connectable="1" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
        <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  const groupCount = pidGroups.length;
  console.log(`Generating XML-tags for ${groupCount} group instances...`);
  pidGroups.forEach((pidGroup) => {
    xmlString += `
    <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${pidGroup._value !== '' ? pidGroup._value : htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : (pidGroup.shortName ? pidGroup.shortName : (pidGroup.germanName ? pidGroup.germanName : (pidGroup.englishName ? pidGroup.englishName : null)))}" pid-hierarchy="${pidGroup.pidHierarchy}" pid-current-value="${pidGroup.id}" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="${getSapientBind(pidGroup)}">
      <mxCell style="${concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" connectable="${pidGroup._connectable}" parent="${pidGroup.parentId ? pidGroup.parentId : pidGroup._parent}">
        <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : graphSettings.defaultPadding}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : graphSettings.defaultPadding}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
  });

  // Add edges:
  const lineCount = pidLines.length;
  console.log(`Generating XML-tags for ${lineCount} line instances...`);
  pidLines.forEach((pidLine) => {
    // Find parent of source vertex and set the edge parent to it as well (edges won't work with distinct parent as their source)
    const source = pidJson.find((vertex) => vertex.id === pidLine.sourceId);
    const target = pidJson.find((vertex) => vertex.id === pidLine.targetId);
    const parent = pidJson.find((parent) => parent.id === source.id);
    xmlString += `
    <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${pidLine._value !== '' ? pidLine._value : htmlLabelLine}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : (pidLine.shortName ? pidLine.shortName : (pidLine.germanName ? pidLine.germanName : (pidLine.englishName ? pidLine.englishName : 'Beer')))}" pid-current-value="${pidLine.id}" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="${getSapientBind(pidLine)}">
      <mxCell id="${pidLine.id ? pidLine.id : pidLine._id}" style="${concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${parent.id ? parent.id : pidLine._parent}">
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
    .replace(/\n/g, "<br />")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&quot;")
  return htmlString;
}

let pidJsonAfter = vertexPlacement(pidJson);
console.log("pidJson after:");
console.log(pidJsonAfter);
pidXmlString = generatePidXmlString(pidJsonAfter);
renderXml(pidXmlString);