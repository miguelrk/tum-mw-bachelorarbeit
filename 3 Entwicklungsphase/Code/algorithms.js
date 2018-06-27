console.log('pidVertices:');
console.table(pidVertices);
console.log('pidEdges');
console.table(pidEdges);

function vertexPlacement() {
  let vertices = pidVertices;
  let edges = pidEdges;
  console.log(JSON.stringify(vertices));
  console.log(JSON.stringify(edges));

  // SET ONCE AND NEVER RESET
  let settings = {
    spacing: 100,
    padding: 0,
    border: 0,
    margin: 0,
    groupSpacing: 300,
    groupPadding: 0,
    groupBorder: 0,
    groupMargin: 0,
  };
  let areas = []; // areas: temporary record of areas of contained cells in group (siblings)
  let previousVertex = null; // previousVertex: previous vertex of each current vertex

  vertices.forEach((v) => {
    if (v.shapeName) {
      // SET AND RESET FOR EACH VERTEX
      // Frequently accessed variables: ('_' indicates mxGraph private variable)
      let name = v.shortName;
      let lvl = v.pidLevel;
      let pidClass = v.pidClass;
      let parentId = v.parentId;
      let parent = vertices.find((vertex) => vertex.id === v.parentId);
      let parentName = parent.shortName;
      let siblings = vertices.filter((sibling) => sibling.parentId === v.parentId); // Skip? Maybe only need length of siblings array and not siblings array
      let siblingsCount = siblings.length;
      // Local variables: (for calculations)
      let x = v.mxGeometry._x;
      let y = v.mxGeometry._y;
      let w = v.mxGeometry._width;
      let h = v.mxGeometry._height;

      if (pidClass === 'equipment' || pidClass === 'instrument' || pidClass === 'arrow') {
        // SET AND RESET FOR EACH EQUIPMENT/INSTRUMENT/ARROW:
        let a = w * h; // calculate cell area
        areas.push(a); // store cell area
        // Apply positioning rules based on pidClass
        /*
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |  previous\current | agitators | arrow | compressors_-_iso | heat_exchangers | engines | flow_sensors | filters | pumps_-_iso | valve | group | instruments | vessels |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |     agitators     |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |       arrow       |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            | compressors_-_iso |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |  heat_exchangers  |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |      engines      |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |    flow_sensors   |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |      filters      |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |    pumps_-_iso    |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |       valve       |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |       group       |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |    instruments    |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |      vessels      |           |       |                   |                 |         |              |         |             |       |       |             |         |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
        */
        if (v.pidLevel === previousVertex.pidLevel) {
          const isParent = false;

        } else if (lvl > previousVertex.pidLevel) {
          const isParent = true;
        }
        switch (pidClass) {
          case 'equipment':
            break;
          case 'instrument':
            break;
          case 'arrow':
            // Do nothing (arrows are not modelled, therefore non-existent)
            break;
          default:
            // Skip enterprise level because it has no pidShape, therefore no pidClass
            break;
        }
      } else if (pidClass === 'group') {
        // SET AND RESET FOR EACH GROUP:
        // Sum areas of contained cells in current group
        let groupArea = areas.reduce((totalArea, a) => totalArea + a);
        areas.length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
        // Set w and h (of current group) to groupArea sides
        // FIXME: instead set w and based on the required w and h from positioning after rules applied
        w = Area.sqrt(groupArea);
        h = Area.sqrt(groupArea);
        break;
      }

      // Skips next siblings up to the containing group
      pathPosition += siblingsCount;


      // Set mxGraph private variables to calculated values
      v.mxGeometry._x = x;
      v.mxGeometry._y = y;
      v.mxGeometry._width = w;
      v.mxGeometry._height = h;

      console.group(name);
      console.log(`lvl: ${lvl}`);
      console.log(`parent: ${parentName}`);
      console.log(`siblings: `);
      console.log(siblings);
      console.log(`siblingsCount: `);
      console.log(siblingsCount);
      console.log(`x: ${v.mxGeometry._x}`);
      console.log(`y: ${v.mxGeometry._y}`);
      console.log(`w: ${v.mxGeometry._width}`);
      console.log(`h: ${v.mxGeometry._height}`);
      console.groupEnd();
    }
    previousVertex = v;
  });

}

vertexPlacement();