"use strict"; // Prohibit use of undeclared variables

window.addEventListener('load', () => {

  console.log("Page loaded succesfully.");

  let visualizationString;
  let visualizationJson;
  let visualizationXml;


  function loadJson(event) {
    let target = event.target.id;
    let jsonFile = event.target.files[0];
    let fileReader = new FileReader();

    if (!jsonFile.type.match("json")) {
      console.log("File Type is not of JSON type.");
    }
    else {
      console.log("start loadJson");
      fileReader.onload = (event) => {
        if (target === "visualization-file") {
          visualizationString = event.target.result;
          visualizationJson = JSON.parse(visualizationString);
          console.log(`File parsed succesfully.\nlibraryString =\n${visualizationString}`);
          createGraph(graphContainer, visualizationJson);
        }
      }
    }
    try {
      fileReader.readAsText(jsonFile); // Read the uploaded file (asyncronously)
      console.log("fileReader");
    }
    catch(error) {
      console.error(error);
      return;
    }
  };
  const graphContainer = document.getElementById("graph-container");
  const fileInput = document.getElementById("visualization-file"); // library file defines shape classes


  function createGraph(container, jsonFile) {
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error("Browser is not supported!", 200, false);
    }
    else {
      // Disables the built-in context menu
      mxEvent.disableContextMenu(container);

      // Creates graph inside given container
      const graph = new mxGraph(container);

      // Enables rubberband selection
      new mxRubberband(graph);

      // Gets the default parent for inserting new cells (normall the first child of the root (layer 0))
      const parent = graph.getDefaultParent();

      graph.setEnabled(false);
      graph.setTooltips(true);

      // Enables panning with left mouse button
      graph.panningHandler.useLeftButtonForPanning = true;
      graph.panningHandler.ignoreCell = true;
      graph.container.style.cursor = 'move';
      graph.setPanning(true);

      // Adds a highlight on the cell under the mousepointer
      new mxCellTracker(graph);

      // Adds cells to the model in a single step
      graph.getModel().beginUpdate();
      visualizationXml = generateXmlFromJson(visualizationJson);
      try {
        let v1 = graph.insertVertex(parent,null, 'Hello,', 20, 20, 80, 30);
        let v2 = graph.insertVertex(parent, null, 'world!', 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2);
      }
      finally {
        // Updates the display
        graph.getModel().endUpdate();
      }
    }
  };


  function generateXmlFromJson(jsonFile) {
    let xmlDoc = mxUtils.createXmlDocument();
    let vertexCount = jsonFile.length;
    for (vertex in jsonFile) {
      var node = xmlDoc.createElement(vertex._id);
      node.setAttribute('_id', vertex._id);
      // HARD CODED VERSION (CHANGE TO ANOTHER LOOP)
      // Sets cModule attributes
      node.setAttribute('shapeName', vertex.shapeName);
      node.setAttribute('site', vertex.site);
      node.setAttribute('area', vertex.area);
      node.setAttribute('cell', vertex.cell);
      node.setAttribute('unit', vertex.unit);
      node.setAttribute('eModule', vertex.eModule);
      node.setAttribute('cModule', vertex.cModule);
      node.setAttribute('pidLabel', vertex.pidLabel);
      node.setAttribute('variable', vertex.variable);
      node.setAttribute('shapeIncluded', vertex.shapeIncluded);
      node.setAttribute('shapeDomain', vertex.shapeDomain);
      node.setAttribute('shapeClass', vertex.shapeClass);
      node.setAttribute('shapeCategory', vertex.shapeCategory);
      node.setAttribute('shapeType', vertex.shapeType);
      node.setAttribute('shapeSubtype', vertex.shapeSubtype);
      node.setAttribute('shapePath', vertex.shapePath);
      node.setAttribute('shapeThumbnail', vertex.shapeThumbnail);
      // Sets shape attributes
      node.setAttribute('_style', vertex._style);
      node.setAttribute('_vertex', vertex._vertex);
      node.setAttribute('_value', vertex._value);
      node.setAttribute('_parent', vertex._parent);
      node.setAttribute('_children', vertex._children);
      node.setAttribute('_edges', vertex._edges);
      node.setAttribute('_x', vertex._x);
      node.setAttribute('_y', vertex._y);
      node.setAttribute('_width', vertex._width);
      node.setAttribute('_height', vertex._height);
      node.setAttribute('_as', vertex._as);
      node.setAttribute('_height', vertex._height);
      graph.insertVertex(graph.getDefaultParent(), null, node, 40, 40, 80, 30);
    };
  };


  // Parses the mxGraph XML file format
  function read(graph, filename) {
    var req = mxUtils.load(filename);
    var root = req.getDocumentElement();
    var dec = new mxCodec(root.ownerDocument);

    dec.decode(root, graph.getModel());
  };

}, false);
