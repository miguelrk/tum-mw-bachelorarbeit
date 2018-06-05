window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    const libraryInput = document.getElementById("pid-shapes-library");
    const instancesInput = document.getElementById("cmodule-instances");
    const generatePidButton = document.getElementById("generate-pid-button");
    const totalCounter = document.getElementById("total-counter");
    const xmlContainer = document.getElementById("xml-container-div");
    const downloadJsonButton = document.getElementById("download-json-button");
    const downloadPidButton = document.getElementById("download-pid-button");


    let file1Present = false;
    let file2Present = false;
    let libraryString;
    let libraryJson;
    let cModulesString;
    let cModulesJson;
    let verteci = [];
    let verteciString = '';
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
        console.log(`File name: ${target}`);
        let jsonFile = event.target.files[0];
        let fileReader = new FileReader();

        if (!jsonFile.type.match("json")) {
            console.log("File Type is not of JSON type.");
        } else {
            fileReader.onload = (event) => {
                if (target === "pid-shapes-library") {
                    libraryString = event.target.result;
                    libraryJson = JSON.parse(libraryString);
                    console.table(libraryJson);
                    file1Present = true;
                } else if (target == "cmodule-instances") {
                    cModulesString = event.target.result;
                    cModulesJson = JSON.parse(cModulesString);
                    console.table(cModulesJson);
                    file2Present = true;
                }
                if (file1Present && file2Present) {
                    generatePidButton.disabled = false;
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
    instancesInput.addEventListener("change", loadJson, false);


    function generatePidXml() {
        mapInstancesToShapes(libraryJson, cModulesJson);
        downloadPidButton.disabled = false;

    }
    generatePidButton.addEventListener("click", () => {
        generatePidXml(libraryJson, cModulesJson);
        //totalCounter.innerHTML = "";
        console.log(`${verteci.length} verteci generated succesfully.`);
        generatePidButton.disabled = true;
    }, false);

    function mapInstancesToShapes(shapesLibrary, cModuleInstances) {
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
            verteci.push(vertex);
        });
        verteciString = JSON.stringify(verteci);
        downloadJsonButton.disabled = false;
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
        downloadFile('pid-data.json', verteciString);
    });
    downloadPidButton.addEventListener("click", () => {
        downloadFile('pid-visualization.xml', pidXmlString);
    });


    function renderXml() {
        const breweryPidSvg = "<img src=\"data\\brewery_pid_diagram.svg\"></img>";
        visuContainer.innerHTML = `${breweryPidSvg}`;
        visuContainer.scrollIntoView();
    }

}, false);