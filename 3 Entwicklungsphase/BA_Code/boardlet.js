window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    const libraryInput = document.getElementById("pid-shape-library");
    const instancesInput = document.getElementById("cmodule-instances");
    const generatePidButton = document.getElementById("generate-pid-button");

    let fileCounter = 0;
    let libraryString;
    let libraryJson;
    let cModulesString;
    let cModulesJson;
    let verteci = [];
    let visuJson;
    let visuXmlString;
    let visuXml;

    if (window.File && window.FileReader && window.FileList) {
        // All the File APIs are supported.
    } else {
        alert("The File APIs are not fully supported in this browser.");
    }


    function loadJson(event) {
        let target = event.target.id;
        let jsonFile = event.target.files[0];
        let fileReader = new FileReader();

        if (!jsonFile.type.match("json")) {
            console.log("File Type is not of JSON type.");
        } else {
            fileReader.onload = (event) => {
                if (target === "pid-shapes-library") {
                    libraryString = event.target.result;
                    console.log(`File read succesfully.\nlibraryString =\n${libraryString}`);
                    libraryJson = JSON.parse(libraryString);
                    fileCounter++;
                } else if (target === "cmodule-instances") {
                    cModulesString = event.target.result;
                    console.log(`File read succesfully.\ncModules = \n${cModulesString}`);
                    cModulesJson = JSON.parse(cModulesString);
                    fileCounter++;
                }
                if (fileCounter === 2) {
                    createTableButton.disabled = false;
                    // removes sapient disabled class for success-button
                    createTableButton.className = "button button-success";
                };
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
    instancesInput.addEventListener("change", loadJson, false);


    async function mapInstancesToShapes(shapesLibrary, cModuleInstances) {
        let counter = 0;
        let shapesCount = libraryJson.length;
        let cModulesCount = cModulesJson.length;

        // Eventually fetch and push cModules from l_nodes in DB into cModulesJson array
        cModulesJson.forEach((cModule) => {
            counter++;
            let matchingShape = {};
            matchingShape = libraryJson.find((shape) => shape.shapeName === cModule.shapeName);
            console.log(cModule);
            console.log(matchingShape);
            totalCounter.innerHTML = `CModules: ${counter}  |  Shapes: ${cModulesCount}`;

            // Clone all properties to NEW target object (which is returned)
            let vertex = Object.assign({}, cModule, matchingShape);
            // Set a unique ID (shapeName+SN) to vertex
            vertex._id = generateUniqueId(cModule.shapeName);
            verteci.push(vertex);
            console.log(vertex.shapeCategory);
            console.log(vertex);
        })
        console.log(`repeats = ${JSON.stringify(repeats)}`);
        //totalCounter.innerHTML = "";
        console.log(`${verteci.length} Verteci generated succesfully.`);
        dataToTable(verteci);
        tableInstructions.scrollIntoView();
        createTableButton.disabled = true;
    }
    createTableButton.addEventListener("click", () => {
        mapInstancesToShapes(libraryJson, cModulesJson)
    }, false);

}, false);