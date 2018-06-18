import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import EmberUploader from 'ember-uploader';
//import ParameterContext from 'core/objects/parameter-context';
//import VisuVerticesModel from '/models/prj-prc-visu-verteci';
import { inject as service } from '@ember/service';

const uploader = EmberUploader.Uploader.create({
    xmlFileName: 'pid-visualization.xml',
    xmlUrl: './research-sapient-app/public/assets/detail-layout',
    method: 'POST' // POST is default method but PUT requiered to overwrite existing but not suported by this url
});

let component = SapientComponent.extend(Evented, {
    // Global Ember Variables to be accessible globally via this.get() or this.set():
    classNames: ['create-pid-component'],
    classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
    toastMessagesService: service('toast-messages-service'),
    pidShapesLibrary: undefined,
    pidNodes: undefined,
    pidConnections: undefined,
    pidVertices: undefined,
    pidEdges: undefined,
    pidJson: undefined,
    pidJsonString: '',
    pidNodeTree: undefined,
    pidXmlString: '',
    pidHtmlString: '',
    // For database query:
    server: service,
    subscription: undefined,
    // Variable initialization:
    init() {
        this._super(...arguments);
        this.set('jsonObject', null);
        this.set('jsonString', '');
    },
    actions: {
        loadSuccess: function(object, response) {
            // Initializes variables for global availability in loadSuccess function block

            // Database queries with filter:
            // getRecords(resource[, filterObject/filterFunction[, subscriptionOptions{, model]]])
            this.set('pidNodes', this.queryDatabase('pid-nodes'));
            //TODO: this.set('pidConnections', this.queryDatabase('pid-connections'));
            /* this.set('pidNodes', [
                {
                    shapeName: "site_group",
                    id: "G1",
                    name: "Aida",
                    parent: "",
                    node_level: 1,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "area_group",
                    id: "G2",
                    name: "Brewery",
                    parent: "G1",
                    node_level: 2,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "cell_group",
                    id: "G3",
                    name: "Brewhouse",
                    parent: "G2",
                    node_level: 3,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "unit_group",
                    id: "G4",
                    name: "Lauter_kettle",
                    parent: "G3",
                    node_level: 4,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G5",
                    name: "Water_injection",
                    parent: "G4",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E1",
                    name: "Control_valve_440",
                    parent: "G5",
                    node_level: 6,
                    variable: "Control_valve_440_8",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "pump_(liquid)",
                    id: "E2",
                    name: "Pump_P40",
                    parent: "G5",
                    node_level: 6,
                    variable: "Pump_P40_9",
                    pidLabel: "P40",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G6",
                    name: "Vessel",
                    parent: "G4",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "electric_motor",
                    id: "E3",
                    name: "Motor",
                    parent: "G6",
                    node_level: 6,
                    variable: "Motor_11",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I1",
                    name: "Kettle_sensor_Z",
                    parent: "G6",
                    node_level: 7,
                    variable: "Kettle_sensor_Z_12",
                    pidLabel: "",
                    pidFunction: "ZS",
                    pidNumber: "4000"
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I2",
                    name: "Kettle_sensor_T",
                    parent: "G6",
                    node_level: 7,
                    variable: "Kettle_sensor_T_13",
                    pidLabel: "",
                    pidFunction: "TE",
                    pidNumber: "4000"
                },
                {
                    shapeName: "tank_(conical_roof)",
                    id: "E4",
                    name: "",
                    parent: "G6",
                    node_level: 6,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "agitator_(turbine)",
                    id: "E5",
                    name: "",
                    parent: "G6",
                    node_level: 6,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "unit_group",
                    id: "G7",
                    name: "Mash_pan",
                    parent: "G3",
                    node_level: 4,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G8",
                    name: "Waste_gas_cooling",
                    parent: "G7",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E6",
                    name: "Control_valve_550",
                    parent: "G8",
                    node_level: 6,
                    variable: "Control_valve_550_17",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "compressor,_vacuum_pump",
                    id: "E7",
                    name: "Compressor",
                    parent: "G8",
                    node_level: 6,
                    variable: "Compressor_18",
                    pidLabel: "C10",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G9",
                    name: "Vessel",
                    parent: "G7",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "electric_motor",
                    id: "E8",
                    name: "Motor",
                    parent: "G9",
                    node_level: 6,
                    variable: "Motor_20",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I3",
                    name: "Kettle_sensor_L",
                    parent: "G9",
                    node_level: 7,
                    variable: "Kettle_sensor_L_21",
                    pidLabel: "",
                    pidFunction: "LS",
                    pidNumber: "1000"
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I4",
                    name: "Kettle_sensor_Z",
                    parent: "G9",
                    node_level: 7,
                    variable: "Kettle_sensor_Z_22",
                    pidLabel: "",
                    pidFunction: "ZS",
                    pidNumber: "1000"
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I5",
                    name: "Kettle_sensor_T",
                    parent: "G9",
                    node_level: 7,
                    variable: "Kettle_sensor_T_24",
                    pidLabel: "",
                    pidFunction: "TE",
                    pidNumber: "1000"
                },
                {
                    shapeName: "pressurized_vessel",
                    id: "E9",
                    name: "",
                    parent: "G9",
                    node_level: 6,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "agitator_(propeller)",
                    id: "E10",
                    name: "",
                    parent: "G9",
                    node_level: 6,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "shell_and_tube_heat_exchanger_2",
                    id: "E11",
                    name: "",
                    parent: "G9",
                    node_level: 6,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G10",
                    name: "Steam_heating",
                    parent: "G7",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E12",
                    name: "Control_valve_420",
                    parent: "G10",
                    node_level: 6,
                    variable: "Control_valve_420_26",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E13",
                    name: "Control_valve_410",
                    parent: "G10",
                    node_level: 6,
                    variable: "Control_valve_410_27",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "unit_group",
                    id: "G11",
                    name: "Pump_station",
                    parent: "G3",
                    node_level: 4,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G12",
                    name: "Outlet",
                    parent: "G11",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E14",
                    name: "Control_valve_160",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_160_31",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E15",
                    name: "Control_valve_170",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_170_32",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E16",
                    name: "Control_valve_150",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_150_33",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E17",
                    name: "Control_valve_220",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_220_34",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E18",
                    name: "Control_valve_360",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_360_35",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E19",
                    name: "Control_valve_320",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_320_36",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E20",
                    name: "Control_valve_130",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_130_37",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E21",
                    name: "Control_valve_140",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_140_38",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E22",
                    name: "Control_valve_120",
                    parent: "G12",
                    node_level: 6,
                    variable: "Control_valve_120_39",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "positive_displacement",
                    id: "E23",
                    name: "Sensor_flow",
                    parent: "G12",
                    node_level: 6,
                    variable: "Sensor_flow_40",
                    pidLabel: "",
                    pidFunction: "FT",
                    pidNumber: "3000"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E24",
                    name: "Valve_BELIMO",
                    parent: "G12",
                    node_level: 6,
                    variable: "Valve_BELIMO_41",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I6",
                    name: "",
                    parent: "G12",
                    node_level: 7,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "FT",
                    pidNumber: "3000"
                },
                {
                    shapeName: "emodule_group",
                    id: "G13",
                    name: "Inlet",
                    parent: "G11",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E25",
                    name: "Control_valve_110",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_110_43",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E26",
                    name: "Control_valve_020",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_020_44",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E27",
                    name: "Control_valve_040",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_040_45",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E28",
                    name: "Control_valve_030",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_030_46",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E29",
                    name: "Control_valve_010",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_010_47",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E30",
                    name: "Control_valve_580",
                    parent: "G13",
                    node_level: 6,
                    variable: "Control_valve_580_49",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "pump_(liquid)",
                    id: "E31",
                    name: "Pump_P30",
                    parent: "G13",
                    node_level: 6,
                    variable: "Pump_P30_50",
                    pidLabel: "P30",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "unit_group",
                    id: "G14",
                    name: "Water_supply",
                    parent: "G3",
                    node_level: 4,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G15",
                    name: "Cold_water_distribution",
                    parent: "G14",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E32",
                    name: "Control_valve_560",
                    parent: "G15",
                    node_level: 6,
                    variable: "Control_valve_560_53",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "emodule_group",
                    id: "G16",
                    name: "Mixing_valve",
                    parent: "G14",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E33",
                    name: "Control_valve_310",
                    parent: "G16",
                    node_level: 6,
                    variable: "Control_valve_310_55",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "three_way_valve",
                    id: "E34",
                    name: "Three_way_tap",
                    parent: "G16",
                    node_level: 6,
                    variable: "Three_way_tap_56",
                    pidLabel: "",
                    pidFunction: "FV",
                    pidNumber: "2000"
                },
                {
                    shapeName: "positive_displacement",
                    id: "E35",
                    name: "Sensor_flow",
                    parent: "G16",
                    node_level: 6,
                    variable: "Sensor_flow_57",
                    pidLabel: "",
                    pidFunction: "FT",
                    pidNumber: "2000"
                },
                {
                    shapeName: "discInst_(field)",
                    id: "I7",
                    name: "",
                    parent: "G16",
                    node_level: 7,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "FT",
                    pidNumber: "2000"
                },
                {
                    shapeName: "emodule_group",
                    id: "G17",
                    name: "Mixed_water_distribution",
                    parent: "G14",
                    node_level: 5,
                    variable: "",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E36",
                    name: "Control_valve_340",
                    parent: "G17",
                    node_level: 6,
                    variable: "Control_valve_340_59",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E37",
                    name: "Control_valve_350",
                    parent: "G17",
                    node_level: 6,
                    variable: "Control_valve_350_60",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E38",
                    name: "Control_valve_460",
                    parent: "G17",
                    node_level: 6,
                    variable: "Control_valve_460_61",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    id: "E39",
                    name: "Control_valve_470",
                    parent: "G17",
                    node_level: 6,
                    variable: "Control_valve_470_62",
                    pidLabel: "",
                    pidFunction: "",
                    pidNumber: ""
                }
            ]); */
            /* this.set('pidConnections', [
                {
                    shapeName: "pipe_line",
                    id: "C1",
                    pidLabel: "",
                    node_0: "E1",
                    node_1: "E2"
                },
                {
                    shapeName: "pipe_line",
                    id: "C2",
                    pidLabel: "",
                    node_0: "E2",
                    node_1: "E3"
                },
                {
                    shapeName: "pipe_line",
                    id: "C2",
                    pidLabel: "",
                    node_0: "E3",
                    node_1: "E4"
                },
                {
                    shapeName: "pipe_line",
                    id: "C3",
                    pidLabel: "",
                    node_0: "E4",
                    node_1: "E5"
                },
                {
                    shapeName: "pipe_line",
                    id: "C4",
                    pidLabel: "",
                    node_0: "E5",
                    node_1: "E6"
                },
                {
                    shapeName: "pipe_line",
                    id: "C5",
                    pidLabel: "",
                    node_0: "E6",
                    node_1: "E7"
                },
                {
                    shapeName: "pipe_line",
                    id: "C6",
                    pidLabel: "",
                    node_0: "E7",
                    node_1: "E8"
                },
                {
                    shapeName: "pipe_line",
                    id: "C7",
                    pidLabel: "",
                    node_0: "E8",
                    node_1: "E9"
                },
                {
                    shapeName: "pipe_line",
                    id: "C8",
                    pidLabel: "",
                    node_0: "E9",
                    node_1: "E10"
                },
                {
                    shapeName: "pipe_line",
                    id: "C9",
                    pidLabel: "",
                    node_0: "E10",
                    node_1: "E11"
                },
                {
                    shapeName: "pipe_line",
                    id: "C10",
                    pidLabel: "",
                    node_0: "E11",
                    node_1: "E12"
                },
                {
                    shapeName: "pipe_line",
                    id: "C11",
                    pidLabel: "",
                    node_0: "E12",
                    node_1: "E13"
                },
                {
                    shapeName: "pipe_line",
                    id: "C12",
                    pidLabel: "",
                    node_0: "E13",
                    node_1: "E14"
                },
                {
                    shapeName: "pipe_line",
                    id: "C13",
                    pidLabel: "",
                    node_0: "E14",
                    node_1: "E15"
                },
                {
                    shapeName: "pipe_line",
                    id: "C14",
                    pidLabel: "",
                    node_0: "E15",
                    node_1: "E16"
                },
                {
                    shapeName: "pipe_line",
                    id: "C15",
                    pidLabel: "",
                    node_0: "E16",
                    node_1: "E17"
                },
                {
                    shapeName: "pipe_line",
                    id: "C16",
                    pidLabel: "",
                    node_0: "E17",
                    node_1: "E18"
                },
                {
                    shapeName: "pipe_line",
                    id: "C17",
                    pidLabel: "",
                    node_0: "E18",
                    node_1: "E19"
                },
                {
                    shapeName: "pipe_line",
                    id: "C18",
                    pidLabel: "",
                    node_0: "E19",
                    node_1: "E20"
                },
                {
                    shapeName: "pipe_line",
                    id: "C19",
                    pidLabel: "",
                    node_0: "E20",
                    node_1: "E21"
                },
                {
                    shapeName: "pipe_line",
                    id: "C20",
                    pidLabel: "",
                    node_0: "E21",
                    node_1: "E22"
                }
            ]); */
            // Database single query by Id
            // getRecord(resource, filterObject/filterFunction, subscriptionOptions, model)

            console.log('File uploaded and response added to object...');
            this.set(object, response);
            this.set('pidShapesLibrary', this.get(object));
            console.log(`File loaded succesfully.`);
            //console.table(pidShapesLibrary);

            // Remove sapient disabled class for success-button and adds event listener
            document.getElementById('generate-pid-button').className =
                'button button-success';
            document.getElementById('generate-pid-button').addEventListener('click', () => {
                this.generatePid();
            },false);    
        },
            
        loadError: function(err) {
            console.log('Error during File Upload...\n');
            console.log(err);
        }
        
    },
    

    generatePid: function() {
        console.time();
        console.log('P&ID Generation started...');
        // Add sapient disabled class for success-button
        document.getElementById('generate-pid-button').className =
            'button button-success disabled';
        // Display a loader in xml-viewer-div
        document.getElementById('xml-viewer-div').innerHTML =
            'Generating XML of P&ID Visualization...';
        this.set('loading', true); // FIXME: check if sapient loading works or out of scope

        // 1) TODO: Generate JSON Object of P&ID (pidJson) FROM DATABASE QUERIES
        // Add vertices to pidJson
        this.set('pidVertices', this.mapNodesToShapes());
        // Add edges to pidJson
        // TODO: _parent attribute must be overriden from default (_parent='1';) for ALL Nodes (info from DB fetch)
        this.set('pidEdges', this.mapConnectionsToShapes());
        // Add database bindings to pidJson
        //let pidDatabaseBindings = mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings);
        // Concatenate arrays to single array using ES6 Spread operator
        // FIXME: Replace with: pidJson = [...pidVertices, ...pidEdges, ...pidDatabaseBindings];
        this.set('pidJson', [...this.get('pidVertices'), ...this.get('pidEdges')]);
        this.set('pidJsonString', JSON.stringify(this.get('pidJson')));

        // Create node hierarchy out of parent relations (filter nodes only from pidJson)
        this.set('pidNodeTree', this.buildHierarchy(this.get('pidJson')));

        // Grid layout algorithm to set _x and _y attributes of vertices directly in pidJson
        //this.vertexLayoutAlgorithm(this.get('pidNodeTree'), this.get('pidVertices'), this.get('pidEdges'));

        // 2) Generate XML File of P&ID Visualization (pidXml) from pidJson
        this.set('pidXmlString', this.generatePidXmlString(this.get('pidJson')));
        //let pidXml = parseXml(pidXmlString); // Delete: downloadFile() requires xml string not xml file

        // 3) Render XML as Text in xml-viewer-div of boardlet
        this.renderXml(this.get('pidXmlString'));
        console.log('generatePid() done after:');
        this.set('loading', false); // FIXME: check if sapient loading works or out of scope
        console.timeEnd();

        // 4) Remove sapient disabled class for success-button and adds event listener
        document.getElementById('download-json-button').className = 'button';
        document.getElementById('download-xml-button').className = 'button';
        document.getElementById('upload-pid-button').className = 'button button-success';
        document.getElementById('download-json-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.json', this.get('pidJsonString'));
            },false);
        document.getElementById('download-xml-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.xml', this.get('pidXmlString'));
            },false);
        // TODO: Change callback to uploadFile() when done implementing
        document.getElementById('upload-pid-button').addEventListener('click', () => {
                this.uploadXmlFile(this.get('pidXmlString'));
            },false);
    },


    queryDatabase: function(data) {
        console.log('Querying database for records...')
        //let resource;
        //let filter;

        /*
            // Build filter statically depending on data request
            if (data === "pid-nodes") {
                // FIXME: sapient_owner.prj_prc_visu_verteci or simply prj_prc_visu_verteci
                // TODO: fetch parent field (in l_nodes) of each record 
                resource = 'sapient_owner.prj_prc_visu_verteci';
                filter = [{
                fields: 'id,node,is_instrument_shape_namepid_label,pid_function,pid_number',
                op: 'nn',
            }];
            }
            if (data === "pid-connections") {
                // FIXME: determine resource (table) name
                resource = '';
                filter = [{
                fields: 'id',
                op: 'nn',
            }];
            }
        */

        // const subscription = this.get('server').getRecords('prj_prc_visu_verteci', {
        //     filter: [{ fields: 'id', op: 'in' }]
        // }, undefined, VisuVerticesModel);

        // console.log(subscription);

        this.get('server').getRecords('owner_sapient.prj_prc_visu_verteci', {
            filter: [{ fields: 'id', op: 'in' }]
        },
        undefined)
        .then((result) => {
            console.log(result);
            if (result.content.length > 0) {
                console.log('Database query result is not empty.');
                let jsonObject = result.content;
                console.log('jsonObject = \n');
                console.log(jsonObject);
                let jsObject = JSON.parse(jsonObject);
                try {
                    if (jsObject) {
                        console.log('Database query result parsed into jsObject.');
                        console.log('jsObject = \n');
                        console.log(jsObject);
                        return jsObject;
                    } else {
                        console.log('Database query result doesn\'t exist and couldn\'t be parsed into jsObject.' );
                    }
                }
                catch(error) {
                    console.log(error);
                }

            }
        })
    },


    // Downloads XML File of P&ID on button click
    downloadFile: function(filename, text) {
        // stackoverflow: using-html5-javascript-to-generate-and-save-a-file
        var pom = document.createElement('a');
        pom.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        );
        pom.setAttribute('download', filename);
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    },

    
    uploadXmlFile: function(xmlText) {
        // // Change to ES6 with async/await
        // uploadFile: function(text) {
        //     const xmlFileName = 'pid-visualization.xml'
        //     const xmlUrl = 'http://localhost:8080/public/assets/detail-layout';
        //
        //     let xhr = new XMLHttpRequest;
        //     xhr.onload = (() => {
        //         if (xhr.status === 200) {
        //             console.log('xhr.onload succeeded');
        //             console.log(text);
        //         }
        //     });
        //     // Specifies the type of request (post, url, async)
        //     xhr.open('POST', url, true);
        //     console.log('xhr opened');
        //     // Sends the request to the server
        //     xhr.send(text);
        //     console.log('xhr sent');
        // },
        let xmlFile = this.parseXml(xmlText);
        if (xmlFile) {
            uploader.upload(xmlFile, {}).then((data) => {
                    console.log(xmlText);
                    console.log(xmlFile);
                }, (error) => {
                    console.log(error);
                });
            }
            uploader.on('progress', e => {
                // Handle progress changes
                // Use `e.percent` to get percentage
                console.log(`upload: ${e.percent}%`);
            });
            uploader.on('didUpload', e => {
                // Handle finished upload
                console.log('successfull upload');
            });
            uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
            // Handle unsuccessful upload
                console.log('unsuccessfull upload');
            });
    },


    mapNodesToShapes: function() {
        //console.log('Mapping nodes to vertex shapes (equipment, instrument, arrow, group).');
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidNodesCount = this.get('pidNodes').length;
        let pidVertices = [];

        // TODO: pidNodes = (FETCH FROM PRJ_PRC_VISU_VERTECI)
        this.get('pidNodes').forEach(pidNode => {
            let matchingShape = {};
            matchingShape = this.get('pidShapesLibrary').find(
                shape => shape.shapeName === pidNode.shapeName
            );
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidVertex = Object.assign({}, pidNode, matchingShape);
            pidVertices.push(pidVertex);
        });

        console.log(
            `Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`
        );
        //console.log('pidNodes:');
        //console.table(pidNodes);
        //console.log('pidVertices:');
        //console.table(pidVertices);

        return pidVertices;
    },


    mapConnectionsToShapes: function() {
        //console.log('Mapping connections to edge shape (line).');
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidConnectionsCount = this.get('pidConnections').length;
        let pidEdges = [];

        // TODO: pidConnections = (FETCH FROM PRJ_PRC_PRO_FLOWS)
        this.get('pidConnections').forEach(pidConnection => {
            let matchingShape = {};
            matchingShape = this.get('pidShapesLibrary').find(
                shape => shape.shapeName === pidConnection.shapeName
            );
            //console.log(pidConnection);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned)
            let pidEdge = Object.assign({}, pidConnection, matchingShape);
            pidEdges.push(pidEdge);
        });

        console.log(
            `Mapped ${pidConnectionsCount} connection instances to edge shapes from ${pidShapesCount} total shapes in library.`
        );
        //console.log('pidConnections:');
        //console.table(pidConnections);
        //console.log('pidEdges:');
        //console.table(pidEdges);

        return pidEdges;
    },


    /*function mapDataBindingsToShapes(pidShapesLibrary, pidDataBindings) {
        console.log('Mapping data bindings to shapes...');
        // TODO: pidDataBindings = (FETCH FROM DATABASE TABLES)
    }*/


    vertexLayoutAlgorithm: function(tree, vertices, edges) {
        console.log("Grid layout algorithm started...");

    },


    generatePidXmlString: function(pidJson) {
                console.log('Generating pidXmlString from pidJson...');
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

                // Add mxGraph and mxGraphModel boilerplate settings
        let xmlString = `
<mxGraphModel dx="${graphSettings.dx}" dy="${graphSettings.dy}" grid="${graphSettings.grid}" gridSize="${graphSettings.gridSize}" guides="${graphSettings.guides}" tooltips="${graphSettings.tooltips}" connect="${graphSettings.connect}" arrows="${graphSettings.arrows}" fold="${graphSettings.fold}" page="${graphSettings.page}" pageScale="${graphSettings.pageScale}" pageWidth="${graphSettings.pageWidth}" pageHeight="${graphSettings.pageHeight}" background="${graphSettings.background}" math="${graphSettings.math}" shadow="${graphSettings.shadow}">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>`;

        // Add vertices:
        pidEquipments.forEach((pidEquipment) => {
            const equipmentCount = pidEquipments.length;
            console.log(`Generating XML-tags for ${equipmentCount} equipment instances...`);
            // Conditional inside template literal to set either parent or default _parent
            // Values not preceeded with '_' are instance attributes (from database)
            xmlString += `
    <mxCell id="${pidEquipment.id}" value="${pidEquipment._value}" style="${this.concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" parent="${pidEquipment.parent ? pidEquipment.parent : pidEquipment._parent}">
      <mxGeometry x="50" y="50" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidInstruments.forEach((pidInstrument) => {
            const instrumentCount = pidInstruments.length;
            console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
            xmlString += `
    <mxCell id="${pidInstrument.id}" value="${pidInstrument._value}" style="${this.concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" parent="${pidInstrument.parent ? pidInstrument.parent : pidInstrument._parent}">
      <mxGeometry x="50" y="50" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidArrows.forEach((pidArrow) => {
            const arrowCount = pidArrows.length;
            console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
            xmlString += `
    <mxCell id="${pidArrow.id}" value="${pidArrow._value}" style="${this.concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" parent="${pidArrow.parent ? pidArrow.parent : pidArrow._parent}">
      <mxGeometry x="50" y="50" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        pidGroups.forEach((pidGroup) => { // FIXME: width and height attributes set depending on group shapeName
            const groupCount = pidGroups.length;
            console.log(`Generating XML-tags for ${groupCount} group instances...`);
            xmlString += `
    <mxCell id="${pidGroup.id}" value="${pidGroup._value}" style="${this.concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" parent="${pidGroup.parent ? pidGroup.parent : pidGroup._parent}">
      <mxGeometry x="50" y="50" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        // Add edges:
        pidLines.forEach((pidLine) => {
            const lineCount = pidLines.length;
            console.log(`Generating XML-tags for ${lineCount} line instances...`);
            xmlString += `
    <mxCell id="${pidLine.id}" value="${pidLine._value}" style="${this.concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.node_0}" target="${pidLine.node_1}" parent="${pidLine._parent}">
      <mxGeometry x="50" y="50" as="${pidLine.mxGeometry._as}"></mxGeometry>
    </mxCell>`;
        });

        // Add database bindings

        // Add boilerplate closing tags
        xmlString += `
  </root>
</mxGraphModel>`;

        console.log(xmlString);
        return xmlString;
    },


    buildHierarchy: function(flatArray) {
        console.log('Building hierarchy from pidJson...');
        let treeArray = [];
        let lookup = [];
        // Filter nodes from plant instances
        let nodesArray = flatArray.filter((instance) => instance._vertex === '1');
        //console.log('nodesArray = \n');
        //console.log(nodesArray);
        // Build node instance hierarchy in treeArray
        nodesArray.forEach((node) => {
            //console.log(node);
            let nodeId = node.id; // Select current node's id
            //console.log(`nodeId: ${nodeId}`);
            lookup[nodeId] = node; // Clone node to id key of lookup array 
            //console.log(lookup[nodeId]);
            node['children'] = []; // Add a children property (array type)
            //console.log('node[\'children\'] = \n');
            //console.log(node['children']);
        });
        nodesArray.forEach((node) => {
            if (node['parent']) {
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
        return treeArray;
    },


    // function placeVertex(vertices, edges) {
    //     // Layout settings and constraints
    //     const groupPadding = 10;
    //     const spacing = 10;

    //     // const hierarchyLevels = 8;
    //     // let nodesLevel = [];
    //     // for (level in range(hierarchyLevels)) {
    //     //   let nodesLevel[level];
    //     //   nodesLevel[level] = vertices.filter(
    //     //     vertex => vertex.node_level === level
    //     // );
    //     // }
    //     let nodes0Level;
    //     level0Nodes = vertices.filter(
    //         vertex => vertex.node_level === 0
    //     );
    //     let level1Nodes;
    //     level1Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 1
    //     );
    //     let level2Nodes;
    //     level2Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 2
    //     );
    //     let level3Nodes;
    //     level3Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 3
    //     );
    //     let level4Nodes;
    //     level4Nodes = vertices.filter(
    //         vertex => vertex.pidClass === 4
    //     );

    //     // FIXME: How many levels in total? fix number?
    //     let nodesCount = [];
    //     for (level in range(hierarchyLevels)) {
    //         nodesCount[level] = nodesCount[level].length;
    //     }

    //     forEach

    //     console.log(`level0Nodes: ${level0Nodes.length}`);
    //     console.log(`level1Nodes: ${level1Nodes.length}`);
    //     console.log(`level2Nodes: ${level2Nodes.length}`);
    //     console.log(`level3Nodes: ${level3Nodes .length}`);
    //     console.log(`level4Nodes: ${level4Nodes.length}`);

    //     vertices.forEach((vertex) => {
    //         switch (vertex.node_level) {
    //             case 0:

    //             case 1:

    //             case 2:

    //             case 3:

    //             case 4:

    //             case 5:

    //             case 6:

    //         }

    //     });
    // }

    concatenateStyles: function(styleObject) {
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
    },


    renderXml: function(xmlString) {
        console.log('Rendering pidXmlString as innerHTML...');
        // Formats raw XML-string to pretty print
        let formattedXmlString = this.formatXml(xmlString, '  ');
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = this.escapeXmlToHtml(formattedXmlString);
        //console.log(`pidHtmlString = \n${formattedHtmlString}`);
        document.getElementById(
            'xml-viewer-div'
        ).innerHTML = formattedHtmlString;
    },


    formatXml: function(xml, tab) {
        // tab = optional indent value, default is tab (\t)
        console.log('Formatting pidXmlString...');
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
    },


    escapeXmlToHtml: function(xmlString) {
        console.log('Escaping pidXmlString to pidHtmlString...');
        let htmlString = String(xmlString)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/ /g, "&nbsp;")
            .replace(/\n/g, "<br />");
        return htmlString;
    },


    parseXml: function(xmlString) {
        var domParser = new DOMParser();
        try {
            var xmlDocument = domParser.parseFromString(xmlString, 'application/xml');
            console.log('pidXmlString parsed to pidXml File');
            return xmlDocument;
        } catch (error) {
            console.error(error);
        }
    },

});

export default component;
