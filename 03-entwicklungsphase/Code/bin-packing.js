// ORTHOGONAL PACKING: https: //arxiv.org/pdf/1711.07851.pdf

/******************************************************************************
https://github.com/jakesgordon/bin-packing

This is a binary tree based bin packing algorithm that is more complex than
the simple Packer (packer.js). Instead of starting off with a fixed width and
height, it starts with the width and height of the first block passed and then
scales as necessary to acomodate each subsequent block. As it scales it attempts
to maintain a roughly square ratio by making 'smart' choices about whether to
scale right or down.
When scaleing, the algorithm can only scale to the right OR down. Therefore, if
the new block is BOTH wider and taller than the current target then it will be
rejected. This makes it very important to initialize with a sensible starting
width and height. If you are providing sorted input (largest first) then this
will not be an issue.
A potential way to solve this limitation would be to allow scaleth in BOTH
directions at once, but this requires maintaining a more complex tree
with 3 children (down, right and center) and that complexity can be avoided
by simply choosing a sensible starting block.
Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height).
Inputs:
------
  blocks: array of any objects that have .w and .h attributes
Outputs:
-------
  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates
Example:
-------
  var blocks = [
    { w: 100, h: 100 },
    { w: 100, h: 100 },
    { w:  80, h:  80 },
    { w:  80, h:  80 },
    etc
    etc
  ];
  var packer = new ScalingPacker();
  packer.fit(blocks);
  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.w, block.h);
    }
  }
******************************************************************************/

// unit_groups: children stack
var stack = [{

    w: 920,
    h: 1090
  },
  {
    w: 820,
    h: 1240
  },
  {
    w: 1835,
    h: 1050
  },
  {
    w: 2010,
    h: 610
  }
];

function packBlocks(children) {

  let root;
  let blocks;
  blocks = getScaledBlocks(children);
  blocks = sortBlocksBy('maxSide', blocks); // Options: flows, none, width, height, area
  console.log('Before:');
  console.log(blocks);

  // Binary tree bin packing algorithm to calculate x and y
  fit(blocks);
  // Set x and y properties of shapes in original arrays
  updateProperties(blocks, vertices, memory);


  console.log('After:');
  console.log(blocks);
  blocks.forEach((block) => console.log(block.fit.down));
  blocks.forEach((block) => console.log(block.fit.right));

  //////////////////////// FUNCTION DECLARATIONS ////////////////////////////////

  function getScaledBlocks(children) {
    let blocks = [];
    children.forEach((child) => {

      let childDescendants = getDescendants(child.id, vertices);
      childDescendants.push(child);
      
      
      blocks.push({
        // Work with properties of scaled block inside 
        id: child.id,
        name: child.name,
        lvl: child.lvl,
        pidClass: child.pidClass,
        descendants: child.descendants,
        w: 2 * 50 + measureBlock('width', childDescendants), // scales block (applies padding)
        h: 2 * 50 + measureBlock('height', childDescendants), // scales block (applies padding)
        x: child.x,
        y: child.y,
        a: child.w * child.h
      });
    });
    return blocks;
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

  function measureBlock(dimension, shapes) {
    /**
     * Get all group descendants (not only those in previous stack: stack[p.lvl])
     * and dimension width and height from top-left to bottom-right corner of block.
     */
    if (dimension === 'width') return Math.abs(getMin("left", shapes)) + getMax("right", shapes);
    if (dimension === 'height') return Math.abs(getMin("top", shapes)) + getMax("bottom", shapes);
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

  function sortBlocksBy(sortOrder, blocks) {
    if ('maxSide' === sortOrder)
      return blocks.sort((b1, b2) => (b2.w > b2.h ? b2.w : b2.h) - (b1.w > b1.h ? b1.w : b1.h));
    else if ('flows' === sortOrder) {} else if ('none' === sortOrder) {} else if ('width' === sortOrder) {} else if ('height' === sortOrder) {} else if ('area' === sortOrder) {}
    return sortedBlocks;
  }

  function fit(blocks) {
    // Some code: copyright(c) 2011, 2012, 2013, 2014, 2015, 2016 Jake Gordon and contributors
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
      return null; // need to ensure sensible root starting size to avoid this happening
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
    let node;
    if (node = findNode(root, w, h))
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
    let node;
    if (node = findNode(root, w, h))
      return splitNode(node, w, h);
    else
      return null;
  }

  function updateProperties(blocks, vertices, memory) {

    blocks.forEach((block) => {
      // Updates the mxGeometry._x property of the original vertex in vertices
      console.log(`Updating coordinates of ${block.id}: ${block.name} to (${block.x}, ${block.y})`);
      // Get corresponding object in vertices and memory arrays
      let originalVertex = vertices.find(v => v.id === block.id);
      let memoryVertex = memory.find(v => v.id === block.id);
      // Update properties in vertices array
      originalVertex.mxGeometry._x = block.x;
      originalVertex.mxGeometry._y = block.y;
      // Update properties in memory array
      memoryVertex.mxGeometry._x = block.x;
      memoryVertex.mxGeometry._y = block.y;
      memoryVertex.left = block.x;
      memoryVertex.top = block.y;
      memoryVertex.right = block.x + m.w;
      memoryVertex.bottom = block.y + m.h;
    });
  }
}




packBlocks(stack);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////