window.addEventListener('load', () => {

  console.log("Page loaded succesfully.");
  console.group("Waiting for file uploads...");

  // File inputs
  const libraryInput = document.getElementById("pid-shapes-library");
  const nodesInput = document.getElementById("pid-nodes");
  const connectionsInput = document.getElementById("pid-connections");
  const dataBindingsInput = document.getElementById("pid-data-bindings");
  // Buttons
  const generatePidButton = document.getElementById("generate-pid-button");
  const downloadJsonButton = document.getElementById("download-json-button");
  const downloadXmlButton = document.getElementById("download-xml-button");
  // Other
  const totalCounter = document.getElementById("total-counter");
  const xmlContainer = document.getElementById("xml-container-div");



  let file1Present = false;
  let file2Present = false;
  let file3Present = false;
  let file4Present = false;

  let pidShapesLibraryString;
  let pidShapesLibrary;
  let pidNodesString;
  let pidNodes;
  let pidConnectionsString;
  let pidConnections;
  let pidDataBindingsString;
  let pidDataBindings;


  let pidVertices;
  let pidEdges;
  let pidDatabaseBindings;
  let pidJson = [];
  let pidJsonString = '';
  let pidXmlString = '';
  let pidXml;


  if (window.File && window.FileReader && window.FileList) {
    // All the File APIs are supported.
  } else {
    alert("The File APIs are not fully supported in this browser.");
  }


  function loadJson(event) {
    let target = event.target.id;
    let files = event.target.files;
    var fileName = files[0].name;
    console.log(`Loading ${fileName} for ${target}...`);
    let jsonFile = event.target.files[0];
    let fileReader = new FileReader();

    if (!jsonFile.type.match("json")) {
      console.log("File Type is not of JSON type.");
    } else {
      fileReader.onload = (event) => {
        if (target === "pid-shapes-library") {
          pidShapesLibraryString = event.target.result;
          pidShapesLibrary = JSON.parse(pidShapesLibraryString);
          console.log(`${fileName} succesfully loaded`);
          //console.table(pidShapesLibrary);
          file1Present = true;
        } else if (target == "pid-nodes") {
          pidNodesString = event.target.result;
          pidNodes = JSON.parse(pidNodesString);
          console.log(`${fileName} succesfully loaded`);
          //console.table(pidNodes);
          file2Present = true;
        } else if (target == "pid-connections") {
          pidConnectionsString = event.target.result;
          pidConnections = JSON.parse(pidConnectionsString);
          console.log(`${fileName} succesfully loaded`);
          //console.table(pidConnections);
          file3Present = true;
        } else if (target == "pid-data-bindings") {
          pidDataBindingsString = event.target.result;
          pidDataBindings = JSON.parse(pidDataBindingsString);
          console.log(`${fileName} succesfully loaded`);
          //console.table(pidDataBindings);
          file4Present = true;
        } else {
          alert(`${fileName} is not the appropriate file for ${target} input. Please select the correct file.`);
        }
        // TODO: (file1Present && file2Present && file3Present && file4Present)
        if (file1Present && file2Present && file3Present) {
          generatePidButton.disabled = false;
          generatePidButton.className = 'enabled';
          console.groupEnd();
        }
      }
    }
    try {
      fileReader.readAsText(jsonFile); // Read the uploaded file (asyncronously)
    } catch (error) {
      console.error(error);
      return;
    }
  }
  libraryInput.addEventListener("change", loadJson, false);
  nodesInput.addEventListener("change", loadJson, false);
  connectionsInput.addEventListener("change", loadJson, false);
  dataBindingsInput.addEventListener("change", loadJson, false);


  function generatePidXml() {
    generatePidButton.disabled = true;
    generatePidButton.className = 'disabled';

    // Create node hierarchy out of parent relations
    let pidNodesTree = buildHierarchy(pidNodes); // TODO: buildHierarchy and pathfinder before mapNodesToShapes !!!!!!!!!!!!!!!!!!!! 

    // Traverse node hierarchy (post-order DFS) and return path (vertices array in order)
    let pidNodesInOrder = pathfinder(pidNodesTree);

    // Add vertices to pidJson
    pidVertices = mapNodesToShapes(pidShapesLibrary, pidNodesInOrder);

    // Add edges to pidJson
    pidEdges = mapConnectionsToShapes(pidShapesLibrary, pidConnections);

    // Add database bindings to pidJson 
    //pidDatabaseBindings = mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings);

    // Grid layout algorithm to set _x and _y attributes of vertices
    //placeVertices(pidVertices, pidEdges);
    
    // Concatenate arrays to single array using ES6 Spread operator
    // FIXME: Replace with: pidJson = [...pidVertices, ...pidEdges, ...pidDatabaseBindings];
    pidJson = [...pidVertices, ...pidEdges];

    // Generate JSON string from JS-Object (individually for 5 distinct pid classes)
    pidJsonString = JSON.stringify(pidJson);

    // Generate XML string from JS-Object
    pidXmlString = generatePidXmlString(pidJson);

    // Parse XML string to XML-Document (with DOM Parser)
    pidXml = parseXml(pidXmlString);

    // Render encoded XML String directly in markup (xml-container-div)
    renderXml(pidXmlString);

  }
  generatePidButton.addEventListener("click", () => {
    generatePidXml(pidShapesLibrary, pidNodes);
    //totalCounter.innerHTML = "";
  }, false);


  function buildHierarchy(flatArray) {
    console.groupCollapsed("Building hierarchy (pidNodeTree) from pidNodes...");
    console.log(flatArray);
    let treeArray = [];
    let lookup = [];

    flatArray.forEach((node) => {
      //console.log(node);
      let nodeId = node.id; // Select current node's id
      //console.log(`nodeId: ${nodeId}`);
      lookup[nodeId] = node; // Clone node to id key of lookup array 
      //console.log(lookup[nodeId]);
      node.children = []; // Add a children property (array type)
      //console.log('node[\'children\'] = \n');
      //console.log(node['children']);
    });
    flatArray.forEach((node) => {
      if (node.parent) {
        let nodeParent = node.parent;
        lookup[nodeParent].children.push(node);
      } else {
        treeArray.push(node);
      }
    });
    let treeString = JSON.stringify(treeArray);
    console.log('treeString = \n');
    console.log(treeString);
    console.log('tree = \n');
    console.log(treeArray);
    console.groupEnd();
    return treeArray;
  }


  function pathfinder(treeArray) {
    /**
     * Takes a tree (hierarchical JS-object with children array) and traverses
     * it (post-order DFS - depth-first search) to return the path of the
     * traversed vertices in the form of an ordered array of JS-objects.
     */
    console.groupCollapsed("Traversing pidNodeTree depth-first to find path...");
    // TODO: map root extendedProperties ISO-Hierarchy-Class (ex. eModule) to the corresponding pidLevel to start from there
    const isoHierarchy = [ // Plant hierarchy ISA-S88.01:
      "enterprise", // May contain a site
      "site", // May contain an area
      "area", // May contain a processCell
      "process_cell", // Must contain a unit
      "unit", // May contain a equipment module
      "equipment_module", // May contain a control module
      "control_module", // May contain other control modules (recursively)
      "control_module", // If recursion
      "control_module", // If recursion
      "control_module", // If recursion
      "control_module", // If recursion
      "control_module" // If recursion
    ];
    let path = [];
    let stack = [];
    let tree = treeArray;

    // For each root vertex (works even if more than one root)
    tree.forEach((v) => {
      // Set/reset pidLevel for roots (NOTE: skips enterprise level)
      let level = 1;
      v.pidLevel = level;
      v.pidHierarchy = isoHierarchy[level];
      //console.log("Root = \n");
      //console.log(v);
      // Add root to stack
      stack.push(v);

      // While stack exists and not empty (vertices pending in stack)
      while (stack && stack.length) {
        //console.log("stack = \n");
        //console.log(stack);
        // Pop next vertex from top of stack
        v = stack.pop();
        //console.log("v = \n");
        //console.log(v);
        // If pidLevel of current vertex was set already during traversal
        if (v.pidLevel !== "") {
          // Resets level to level of current vertex
          level = v.pidLevel;
        }
        // If vertex exists and not already (not found) in path array:
        if (v !== undefined && (!path.find((v) => path.id === v.id))) {
          // Record vertex (all properties) in path array (flat)
          path.push(v);
          //console.log("path array = \n");
          //console.log(path);
          //console.log("path array length = \n");
          //console.log(path.length);
          // If vertex has children
          if (v.children && v.children.length) {
            // Lower level by one (for all children)
            level += 1;
            // For all children of vertex
            v.children.forEach((child) => {
              child.pidLevel = level;
              child.pidHierarchy = isoHierarchy[level];
              // Push children (if any) to stack
              stack.push(child);
            });
            // Delete nested hierachy for given vertex (or clear with v.children = null;)
            delete v.children;
          }
        }
        // Raise level by one (after adding all children to stack)
        level -= 1;
      }
    });
    console.log('pathString = \n')
    console.log(JSON.stringify(path));
    console.log('path = \n')
    console.log(path);
    console.groupEnd();
    return path;
  }


  function mapNodesToShapes(pidShapesLibrary, pidNodes) {
    console.groupCollapsed("Mapping nodes to shapes (equipment, instruments, arrows, groups)...");
    const pidShapesCount = pidShapesLibrary.length;
    const pidNodesCount = pidNodes.length;
    let pidVertices = [];

    pidNodes.forEach(pidNode => {
      let matchingShape = {};
      // Fallback for groups (groups are modelled as nodes but not given a shapeName)
      if (!pidNode.shapeName || pidNode.shapeName === "undefined") {
        // FIXME: Check if this fallback works or is needed
        switch (pidNode.pidLevel) {
          case 0: // Enterprise
            pidNode.shapeName = "enterprise_group";
            break;
          case 1: // Site
            pidNode.shapeName = "site_group";
            break;
          case 2: // Area
            pidNode.shapeName = "area_group";
            break;
          case 3: // Process Cell
            pidNode.shapeName = "processCell_group";
            break;
          case 4: // Unit
            pidNode.shapeName = "unit_group";
            break;
          case 5: // Equipment Module
            pidNode.shapeName = "eModule_group";
            break;
        }
      }
      //Map node to shape via shapeName attributes
      matchingShape = pidShapesLibrary.find(shape => shape.shapeName === pidNode.shapeName);
      console.log(pidNode);
      console.log(matchingShape);
      // Clone all properties to NEW target object (which is returned) Alternatively: let pidVertex = Object.assign({}, pidNode, matchingShape);
      let pidVertex = {
        ...pidNode,
        ...matchingShape
      };
      pidVertices.push(pidVertex);
    });

    console.log(`Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`);
    console.log("pidNodes:");
    console.table(pidNodes);
    console.log("pidVertices:");
    console.table(pidVertices);
    console.groupEnd();
    return pidVertices;
  }


  function mapConnectionsToShapes(pidShapesLibrary, pidConnections) {
    console.groupCollapsed("Mapping connections to line shapes...");
    const pidShapesCount = pidShapesLibrary.length;
    const pidConnectionsCount = pidConnections.length;
    let pidEdges = [];

    pidConnections.forEach(pidConnection => {
      let matchingShape = {};
      matchingShape = pidShapesLibrary.find(shape => shape.shapeName === pidConnection.shapeName);
      //console.log(pidConnection);
      //console.log(matchingShape);
      // Clone all properties to NEW target object (which is returned)
      let pidEdge = Object.assign({}, pidConnection, matchingShape);
      pidEdges.push(pidEdge);
    });

    // Enable download and upload button and set style to enabled
    downloadJsonButton.disabled = false;
    downloadJsonButton.className = 'enabled';
    downloadXmlButton.disabled = false;
    downloadXmlButton.className = 'enabled';

    console.log(`Mapped ${pidConnectionsCount} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`);
    console.log('pidConnections:');
    console.table(pidConnections);
    console.log('pidEdges:');
    console.table(pidEdges);
    console.groupEnd();
    return pidEdges;
  }

  /*function mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings) {
      console.log("Mapping data bindings to shapes...");
      // TODO: pidDataBindings = (FETCH FROM DATABASE TABLES)
  }*/


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
    pidArrows = pidJson.filter(
      pidInstance => pidInstance.pidClass === "arrow"
    );
    let pidGroups;
    pidGroups = pidJson.filter(
      pidInstance => pidInstance.pidClass === "group"
    );
    let pidLines;
    pidLines = pidJson.filter(
      pidInstance => pidInstance.pidClass === "line"
    );
    // let pidDatabaseBindings;
    // pidDatabaseBindings = pidJson.filter(
    //     pidInstance => pidInstance.pidClass === "data_binding" ??? pidClass or xml object or what
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
      background: "#ffffff",
      math: 0,
      shadow: 0
    };

    console.groupCollapsed("XML String generation started...");

    const htmlLabel = '&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 0 , 255)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;4000 m3/s&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;';

    // Add mxGraph and mxGraphModel boilerplate settings
    pidXmlString = `
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
      pidXmlString += `
    <object id="${pidEquipment.id}" label="${htmlLabel}" pid-label="${pidEquipment.pidLabel}" pid-hierarchy="${pidEquipment.pidHierarchy}" sapient-bind="">
        <mxCell value="${pidEquipment._value}" style="${concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parent ? pidEquipment.parent : pidEquipment._parent}">
          <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
        </mxCell>
    </object>`;
    });

    const instrumentCount = pidInstruments.length;
    console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
    pidInstruments.forEach((pidInstrument) => {
      pidXmlString += `
    <object id="${pidInstrument.id}" label="${htmlLabel}" pid-label="${pidInstrument.pidLabel}" pid-hierarchy="${pidInstrument.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidInstrument._value}" style="${concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parent ? pidInstrument.parent : pidInstrument._parent}">
        <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const arrowCount = pidArrows.length;
    console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
    pidArrows.forEach((pidArrow) => {
      pidXmlString += `
    <object id="${pidArrow.id}" label="${htmlLabel}" pid-label="${pidArrow.pidLabel}" pid-hierarchy="${pidArrow.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidArrow._value}" style="${concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parent ? pidArrow.parent : pidArrow._parent}">
        <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    const groupCount = pidGroups.length;
    console.log(`Generating XML-tags for ${groupCount} group instances...`);
    pidGroups.forEach((pidGroup) => {
      pidXmlString += `
    <object id="${pidGroup.id}" label="${htmlLabel}" pid-label="${pidGroup.pidLabel}" pid-hierarchy="${pidGroup.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidGroup._value}" style="${concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" parent="${pidGroup.parent ? pidGroup.parent : pidGroup._parent}">
        <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // Add edges:
    const lineCount = pidLines.length;
    console.log(`Generating XML-tags for ${lineCount} line instances...`);
    pidLines.forEach((pidLine) => {
      pidXmlString += `
    <object id="${pidLine.id}" label="${htmlLabel}" pid-label="${pidLine.pidLabel}" pid-hierarchy="${pidLine.pidHierarchy}" sapient-bind="">
      <mxCell value="${pidLine._value}" style="${concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.node_0}" target="${pidLine.node_1}" parent="${pidLine._parent}">
        <mxGeometry x="50" y="50" as="${pidLine.mxGeometry._as}"></mxGeometry>
      </mxCell>
    </object>`;
    });

    // Add database bindings

    // Add boilerplate closing tags
    pidXmlString += `
  </root>
</mxGraphModel>`;

    console.groupEnd();
    console.log(pidXmlString);
    console.groupEnd();
    return pidXmlString;
  }


  function concatenateStyles(styleObject) {
    let styleString = "";
    //console.log(styleObject);
    // Converts object to array to iterate through all entries with forEach
    let valuesArray = Object.values(styleObject);
    valuesArray.forEach((value) => {
      if (value === "") {
        // Skip empty attribute
      } else {
        // Concatenate attribute
        styleString += value + ';';
      }
    });
    //console.log(styleString);
    return styleString;
  }


  // DELETE??????? IS THIS REALLY NECESARRY???????
  function parseXml(xmlString) {
    var domParser = new DOMParser();
    try {
      var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
      //console.log("pidXmlString parsed to pidXml File");
      return xmlDocument;
    } catch (error) {
      console.error(error);
    }
  }


  function renderXml(xmlString) {
    // Formats raw XML-string to pretty print
    let formattedXmlString = formatXml(xmlString, "  ");
    // Encodes XML string to valid HTML string (HTML characters)
    let formattedHtmlString = escapeXmlToHtml(formattedXmlString);
    //console.log(`pidHtmlString = \n${formattedHtmlString}`);
    xmlContainer.innerHTML = formattedHtmlString;
  }


  function formatXml(xml, tab) { 
    // tab = optional indent value, default is tab (\t)
    var formatted = '',
      indent = '';
    tab = tab || '\t';
    xml.split(/>\s*</).forEach(function (node) {
      if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
      formatted += indent + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
    });
    return formatted.substring(1, formatted.length - 3);
  }


  function escapeXmlToHtml(xmlString) {
    let htmlString = String(xmlString)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/ /g, '&nbsp;')
      .replace(/\n/g, '<br />');
    return htmlString;
  }


  function downloadFile(filename, text) {
    // stackoverflow: using-html5-javascript-to-generate-and-save-a-file
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    if (document.createEvent) {
      var event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      pom.dispatchEvent(event);
    } else {
      pom.click();
    }
  }
  downloadJsonButton.addEventListener("click", () => {
    downloadFile('pid-data.json', pidJsonString);
  });
  downloadXmlButton.addEventListener("click", () => {
    downloadFile('pid-visualization.xml', pidXmlString);
  });

}, false);