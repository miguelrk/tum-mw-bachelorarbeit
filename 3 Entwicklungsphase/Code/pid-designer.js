"use strict"; // Prohibit use of undeclared variables

window.addEventListener('load', () => {

    console.log("Page loaded succesfully.");

    const libraryInput = document.getElementById("pid-shape-library");
    const instancesInput = document.getElementById("cmodule-instances");
    const createTableButton = document.getElementById("create-table-button");
    const tableInstructions = document.getElementById("table-instructions");
    const totalCounter = document.getElementById("total-counter");
    const visuContainer = document.getElementById("visu-container");
    const createPid = document.getElementById("create-pid-button");
    const renderPid = document.getElementById("render-pid-button");

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


    let repeats = {};

    function generateUniqueId(shapeName) {
        let sequenceNumber = 0;
        if (repeats.hasOwnProperty(shapeName)) {
            let count = repeats[shapeName];
            sequenceNumber = count + 1;
            repeats[shapeName] = sequenceNumber;
        } else {
            sequenceNumber = 1;
            repeats[shapeName] = sequenceNumber;
        }
        // adds 4 zero-padding to the sequenceNumber
        let sN = String("0000" + sequenceNumber).slice(-4);
        return `${shapeName}_${sN}`;
    };


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


    function dataToTable(data) {
        // with tabulator:
        $("#table-content").tabulator({
            height: 450, // set height (=300 for 13" screens, =600 for desktop) of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            layout: "fitColumns", //fit columns to width of table (optional)
            layoutColumnsOnNewData: true, //update column widths upon new data loading
            selectable: true,
            tooltips: true,
            addRowPos: "top",
            history: true,
            movableColumns: true,
            resizableRows: true,
            clipboard: true,
            clipboardPasteAction: "replace",
            initialSort: [
                { column: "eModule", dir: "asc" },
                { column: "cModule", dir: "asc" },
                { column: "_id", dir: "asc" },
                { column: "", dir: "asc" },
            ],
            //groupBy: "shapeCategory",
            columns: [ //Define Table Columns
                { title: "", field: "", sortable: true, sorter: "number", align: "center", width: 30, formatter: "rownum" },
                { title: "Include", field: "shapeIncluded", editor: "tick", sortable: true, align: "center", width: 30, formatter: "buttonTick" },
                //{title:"Shape Name", field:"shapeName", sortable:true, width:225},
                { title: "Unit", field: "eModule", sortable: true },
                //{title:"EModule", field:"eModule", sortable:true},
                { title: "CModule", field: "cModule", sortable: true },
                { title: "ID", field: "_id", sortable: true },
                { title: "Thumbnail", field: "shapeThumbnail", sortable: true, align: "center", formatter: "image" },
                //{title:"Path", field:"shapePath", sortable:true},
                { title: "setPoint", field: "_width", editor: "number", align: "center", width: 60 },
                {
                    title: "Logic",
                    field: "name",
                    editor: "select",
                    width: 80,
                    editorParams: {
                        "==": "==",
                        ">=": ">=",
                        ">": ">",
                        "<=": "<=",
                        "<": "<",
                    }
                },
                { title: "width", field: "_height", editor: "number", align: "center", width: 60 },
                { title: "Alarm Color", field: "color", sortable: false, width: 25, formatter: "color" },
                { title: "width", field: "_width", editor: "number", align: "center", width: 70 },
                { title: "height", field: "_height", editor: "range", align: "center", width: 70 },
                { title: "Variable", field: "variable", sortable: true, color: "blue" },
                //{title:"= 0-100px", field:"_width", editor:"progress", sortable:true, sorter:"number", formatter:"progress", formatterParams:{color:["#B3E5FC", "#03A9F4", "#1976D2"]}},
                //{title:"= 0-100px", field:"_height", editor:"progress", sortable:true, sorter:"number", formatter:"progress", formatterParams:{color:["#B3E5FC", "#03A9F4", "#1976D2"]}},
                //{title:"Rating", field:"rating", sortable:true, sorter:"number", formatter:"star"},
            ],
            rowClick: function(e, row) { //trigger an alert message when the row is clicked
                alert("Row " + row.getData().id + " Clicked!");
            },
        });
        //load data into the table
        $("#table-content").tabulator("setData", data);
        // You can call $("#example-table").tabulator("setData") to refresh data at any point
        tableInstructions.innerHTML = "<h4>P&I-Diagram Configuration Table</h4>";
        if (libraryJson && cModulesJson) {
            document.getElementById("download-json-button").disabled = false;
            document.getElementById("download-xlsx-button").disabled = false;
            document.getElementById("create-pid-button").disabled = false;
            document.getElementById("render-pid-button").disabled = false;
        }
    }

    //trigger download of data.json file
    $("#download-json-button").click(function() {
        $("#table-content").tabulator("download", "json", "data.json");
    });

    //trigger download of data.xlsx file
    $("#download-xlsx-button").click(function() {
        $("#table-content").tabulator("download", "xlsx", "data.xlsx", { sheetName: "data" });
    });


    function renderPidXml() {
        const breweryPidSvg = "<img src=\"data\\brewery_pid_diagram.svg\"></img>";
        visuContainer.innerHTML = `${breweryPidSvg}`;
        visuContainer.scrollIntoView();
    }
    renderPid.addEventListener("click", renderPidXml, false);

}, false);