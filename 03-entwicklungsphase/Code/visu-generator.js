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
			fileReader.onload = (event) => {
				if (target === "visualization-file") {
					visualizationString = event.target.result;
					visualizationJson = JSON.parse(visualizationString);
					console.log(`File parsed succesfully.\nlibraryString =\n${visualizationString}`);
				}
			}
		}
		try {
			fileReader.readAsText(jsonFile); // Read the uploaded file (asyncronously)
		}
		catch(error) {
			console.error(error);
			return;
		}
	}
  const graphContainer = document.getElementById("graph-container");
	const fileInput = document.getElementById("visualization-file"); // library file defines shape classes
	fileInput.addEventListener("change", () => {
    createGraph(graphContainer, visualizationJson);
  }, false);


  function createGraph(container, jsonFile) {
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error("Browser is not supported!", 200, false);
    }
    else {
      // Disables the built-in context menu
      mxEvent.disableContextMenu(container);
      // Creates an empty graph Model
      const model = new mxGraphModel();
      // Creates graph inside given container
      const graph = new mxGraph(container, model);
      // Enables rubberband selection
      new mxRubberband(graph);
      // Gets the default parent for inserting new cells (normall the first child of the root (layer 0))
      const parent = graph.getDefaultParent();
      graph.setEnabled(false);
      graph.setPanning(true);
      graph.setTooltips(true);
      graph.panningHandler.useLeftButtonForPanning = true;
      // Adds a highlight on the cell under the mousepointer
      new mxCellTracker(graph);

      // Adds cells to the model in a single step
      graph.getModel().beginUpdate();
      try {
        let v1 = graph.insertVertex(parent,null, 'Hello,', 20, 20, 80, 30);
        let v2 = graph.insertVertex(parent, ull, 'world!', 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2);
      }
      finally {
        // Updates the display
        graph.getModel().endUpdate();
      }
    }
  }
  graphContainer.addEventListener("click", () => {
    createGraph(graphContainer)
  } , false)


  // Parses the mxGraph XML file format
  function read(graph, filename) {
    var req = mxUtils.load(filename);
    var root = req.getDocumentElement();
    var dec = new mxCodec(root.ownerDocument);

    dec.decode(root, graph.getModel());
  };

}, false);
