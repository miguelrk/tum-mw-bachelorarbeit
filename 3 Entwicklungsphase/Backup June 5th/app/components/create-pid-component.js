import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
//import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';


var component = SapientComponent.extend(Evented, {
    classNames: ['create-pid-component'],
    classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
    toastMessagesService: service('toast-messages-service'),
    pidInstancesObject: null,
    pidShapesLibraryObject: null,
    jsonString: null,
    jsonObject: null,
    init() {
        this._super(...arguments);
        this.set('jsonObject', null);
        this.set('jsonString', "");
    },
    actions: {
        loadSuccess: function(object, response) {
            // static declaration of pidInstancesArray for testing
            let pidInstancesArray = [{
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Water_injection",
                    cModule: "Control_valve_440",
                    variable: "Control_valve_440_8"
                },
                {
                    shapeName: "pump_(liquid)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Water_injection",
                    cModule: "Pump_P40",
                    pidLabel: "P40",
                    variable: "Pump_P40_9"
                },
                {
                    shapeName: "electric_motor",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Motor",
                    variable: "Motor_11"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_Z",
                    pceCategory: "ZS",
                    pceLocation: "4000",
                    variable: "Kettle_sensor_Z_12"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_T",
                    pceCategory: "TE",
                    pceLocation: "4000",
                    variable: "Kettle_sensor_T_13"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling",
                    cModule: "Control_valve_550",
                    variable: "Control_valve_550_17"
                },
                {
                    shapeName: "compressor,_vacuum_pump",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling",
                    cModule: "Compressor",
                    pidLabel: "C10",
                    variable: "Compressor_18"
                },
                {
                    shapeName: "electric_motor",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Motor",
                    variable: "Motor_20"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_L",
                    pceCategory: "LS",
                    pceLocation: "1000",
                    variable: "Kettle_sensor_L_21"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_Z",
                    pceCategory: "ZS",
                    pceLocation: "1000",
                    variable: "Kettle_sensor_Z_22"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel",
                    cModule: "Kettle_sensor_T",
                    pceCategory: "TE",
                    pceLocation: "1000",
                    variable: "Kettle_sensor_T_24"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Steam_heating",
                    cModule: "Control_valve_420",
                    variable: "Control_valve_420_26"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Steam_heating",
                    cModule: "Control_valve_410",
                    variable: "Control_valve_410_27"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_160",
                    variable: "Control_valve_160_31"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_170",
                    variable: "Control_valve_170_32"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_150",
                    variable: "Control_valve_150_33"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_220",
                    variable: "Control_valve_220_34"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_360",
                    variable: "Control_valve_360_35"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_320",
                    variable: "Control_valve_320_36"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_130",
                    variable: "Control_valve_130_37"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_140",
                    variable: "Control_valve_140_38"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Control_valve_120",
                    variable: "Control_valve_120_39"
                },
                {
                    shapeName: "positive_displacement",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Sensor_flow",
                    pceCategory: "FT",
                    pceLocation: "3000",
                    variable: "Sensor_flow_40"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    cModule: "Valve_BELIMO",
                    variable: "Valve_BELIMO_41"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_110",
                    variable: "Control_valve_110_43"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_020",
                    variable: "Control_valve_020_44"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_040",
                    variable: "Control_valve_040_45"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_030",
                    variable: "Control_valve_030_46"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_010",
                    variable: "Control_valve_010_47"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Control_valve_580",
                    variable: "Control_valve_580_49"
                },
                {
                    shapeName: "pump_(liquid)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet",
                    cModule: "Pump_P30",
                    pidLabel: "P30",
                    variable: "Pump_P30_50"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Cold_water_distribution",
                    cModule: "Control_valve_560",
                    variable: "Control_valve_560_53"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Control_valve_310",
                    variable: "Control_valve_310_55"
                },
                {
                    shapeName: "three_way_valve",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Three_way_tap",
                    pceCategory: "FV",
                    pceLocation: "2000",
                    variable: "Three_way_tap_56"
                },
                {
                    shapeName: "positive_displacement",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    cModule: "Sensor_flow",
                    pceCategory: "FT",
                    pceLocation: "2000",
                    variable: "Sensor_flow_57"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_340",
                    variable: "Control_valve_340_59"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_350",
                    variable: "Control_valve_350_60"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_460",
                    variable: "Control_valve_460_61"
                },
                {
                    shapeName: "gate_valve_(diaphragm)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixed_water_distribution",
                    cModule: "Control_valve_470",
                    variable: "Control_valve_470_62"
                },
                {
                    shapeName: "pressurized_vessel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "agitator_(propeller)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "shell_and_tube_heat_exchanger_2",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Vessel"
                },
                {
                    shapeName: "funnel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Mash_pan",
                    eModule: "Waste_gas_cooling"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Water_supply",
                    eModule: "Mixing_valve",
                    pceCategory: "FT",
                    pceLocation: "2000"
                },
                {
                    shapeName: "tank_(conical_roof)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel"
                },
                {
                    shapeName: "agitator_(turbine)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Lauter_kettle",
                    eModule: "Vessel"
                },
                {
                    shapeName: "discInst_(field)",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Outlet",
                    pceCategory: "FT",
                    pceLocation: "3000"
                },
                {
                    shapeName: "funnel",
                    site: "Aida",
                    area: "Brewery",
                    cell: "Brewhouse",
                    unit: "Pump_station",
                    eModule: "Inlet"
                }
            ];
            console.log(pidInstancesArray[5].shapeName);

            console.log("pid-shapes-library file uploaded and response added to object...");
            this.set(object, response);

            var pidShapesLibraryObject = this.get(object);
            console.log("pidShapesLibraryObject =\n");
            console.table(pidShapesLibraryObject);
            console.table(pidInstancesArray);

            // removes sapient disabled class for success-button
            document.getElementById("generate-pid-button").className = "button button-success";
        },
        loadError: function(err) {
            console.log("Error during File Upload...\n");
            console.log(err);
        },

        generatePidXml: function() {
            console.time();
            this.set('loading', true);
            console.log("XML Generation started...");

            //mapInstancesToShapes();
            //generatePidXmlString();
            //parseXml();

            console.timeEnd();
        },

        uploadPidXml: function() {
            this.set('loading', true);
            console.log("Upload P&ID XML-file to Sapient Engine...");

            //mapInstancesToShapes(pidShapesLibraryObject);

        },

        /////////////////////////////////////////////////////////////////////////////////////// 
        //                         Secondary Function declarations:
        /////////////////////////////////////////////////////////////////////////////////////// 

        mapInstancesToShapes: function() {
            console.time();
            console.log("Mapping of instances to shapes started...");

            console.timeEnd();
        },

        generatePidXmlString: function(pidJson) {

        },


        xmlToHtml: function(xmlString) {
            let htmlString = String(xmlString).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return htmlString;
        },

        concatenateStyles: function(stylesObject) {
            let styles = stylesObject;
            let stylesString = "";
            // USE REDUCE INSTEAD OF FOREACH
            styles.forEach((style) => {
                if (style === "") {
                    // Skip empty attribute
                } else {
                    // Concatenate attribute
                    stylesString += `${style};`;
                }
                return stylesString;
            });
        },

        parseXml: function(xmlString) {
            var domParser = new DOMParser();
            var xmlDocument = domParser.parseFromString(xmlString, "application/xml");
        },

        download: function(filename, text) {
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


    }
});
export default component;