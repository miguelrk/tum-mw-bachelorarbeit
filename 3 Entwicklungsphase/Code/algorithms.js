let list2 = [{
        id: 1,
        name: 'home',
        parent: null
    },
    {
        id: 2,
        name: 'about',
        parent: null
    },
    {
        id: 3,
        name: 'team',
        parent: 2
    },
    {
        id: 4,
        name: 'company',
        parent: 2
    },
    {
        id: 5,
        name: 'a',
        parent: 3
    },
    {
        id: 6,
        name: 'b',
        parent: null
    },
    {
        id: 7,
        name: 'c',
        parent: 2
    },
    {
        id: 8,
        name: 'd',
        parent: 2
    }
];

let list = [{
        "shapeName": "site_group",
        "id": "G1",
        "name": "Aida",
        "parent": "",
        "node_level": 1,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "area_group",
        "id": "G2",
        "name": "Brewery",
        "parent": "G1",
        "node_level": 2,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "cell_group",
        "id": "G3",
        "name": "Brewhouse",
        "parent": "G2",
        "node_level": 3,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "unit_group",
        "id": "G4",
        "name": "Lauter_kettle",
        "parent": "G3",
        "node_level": 4,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G5",
        "name": "Water_injection",
        "parent": "G4",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E1",
        "name": "Control_valve_440",
        "parent": "G5",
        "node_level": 6,
        "variable": "Control_valve_440_8",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "pump_(liquid)",
        "id": "E2",
        "name": "Pump_P40",
        "parent": "G5",
        "node_level": 6,
        "variable": "Pump_P40_9",
        "pidLabel": "P40",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G6",
        "name": "Vessel",
        "parent": "G4",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "electric_motor",
        "id": "E3",
        "name": "Motor",
        "parent": "G6",
        "node_level": 6,
        "variable": "Motor_11",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I1",
        "name": "Kettle_sensor_Z",
        "parent": "G6",
        "node_level": 7,
        "variable": "Kettle_sensor_Z_12",
        "pidLabel": "",
        "pidFunction": "ZS",
        "pidNumber": "4000"
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I2",
        "name": "Kettle_sensor_T",
        "parent": "G6",
        "node_level": 7,
        "variable": "Kettle_sensor_T_13",
        "pidLabel": "",
        "pidFunction": "TE",
        "pidNumber": "4000"
    },
    {
        "shapeName": "tank_(conical_roof)",
        "id": "E4",
        "name": "",
        "parent": "G6",
        "node_level": 6,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "agitator_(turbine)",
        "id": "E5",
        "name": "",
        "parent": "G6",
        "node_level": 6,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "unit_group",
        "id": "G7",
        "name": "Mash_pan",
        "parent": "G3",
        "node_level": 4,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G8",
        "name": "Waste_gas_cooling",
        "parent": "G7",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E6",
        "name": "Control_valve_550",
        "parent": "G8",
        "node_level": 6,
        "variable": "Control_valve_550_17",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "compressor,_vacuum_pump",
        "id": "E7",
        "name": "Compressor",
        "parent": "G8",
        "node_level": 6,
        "variable": "Compressor_18",
        "pidLabel": "C10",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G9",
        "name": "Vessel",
        "parent": "G7",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "electric_motor",
        "id": "E8",
        "name": "Motor",
        "parent": "G9",
        "node_level": 6,
        "variable": "Motor_20",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I3",
        "name": "Kettle_sensor_L",
        "parent": "G9",
        "node_level": 7,
        "variable": "Kettle_sensor_L_21",
        "pidLabel": "",
        "pidFunction": "LS",
        "pidNumber": "1000"
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I4",
        "name": "Kettle_sensor_Z",
        "parent": "G9",
        "node_level": 7,
        "variable": "Kettle_sensor_Z_22",
        "pidLabel": "",
        "pidFunction": "ZS",
        "pidNumber": "1000"
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I5",
        "name": "Kettle_sensor_T",
        "parent": "G9",
        "node_level": 7,
        "variable": "Kettle_sensor_T_24",
        "pidLabel": "",
        "pidFunction": "TE",
        "pidNumber": "1000"
    },
    {
        "shapeName": "pressurized_vessel",
        "id": "E9",
        "name": "",
        "parent": "G9",
        "node_level": 6,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "agitator_(propeller)",
        "id": "E10",
        "name": "",
        "parent": "G9",
        "node_level": 6,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "shell_and_tube_heat_exchanger_2",
        "id": "E11",
        "name": "",
        "parent": "G9",
        "node_level": 6,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G10",
        "name": "Steam_heating",
        "parent": "G7",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E12",
        "name": "Control_valve_420",
        "parent": "G10",
        "node_level": 6,
        "variable": "Control_valve_420_26",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E13",
        "name": "Control_valve_410",
        "parent": "G10",
        "node_level": 6,
        "variable": "Control_valve_410_27",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "unit_group",
        "id": "G11",
        "name": "Pump_station",
        "parent": "G3",
        "node_level": 4,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G12",
        "name": "Outlet",
        "parent": "G11",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E14",
        "name": "Control_valve_160",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_160_31",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E15",
        "name": "Control_valve_170",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_170_32",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E16",
        "name": "Control_valve_150",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_150_33",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E17",
        "name": "Control_valve_220",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_220_34",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E18",
        "name": "Control_valve_360",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_360_35",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E19",
        "name": "Control_valve_320",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_320_36",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E20",
        "name": "Control_valve_130",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_130_37",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E21",
        "name": "Control_valve_140",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_140_38",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E22",
        "name": "Control_valve_120",
        "parent": "G12",
        "node_level": 6,
        "variable": "Control_valve_120_39",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "positive_displacement",
        "id": "E23",
        "name": "Sensor_flow",
        "parent": "G12",
        "node_level": 6,
        "variable": "Sensor_flow_40",
        "pidLabel": "",
        "pidFunction": "FT",
        "pidNumber": "3000"
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E24",
        "name": "Valve_BELIMO",
        "parent": "G12",
        "node_level": 6,
        "variable": "Valve_BELIMO_41",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I6",
        "name": "",
        "parent": "G12",
        "node_level": 7,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "FT",
        "pidNumber": "3000"
    },
    {
        "shapeName": "emodule_group",
        "id": "G13",
        "name": "Inlet",
        "parent": "G11",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E25",
        "name": "Control_valve_110",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_110_43",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E26",
        "name": "Control_valve_020",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_020_44",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E27",
        "name": "Control_valve_040",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_040_45",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E28",
        "name": "Control_valve_030",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_030_46",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E29",
        "name": "Control_valve_010",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_010_47",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E30",
        "name": "Control_valve_580",
        "parent": "G13",
        "node_level": 6,
        "variable": "Control_valve_580_49",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "pump_(liquid)",
        "id": "E31",
        "name": "Pump_P30",
        "parent": "G13",
        "node_level": 6,
        "variable": "Pump_P30_50",
        "pidLabel": "P30",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "unit_group",
        "id": "G14",
        "name": "Water_supply",
        "parent": "G3",
        "node_level": 4,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G15",
        "name": "Cold_water_distribution",
        "parent": "G14",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E32",
        "name": "Control_valve_560",
        "parent": "G15",
        "node_level": 6,
        "variable": "Control_valve_560_53",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "emodule_group",
        "id": "G16",
        "name": "Mixing_valve",
        "parent": "G14",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E33",
        "name": "Control_valve_310",
        "parent": "G16",
        "node_level": 6,
        "variable": "Control_valve_310_55",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "three_way_valve",
        "id": "E34",
        "name": "Three_way_tap",
        "parent": "G16",
        "node_level": 6,
        "variable": "Three_way_tap_56",
        "pidLabel": "",
        "pidFunction": "FV",
        "pidNumber": "2000"
    },
    {
        "shapeName": "positive_displacement",
        "id": "E35",
        "name": "Sensor_flow",
        "parent": "G16",
        "node_level": 6,
        "variable": "Sensor_flow_57",
        "pidLabel": "",
        "pidFunction": "FT",
        "pidNumber": "2000"
    },
    {
        "shapeName": "discInst_(field)",
        "id": "I7",
        "name": "",
        "parent": "G16",
        "node_level": 7,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "FT",
        "pidNumber": "2000"
    },
    {
        "shapeName": "emodule_group",
        "id": "G17",
        "name": "Mixed_water_distribution",
        "parent": "G14",
        "node_level": 5,
        "variable": "",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E36",
        "name": "Control_valve_340",
        "parent": "G17",
        "node_level": 6,
        "variable": "Control_valve_340_59",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E37",
        "name": "Control_valve_350",
        "parent": "G17",
        "node_level": 6,
        "variable": "Control_valve_350_60",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E38",
        "name": "Control_valve_460",
        "parent": "G17",
        "node_level": 6,
        "variable": "Control_valve_460_61",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    },
    {
        "shapeName": "gate_valve_(diaphragm)",
        "id": "E39",
        "name": "Control_valve_470",
        "parent": "G17",
        "node_level": 6,
        "variable": "Control_valve_470_62",
        "pidLabel": "",
        "pidFunction": "",
        "pidNumber": ""
    }
];


function buildHierarchy(flatList) {
    var treeList = [];
    var lookup = [];
    flatList.forEach((item) => {
        console.log(item);
        itemId = item.id;
        console.log(`itemId: ${itemId}`);
        lookup[itemId] = item;
        console.log(lookup[itemId]);
        item['children'] = [];
        console.log(`item['children']: ${item['children']}`);
    });
    flatList.forEach((item) => {
        if (item['parent']) {
            itemParent = item.parent;
            lookup[itemParent].children.push(item);
        } else {
            treeList.push(item);
        }
    });
    return treeList;
};


let tree = buildHierarchy(list);
let treeString = JSON.stringify(tree);
console.log(`treeString = \n${tree}`);
console.log(`treeString = \n${JSON.stringify(tree)}`);
document.getElementById('container').innerHTML = treeString;


// function pidLayoutAlgorithm(verteci, edges) {
//     // Layout settings and constraints
//     const margin = 2;
//     const spacing = 10;

//     const totalLevels = 8;
//     let nodes = [];
//     for (level in range(totalLevels)) {
//         let nodes[level];
//         nodes[level] = verteci.filter(
//             vertex => vertex.node_level === level
//         );
//     }
//     // let nodes0Level;
//     // level0Nodes = verteci.filter(
//     //     vertex => vertex.node_level === 0
//     // );
//     // let level1Nodes;
//     // level1Nodes = verteci.filter(
//     //     vertex => vertex.pidClass === 1
//     // );
//     // let level2Nodes;
//     // level2Nodes = verteci.filter(
//     //     vertex => vertex.pidClass === 2
//     // );
//     // let level3Nodes;
//     // level3Nodes = verteci.filter(
//     //     vertex => vertex.pidClass === 3
//     // );
//     // let level4Nodes;
//     // level4Nodes = verteci.filter(
//     //     vertex => vertex.pidClass === 4
//     // );

//     // FIXME: How many levels in total? fix number?
//     let nodesCount = [];
//     for (level in range(totalLevels)) {
//         nodesCount[level] = nodesCount[level].length;
//     }

//     forEach

//     console.log(`level0Nodes: ${level0Nodes.length}`);
//     console.log(`level1Nodes: ${level1Nodes.length}`);
//     console.log(`level2Nodes: ${level2Nodes.length}`);
//     console.log(`level3Nodes: ${level3Nodes .length}`);
//     console.log(`level4Nodes: ${level4Nodes.length}`);

//     verteci.forEach((vertex) => {
//         switch (vertex.node_level) {
//             case 0: // enterprise_group
//                 vertex._width = pageWidth - 2 * margin;
//                 vertex_height = pageHeight - 2 * margin;
//             case 1: // site_group
//                 vertex_width = pageWidth - 4 * margin;
//                 vertex_height = pageHeight - 4 * margin;
//             case 2: // area_group
//                 vertex_width = pageWidth - 6 * margin;
//                 vertex_height = pageHeight - 6 * margin;
//             case 3: // cell_group
//                 vertex_width = pageWidth - 8 * margin;
//                 vertex_height = pageHeight - 8 * margin;
//             case 4: // unit_groups
//                 vertex_width = pageWidth - 10 * margin;
//                 vertex_height = pageHeight - 10 * margin;
//             case 5:
//                 let V = [...nodes[6], ...nodes[7]];
//                 let rectArea = [];
//                 let
//                     rectArea = V.forEach((v) => {
//                         rectArea[v] = v._width * v._height;

//                     });
//             case 6:

//         }

//     });
// }