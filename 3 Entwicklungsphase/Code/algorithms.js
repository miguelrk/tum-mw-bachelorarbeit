//console.log('pidJson before:');
//console.table(pidJson);

function vertexPlacement(pidJson) {
  console.group("Positioning vertices in graph...");
  let vertices = pidJson.filter((object) => object._vertex === '1');
  let edges = pidJson.filter((object) => object._edge === '1');
  //console.table(vertices);
  //console.log(JSON.stringify(vertices));
  //console.table(edges);
  //console.log(JSON.stringify(edges));

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
  let vertexIs = '';
  let offsetX = 0;
  let offsetY = 0;
  let areas = []; // areas: temporary record of areas of contained cells in group (siblings)
  let previousVertex = {}; // previousVertex: previous vertex of each current vertex

  vertices.forEach((v) => {
    // SET AND RESET FOR EACH VERTEX
    // Frequently accessed variables: ('_' indicates mxGraph private variable)
    let name = v.shortName;
    let lvl = v.pidLevel;
    let pidClass = v.pidClass;
    let id = v.id;
    let parent = vertices.find((vertex) => vertex.id === v.parentId);
    let siblings = vertices.filter((sibling) => sibling.parentId === v.parentId); // Skip? Maybe only need length of siblings array and not siblings array
    let siblingsCount = siblings.length;
    // Local variables: (for calculations)
    let x = v.mxGeometry._x;
    let y = v.mxGeometry._y;
    let w = v.mxGeometry._width;
    let h = v.mxGeometry._height;
    
    if (v.shapeName && v.parentId) {

      if (pidClass === 'equipment' || pidClass === 'instrument' || pidClass === 'arrow') {
        // SET AND RESET FOR EACH EQUIPMENT/INSTRUMENT/ARROW:
        let a = w * h; // calculate cell area
        areas.push(a); // store cell area
        // Apply positioning rules based on pidCategory
        /*
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |  previous\current | agitators | arrow | compressors_-_iso | heat_exchangers | engines | flow_sensors | filters | pumps_-_iso | valve | group | instruments | vessels |
            +-------------------+-----------+-------+-------------------+-----------------+---------+--------------+---------+-------------+-------+-------+-------------+---------+
            |     agitators     |     -     |       |                   |                 |         |              |         |             |       |       |             |         |
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
          
            POSITIONING RULES
              1) 
              2) 
              3) 
              4) 
              5) 
              6) 
              7) 
              8) 
              9) 
              10) 
              11) 
              12) 
        */
        if (lvl < previousVertex.pidLevel) { // back at parent
          vertexIs = 'parent';
        }
        else if(lvl === previousVertex.pidLevel) {
          vertexIs = 'sibling';
        }
        else if (lvl > previousVertex.pidLevel) { // back at parent
          vertexIs = 'child';
        }
        else 
        switch (pidClass) {
          case 'equipment':
            offsetX = 
            offsetY = 
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
        areas.push(0); // pushes zero so that array isn't empty if next vertex also a group
        offsetX = 0;
        offsetY = 0;
        // Set w and h (of current group) to groupArea sides
        // FIXME: instead set w and based on the required w and h from positioning after rules applied
        w = Math.sqrt(groupArea);
        h = Math.sqrt(groupArea);
      }

      // Set mxGraph private variables to calculated values
      v.mxGeometry._x = x;
      v.mxGeometry._y = y;
      v.mxGeometry._width = w;
      v.mxGeometry._height = h;

      console.groupCollapsed(`${lvl}: ${name} (${pidClass})`);
      console.log(`id: ${id}`);
      console.log(`parent: ${parent !== undefined ? parent.shortName : 'N/A'}`);
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
  console.groupEnd();
}

vertexPlacement(pidJson);
console.log('pidJson after:');
console.log(pidJson);
generatePidXmlString(pidJson);

function generatePidXmlString(pidJson) {
        //updateProgressBar(90);
        console.groupCollapsed("Generating pidXmlString from pidJson...");
        console.log('pidJson:');
        console.table(pidJson);
        // Filter nodes by their individual pidClasses and create new
        // individual objects (not too expensive and filtered once before
        // layout algorithm and string generation, both which need filtered data
        let pidEquipments;
        pidEquipments = pidJson.filter(
            pidInstance => pidInstance.pidClass === 'equipment'
        );
        let pidInstruments;
        pidInstruments = pidJson.filter(
            pidInstance => pidInstance.pidClass === 'instrument'
        );
        let pidArrows;
        pidArrows = pidJson.filter(
            pidInstance => pidInstance.pidClass === 'arrow'
        );
        let pidGroups;
        pidGroups = pidJson.filter(
            pidInstance => pidInstance.pidClass === 'group'
        );
        let pidLines;
        pidLines = pidJson.filter(
            pidInstance => pidInstance.pidClass === 'line'
        );

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
            grid: 1,
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
            background: '#ffffff',
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
    <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : pidEquipment.shortName ? pidEquipment.shortName : pidEquipment.germanName ? pidEquipment.germanName : pidEquipment.englishName}" pid-current-value="${pidEquipment.id}" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="">
        <mxCell style="${concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}">
          <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
    });

    const instrumentCount = pidInstruments.length;
    console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
    pidInstruments.forEach((pidInstrument) => {
      xmlString += `
    <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : pidInstrument.shortName ? pidInstrument.shortName : pidInstrument.germanName ? pidInstrument.germanName : pidInstrument.englishName}" pid-current-value="${pidInstrument.id}" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
        <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const arrowCount = pidArrows.length;
    console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
    pidArrows.forEach((pidArrow) => {
      xmlString += `
    <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : pidArrow.shortName ? pidArrow.shortName : pidArrow.germanName ? pidArrow.germanName : pidArrow.englishName}" pid-current-value="${pidArrow.id}" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
        <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const groupCount = pidGroups.length;
    console.log(`Generating XML-tags for ${groupCount} group instances...`);
    pidGroups.forEach((pidGroup) => {
      xmlString += `
    <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : pidGroup.shortName ? pidGroup.shortName : pidGroup.germanName ? pidGroup.germanName : pidGroup.englishName}" pid-hierarchy="${pidGroup.pidHierarchy}" pid-current-value="${pidGroup.id}" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="">
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
    <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${htmlLabel}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : pidLine.shortName ? pidLine.shortName : pidLine.germanName ? pidLine.germanName : pidLine.englishName}" pid-current-value="${pidLine.id}" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="">
      <mxCell style="${concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${pidLine.parentId ? pidLine.parentId : pidLine._parent}">
        <mxGeometry relative="${pidLine.mxGeometry._relative ? pidLine.mxGeometry._relative : 1}" as="${pidLine.mxGeometry._as ? pidLine.mxGeometry._as : 'geometry'}"></mxGeometry>
      </mxCell>
    </object>`;
    });


    // Add database bindings

    // Add boilerplate closing tags
    xmlString += `
  </root>
</mxGraphModel>`;

        console.log('pidXmlString');
        console.log(xmlString);
        console.groupEnd();
        console.groupEnd();
        //updateProgressBar(100);
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
        let formattedXmlString = formatXml(xmlString, '  ');
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
        //console.log(`pidHtmlString = \n${formattedHtmlString}`);
        document.getElementById(
            'xml-viewer-div'
        ).innerHTML = formattedHtmlString;
    }


    function formatXml(xml, tab) {
        // tab = optional indent value, default is tab (\t)
        //console.log('Formatting pidXmlString...');
        var formatted = '',
            indent = '';
        tab = tab || '\t';
        xml.split(/>\s*</).forEach((node) => {
            if (node.match(/^\/\w/))
                indent = indent.substring(tab.length); // decrease indent by one 'tab'
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