import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import EmberUploader from 'ember-uploader';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';


const uploader = EmberUploader.Uploader.create({
    xmlFileName: 'pid-visualization.xml',
    xmlUrl: './research-sapient-app/public/assets/detail-layout',
    method: 'POST' // POST is default method but PUT requiered to overwrite existing but not suported by this url
});

let component = SapientComponent.extend(Evented, {
    /**
     * Component for the creation of P&ID Visualizations in XML format.
     * 
     * @author Miguel Romero
     * @version 2.3
    */

    // Global Ember Variable Declarations: (to be accessible globally via this.get() or this.set())
    // For ember (services, helpers, ...)
    classNames: ['create-pid-component'],
    classNameBindings: ['inBar:component', 'inBar:create-pid-component'],
    toastMessagesService: service('toast-messages-service'),
    server: service, // for db queries
    subscription: undefined, // for db queries
    // For continue test conditions (booleans)
    fileInput: false, // true when input file succesfully loaded
    rootNode: false, // true when valid root node selected and succesfully fetched corresponding node from database
    loading: false,
    // For file input
    pidShapesLibrary: undefined,
    // For root selection
    pidRootNodeId: undefined, // return value of node tree boardlet on click event (id of target)
    pidRootNode: undefined, // corresponding selected root node fetched from database
    // For progress bar
    showProgressBar:false,
    currentProgressValue:0,
    maxProgressValue:100,
    // For fetched data from database
    pidNodes: null, // database query:  SELECT * sapient._owner.l_nodes WHERE id >= pidRootNodeId (with various LEFT JOINs)
    pidConnections: null, // database query:  SELECT * sapient._owner.prj_prc_pro_flows
    // For input and return values of functions in script
    pidNodesTree: undefined, // output of buildHierarchy(pidNodes)
    pidNodesInOrder: undefined, // output of traverseAndSort(pidNodesTree)
    pidVertices: undefined, // output of mapNodesToShapes() - accesses pidNodesInOrder and pidShapesLibrary from within function
    pidEdges: undefined, // output of mapConnectionsToShapes() - accesses pidConnections, pidVertices and pidShapesLibrary from within function
    // For visualization
    pidJson: undefined, // input of generatePidXmlString()
    pidJsonString: '', // to download pid-visualization in JSON format
    pidXmlString: '', // to download/upload pid-visualization in XML format
    pidHtmlString: '', // to render pid-visualization in HTML valid (escaped XML) format


    /*********************** Variable initialization ***************************/
    init() {
        this._super(...arguments);
        this.set('jsonObject', null);
        this.set('jsonString', '');
    },

    /************************** Action declarations ****************************/
    actions: {

        /**
         * Loads input file on upload by adding response to object
         *
         * @param {String} object
         * @param {String} response
         */
        loadSuccess: function(object, response) {

            this.set(object, response);
            this.set('pidShapesLibrary', this.get(object));
            console.log(`File loaded succesfully.`);

            this.set('fileInput', true);
            this.checkToEnableButton();
        },
            
        /**
         * Catches any error when loading input file
         *
         * @param {String} err
         */
        loadError: function(err) {

            console.log('Error during File Upload...\n');
            console.log(err);

            // Reset to false if error on file upload change
            this.set('fileInput', false);
            this.checkToEnableButton();
        },
        
    },
    
    /************************* Observer declarations ***************************/

    /**
     * Observer: gets selected root node id on change in selection from Node Tree 
     * Boardlet from parentView.parameters.node.value and writes it in value
     * attribute of input field
     *
     */
    rootSelected: observer('parentView.parameters.node.value', function () {
        
        this.resetProgressBar();
        let value = this.get('parentView.parameters.node.value');
        // Skip initial value of pidRootNodeId Because null == undefined:
        // (variable == null) equals (variable === undefined || variable === null)
        if (value === null || value === undefined) { 
            this.set('rootNode', false);
        } else if (value === 1) {
            alert('Please select a node under the Legato root node.');
            document.getElementById('root-node-selection').value = 'Please select a node under the Legato root node.';
            document.getElementById('selection-field').style.color = 'red';
        } else {
            this.set('rootNode', true);
            this.set('pidRootNodeId', value);
            this.getData('pidRootNode');            
        }
        console.log(`Selected root node Id: ${this.get('pidRootNodeId')}`);
        this.checkToEnableButton();
    }),

    /************************* Function declarations ***************************/
    
    /**
     * Checks fileInput and rootNode global boolean values to enable or disable generate
     * P&ID XML button (default value is false, called with true on first call) 
     * 
     * @param {bool}
     *
     */
    checkToEnableButton: function() {
        
        // If file loaded and node selected
        if (this.get('fileInput') && this.get('rootNode')) {
            // Remove sapient disabled class for success-button and add event listener
            document.getElementById('generate-pid-button').className =
                'button button-success';
            document.getElementById('generate-pid-button').addEventListener('click', () => {
                this.databaseQueries();
            },false);
            console.groupEnd();
        }
        else {
            // Add sapient disabled class for success-button and remove event listener
            document.getElementById('generate-pid-button').className = 
                'button button-success disabled';
            document.getElementById('generate-pid-button').removeEventListener('click', () => {
                this.databaseQueries();
            },false);
        }
    },

    /**
     * Function to set the value of the progress bar
     *
     * @param progress sets the current value of the progress bar
     * @param max defines the max value of the progress bar
     *
     */
    updateProgressBar: function(progress, max) {

        if (1 === progress) {
            this.set('showProgressBar',true); // show
            this.set('maxProgressValue', max) // set max once
            //console.log(`progressBar set: ${progress}/${max}`);
        }
        else if (1 < progress && progress < max) {
            //console.log(`progressBar updated: ${progress}/${max}`);
        }
        else if (progress === max) {
            // Reset and optionally hide progress bar (if no delay, hides too fast to be seen) 
            //setTimeout(() => this.set('showProgressBar', false), 3000);
            //console.log(`progressBar reached 100% and reset: (${progress}/${max})`);
        }
        this.set("currentProgressValue", progress); // update
    },
    
    /**
     * Resets progress bar
     */
    resetProgressBar: function() {
        
        this.set('currentProgressValue', 0);
        this.set('maxProgressValue', 1);
        //this.set('showProgressBar', false); // hide
    },

    /**
     * Resets globall variables for another XML generation (next script run) 
     * to be called on click event of generate-pid-button
     */
    resetGlobalVariables: function() {
        
        console.groupCollapsed('Reseting global variables...');
        // For continue test conditions (booleans)
        this.set('rootNode', false);
        this.set('loading', false);
        // For fetched data from database
        this.set('pidNodes', null);
        this.set('pidConnections', null);
        // For input and return values of functions in script
        this.set('pidNodesTree', undefined);
        this.set('pidNodesInOrder', undefined);
        this.set('pidVertices', undefined);
        this.set('pidEdges', undefined);
        // For visualization
        this.set('pidJson', undefined);
        this.set('pidJsonString', '');
        this.set('pidXmlString', '');
        this.set('pidHtmlString', '');
        console.groupEnd();
    },

    /**
     * Makes the required database queries
     */
    databaseQueries: function() {
        
        let root = this.get('pidRootNode')[0];
        document.getElementById('xml-viewer-div').innerHTML = `Generating P&ID visualization of ${root.shortName} ...`;
        // Add sapient disabled class for success-button
        document.getElementById('generate-pid-button').className = 'button button-success disabled';

        this.set('loading', true);

        console.groupCollapsed(`Querying database...`);
        this.set('pidNodes', this.getData('pidNodes'));
        this.set('pidConnections', this.getData('pidConnections'));
    },

    /**
     * Queries PostgreSQL database, maps data with nameMappings and sets
     * corresponding global variable ('data') to  object of mapped data
     *
     * @param {String} data A String of data to query (either 'pidRootNode', 'pidNodes' or 'pidConnections')
     * @return {Object} 
     */
    getData: function(data) {
        
        console.log(`Querying database for ${data} records...`);
        let resource, alias, fields, relate, filter;
        let rootId = this.get('pidRootNodeId');
        let nameMappings = [];

        // Build query parameters dynamically depending on data request
        if (data === "pidRootNode") {

            // SELECT node WHERE id = this.get('pidRootNodeId') 
            resource = 'l_nodes';
            filter = [{
                field: 'id',
                op: 'eq',
                val: rootId
            }];
            nameMappings = [
                // From l_nodes:
                { id: 'id' },                       // {Int} Primary Key
                { nodeLevel: 'node_level' },        // {Int}
                { parentId: 'parent' },             // {Int} Id of parent in l_nodes
                { shortName: 'short_name' },        // {String}
                { name: 'name' },                   // {String}
                { details: 'attr_jsonb' }           // {Int} Other details in JsonB format
            ];
        } 
        if (data === "pidNodes") {

            /* OPTIMAL POSTGRESQL QUERY: Query hierarchy of selected root node via recursive PostgreSQL query
             * (couldn't find a way to implement it with available sapient API in javascript)

                -- Select all vertices
                select * from sapient_owner.prj_prc_visu_vertices;

                -- Build tree by fetching all parents of vertices 
                with recursive tree (id, node_level, parent, short_name, name_0, attr_jsonb) as (
                    --start with the "anchor" row
                    select id, node_level, parent, short_name, name_0, attr_jsonb
                    from sapient_owner.l_nodes
                    where id in (select distinct(node)
                    from sapient_owner.prj_prc_visu_vertices)
                    
                    union all
                    
                    select n.id, n.node_level, n.parent, n.short_name, n.name_0, n.attr_jsonb
                    from sapient_owner.l_nodes n
                    join tree on tree.parent = n.id
                )

                -- Selects data to left join and return
                select distinct(tree.id), parent as parent_id, vertex.id as vertex_id, short_name, name_0, is_instrument, shape_name, pid_label, pid_function, pid_number, attr_jsonb
                from tree 
                left join sapient_owner.prj_prc_visu_vertices vertex on tree.id = vertex.node
                where parent is not null
                order by
                id; 
             */
            resource = "l_nodes";
            alias = { "n":"l_nodes", "v":"prj_prc_visu_vertices", "r":"p_value_relations", "c":"p_values_config", "f": "sys_value_formats", "t":"p_value_types", "u":"sys_units" };
            fields = {
                "n": "id, node_level, parent, short_name, name, attr_jsonb",
                "v": "id, node, is_instrument, shape_name, pid_label, pid_function, pid_number",
                "r": "id, node, value",
                "c": "id as c_id, value_type, value_format, unit, value_symbol, name as c_name",
                "f": "id, name as f_name",
                "t": "id, name as t_name",
                "u": "id, name as u_name, unit_symbol"
            };
            relate = [
                    { "src":"n", "dst":"v", "how":"left", "on":{ "src":"id", "dst":"node" } },
                    { "src":"n", "dst":"r", "how":"left", "on":{ "src":"id", "dst":"node" } },
                    { "src":"r", "dst":"c", "how":"left", "on":{ "src":"value", "dst":"id" } },
                    { "src":"c", "dst":"f", "how":"left", "on":{ "src":"value_format", "dst":"id" } },
                    { "src":"c", "dst":"t", "how":"left", "on":{ "src":"value_type", "dst":"id" } },
                    { "src":"c", "dst":"u", "how":"left", "on":{ "src":"unit", "dst":"id" } }
            ];
            filter = { "field":"n.id", "op":"ge", "val":this.get("pidRootNodeId") };
            nameMappings = [
                // From l_nodes:
                { id: 'id' },                       // {Int} Primary Key
                { nodeLevel: 'node_level' },        // {Int}
                { parentId: 'parent' },             // {Int} Id of parent in l_nodes
                { shortName: 'short_name' },        // {String}
                { name: 'name' }, // {String}
                { details: 'attr_jsonb' },          // {Int} Other details in JsonB format
                // From prj_prc_visu_vertices:
                { vId: 'id' },                      // {Int} Primary Key (prj_prc_visu_vertices)
                { isInstrument: 'is_instrument' },  // {Bool} User defined boolean (required for instruments) default is false
                { shapeName: 'shape_name' },        // {String} Shape Name that maps to P&ID shapes library (required!)
                { pidLabel: 'pid_label' },          // {String} Optional label for shapes
                { pidFunction: 'pid_function' },    // {String} User defined instrument function (required for instruments)
                { pidNumber: 'pid_number' },        // {String} User defined instrument number (required for instruments)
                // From p_value_relations:
                // From p_values_config:
                { cValueId: 'c_id'},                // {Int} Primary Key of value (in p_values_config and also in p_values_current)
                // From sys_value_formats
                { fDataType: 'f_name' },            // {Sring} Data type of value (numeric, boolean, string)
                // From p_value_types:
                { tValueType: 't_name' },           // {Sring} (limit, counter, air consumptuion, energy consumption, ...)
                // From sys_units
                { uUnitSymbol: 'unit_symbol' },     // {String} (Nm, J, kPa, °C, ...)
                { uName: 'u_name' },                // {String} (Newtonmeter, Joule, Kilopascal, ...)
                { uFactor: 'factor' }               // {String} (1000, /1000, 10000, ,277778, ...)
            ];
        }
        if (data === "pidConnections") {

            resource = "prj_prc_pro_flows";
            alias = { "flows":"prj_prc_pro_flows", "p": "pro_products", "c":"p_values_config", "f":"sys_value_formats", "t":"p_value_types", "u":"sys_units" };
            fields = {
                "flows": "id, node0, node1, port0, port1, product, is_continuous, rate_value, flow_type",
                "p": "id, symbol",
                "c": "id as c_id, value_type, value_format, unit, value_symbol, name as c_name",
                "f": "id, name as f_name",
                "t": "id, name as t_name",
                "u": "id, name as u_name, unit_symbol"
            };
            relate = [
                    { "src":"flows", "dst":"c", "how":"left", "on":{ "src":"rate_value", "dst":"id" } },
                    { "src":"flows", "dst":"p", "how":"left", "on":{ "src":"product", "dst":"id" } },
                    { "src":"c", "dst":"f", "how":"left", "on":{ "src":"value_format", "dst":"id" } },
                    { "src":"c", "dst":"t", "how":"left", "on":{ "src":"value_type", "dst":"id" } },
                    { "src":"c", "dst":"u", "how":"left", "on":{ "src":"unit", "dst":"id" } }
            ];
            filter = { "field":"flows.id", "op":"nn" };
            nameMappings = [
                // From prj_prc_pro_flows
                { id: 'id'},                        // {Int} Primary Key
                { sourceId: 'node0' },              // {Int} Id of source in l_nodes
                { targetId: 'node1' },              // {Int} Id of target in l_nodes
                { sourcePort: 'port0' },            // {Int} Id of source port
                { targetPort: 'port1' },            // {Int} Id of target port
                { isContinuous: 'is_continuous' },  // {Boolean}
                { flowType: 'flow_type' },          // {String} Type of flow (material_flow, ...)
                // From pro_products
                { pProduct: 'symbol' },             // {String} Product of flow (bier, chair, wheel, ...)
                // From p_values_config:
                { cValueId: 'c_id'},                // {Int} Primary Key of value (in p_values_config and also in p_values_current)
                // From sys_value_formats
                { fDataType: 'f_name' },            // {Sring} Data type of value (numeric, boolean, string)
                // From p_value_types:
                { tValueType: 't_name' },           // {Sring} (air consumptuion, energy consumption, ...)
                // From sys_units
                { uUnitSymbol: 'unit_symbol' },     // {String} (Nm, J, kPa, °C, ...)
                { uName: 'u_name' },                // {String} (Newtonmeter, Joule, Kilopascal, ...)
                { uFactor: 'factor' }               // {String} (1000, /1000, 10000, ,277778, ...)
            ];
        }

        let jsObject = [];

        this.get('server').getRecords(resource, {
            alias: alias,
            fields: fields,
            relate: relate,
            filter: filter
        }, undefined)
        .then((result) => {
            //console.log('Database query result: \n');
            //console.log(result);
            if (result.content.length > 0) {
                let jsonClassArray = result.content;
                //console.log('Database query result content: \n');
                //console.log(jsonClassArray);
                // Build jsObject with only fields in corresonding model
                jsonClassArray.forEach((row) => {
                    let object = {};
                    nameMappings.forEach((entry) => {
                        let attribute = Object.keys(entry);
                        let field = Object.values(entry);
                        object[attribute] = row[field];
                    })
                    jsObject.push(object);
                });
            }

        })
        .then(() => {
            // Set parsed jsObject to corresonding global varible (data)
            this.set(data, jsObject);
        })
        .then(() => {
            if ('pidRootNode' === data) this.renderRootName(this.get('pidRootNode'));
            this.filterData(data);
        });
    },


    renderRootName: function(root) {
        // Log root node name in boardlet
        let name = '';
        // Manage empty name fields for selected root nodes
        if (root.shortName !== '') { name = root[0].shortName }
        else { name = 'Invalid root node for visualization. Select another one.' } 
        document.getElementById('root-node-selection').value = name;
        document.getElementById('selection-field').style.borderColor = 'green';
        this.set('rootNode', true);
    },

    /**
     * Filters queried data (might include nodes that aren't descendants
     * of selected root node) and calls next function (generatePid) 
     * if queried data (pidNodes and pidConnections correctly set to global 
     * variables to continue.
     *
     * @param {String}  data A String queried data (either 'pidRootNode', 'pidNodes' or 'pidConnections')
     *
     */
    filterData: function(data) {
        
        // Continue with PID generation when all queries and left join done
        if (this.get('pidNodes') && this.get('pidConnections')) {

            console.groupCollapsed('Database queries and data mappings done.');
            console.groupCollapsed('all pidNodes');
            console.log(this.get('pidNodes'));
            console.groupEnd();
            console.groupCollapsed('all pidConnections');
            console.log(this.get('pidConnections'));
            console.groupEnd();

            /********************************** pidNodes ********************************************/

            // Filter out non-descendants of selected root node
            this.set('pidNodes', this.getDescendants(this.get('pidRootNodeId'), 0, this.get('pidNodes')));

            // Sort by ascending pidLevel
            this.set('pidNodes', this.get('pidNodes').sort((previous, next) => previous.pidLevel - next.pidLevel));

            /******************************* pidConnections ****************************************/

            // Filter out connections with either a source or a target not in pidNodes
            this.set('pidConnections', this.filterConnections(this.get('pidConnections')));

            // Simplify connections (clear waypoints/wayports of edges)
            this.set('pidConnections', this.simplifyConnections(this.get('pidNodes'), this.get('pidConnections')));

            console.groupCollapsed('pidNodes');
            console.log(this.get('pidNodes'));
            console.groupEnd();
            console.groupCollapsed('pidConnections:');
            console.log(this.get('pidConnections'));
            console.groupEnd();
            console.groupEnd();
            this.generatePid();
        }   
    },


    getDescendants: function(id, level, array) {
        /**
        * Flattens deeply nested arrays (via the children attribute) recursively 
        * with concat and simoultaneously sets the corresponding pidLevel during
        * traversal (starting from level=0 for selected rootNode).
        */
        // Termination:
        if (!id) return;
        // Base case:
        let descendants = [];
        // Recursion
        level += 1; // Increase for every recursive call of getDescendants()
        let children = array.filter((child) => child.parentId === id);
        children.forEach((child) => {
            child.pidLevel = level;
            descendants.push(child);
            let grandchildren = this.getDescendants(child.id, level, array); // recursive
            descendants = Array.isArray(grandchildren) ? descendants.concat(grandchildren) : descendants; // if grandchildren array is not empty, concatenate it, else, return existing
        });
        return descendants;
    },


    filterConnections: function(connections) {

        console.groupCollapsed(`Filtering out connections with non-descendant source or target...`);
        const connectionCount = this.get('pidConnections').length;
        let pidConnections = [];
        connections.forEach((connection) => {

            // Find corresponding source and target vertices from vertices (filtered already in buildHierarchy())
            const sourceIdFound = this.get('pidNodes').some((node) => node.id === connection.sourceId);
            const targetIdFound = this.get('pidNodes').some((node) => node.id === connection.targetId);

            if (sourceIdFound && targetIdFound) pidConnections.push(connection);
        })

        console.log(`Filtered connections: kept ${pidConnections.length}/${connectionCount} of all connections:`);
        console.groupEnd();
        return pidConnections;
    },


    simplifyConnections: function(pidVertices, pidEdges) {
        /**
        * Simplifies connections from and to groups by replacing both the preEdge and
        * postEdge of that connection with a single, direct connection when that is
        * the case. NOTE: simplifiedId retains the id of the startEdge (so remaining
        * properties are inherited from the startEdge, which should have same as endEdge)
        * Simplify connections (clear waypoints/wayports of edges
        * (ex. shape1 --> group1 --> group2 --> shape2  simplified to  shape1 --> shape1))
        *
        */

        console.groupCollapsed(`Simplifying connections by collapsing intermediate ports...`);

        let vertices = pidVertices;
        let edges = pidEdges;
        let simplifiedEdges = [];
        let idsToSkip = [];
        
        edges.forEach((edge) => {

            let startEdge;
            let endEdge;
            let source = getVertexBy('id', edge.sourceId, vertices);
            let target = getVertexBy('id', edge.targetId, vertices);

            // Case: if connection of edge already simplified and thus edge.id pushed to idsToSkip array
            if (idsToSkip.find((id) => id === edge.id)) {
                console.log(`${edge.id} found in idsToSkip --> return`);
                return;
            }
            else if (undefined !== source && undefined !== target) {
                // Case: shape --> shape
                if ('group' !== target.pidClass && 'group' !== source.pidClass) {
                    console.log(`edge ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass} --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
                    simplifiedEdges.push(edge);
                }

                // Case: group --> group
                else {
                    // Traverse connection back and forth (to first startPort and last endPort)
                    startEdge = getFirstEdge(edge, source, target); // recursively get previousEdge until startEdge
                    endEdge = getLastEdge(edge, source, target); // recursively get nextEdge until endEdge
                    // Clone targetId and targetPort of endEdge and rest of startEdge
                    let simplifiedEdge = startEdge;
                    simplifiedEdge.targetId = endEdge.targetId;
                    simplifiedEdge.targetPort = endEdge.targetPort;
                    // Push a single, direct and simplified edge to the array
                    simplifiedEdges.push(simplifiedEdge);

                    let simplifiedEdgeSource = getVertexBy('id', simplifiedEdge.sourceId, vertices);
                    let previousEdgeTarget = getVertexBy('id', simplifiedEdge.targetId, vertices);
                    console.log(`simplifiedEdge ${simplifiedEdge.id}: ${simplifiedEdge.sourceId} | ${simplifiedEdgeSource.shortName} | ${source.pidClass} --> ${previousEdgeTarget.shortName} | ${source.pidClass} | ${edge.targetId}`);
                }
            }
            console.log(`Simplified connections: kept ${simplifiedEdges.length}/${edges.length} filtered connections:`);
            
        });


        function getVertexBy(property, value, array) {
            return array.find((vertex) => vertex[property] === value);
        }

        function getFirstEdge(edge, source, target) {
            /**
            * Recursively get previousEdge until startEdge
            */
            idsToSkip.push(edge.id);
            //console.log(idsToSkip.length);
            let previousEdge = getPreviousEdge(edge);
            if (!previousEdge) {
                console.log(`return ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass} --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
                return edge;
            } else {
                let previousEdgeSource = getVertexBy('id', previousEdge.sourceId, vertices);
                let previousEdgeTarget = getVertexBy('id', previousEdge.targetId, vertices);
                let firstEdge = getFirstEdge(previousEdge, previousEdgeSource, previousEdgeTarget);
                return firstEdge;
            }
        }

        function getPreviousEdge(edge) {
            // Find corresponding edge and clone
            return edges.find((previousEdge) => edge.sourcePort === previousEdge.targetPort);
            // Return clone or 'isStartEdge' string if previousEdge = undefined (no previousEdge found)
        }

        function getLastEdge(edge, source, target) {
            /**
            * Recursively get nextEdge until endEdge
            */
            idsToSkip.push(edge.id);
            //console.log(idsToSkip.length);
            let nextEdge = getNextEdge(edge);
            if (!nextEdge) {
                console.log(`return ${edge.id}: ${edge.sourceId} | ${source.shortName} | ${source.pidClass}) --> ${target.pidClass} | ${source.shortName} | ${edge.targetId}`);
            } else if (nextEdge) {
                let nextEdgeSource = getVertexBy('id', nextEdge.sourceId, vertices);
                let nextEdgeTarget = getVertexBy('id', nextEdge.targetId, vertices);
                getLastEdge(nextEdge, nextEdgeSource, nextEdgeTarget);
            }
            return edge;
        }

        function getNextEdge(edge) {
            // Find corresponding edge and clone
            return edges.find((nextEdge) => edge.targetPort === nextEdge.sourcePort);
        }

        console.groupEnd();
        return simplifiedEdges;
    },


    generatePid: function() {

        console.groupEnd();
            
        // Create node hierarchy out of parent relations (filter nodes only from pidJson)
        this.set('pidNodesTree', this.buildHierarchy(this.get('pidNodes')));

        // Traverse node hierarchy (post-order DFS) and return path (flat vertices array in order)
        this.set('pidNodesInOrder', this.traverseAndSort(this.get('pidNodesTree')));
    
        // Add vertices to pidJson
        this.set('pidVertices', this.mapNodesToShapes());

        // Add edges to pidJson
        this.set('pidEdges', this.mapConnectionsToShapes());

        // Position vertices by modifying default _x and _y vertex properties
        this.set('pidJson', this.vertexPlacement(this.get('pidVertices'), this.get('pidEdges')));
        
        // Generate JSON string from JS-Object (individually for 5 distinct pid classes)
        this.set('pidJsonString', JSON.stringify(this.get('pidJson')));

        // Generate XML File of P&ID Visualization (pidXml) from pidJson
        this.set('pidXmlString', this.generatePidXmlString(this.get('pidJson')));

        // Render XML as Text in xml-viewer-div of boardlet
        this.set('loading', false);
        this.renderXml(this.get('pidXmlString'));

        // Remove sapient disabled class for success-button and adds event listener
        document.getElementById('download-json-button').className = 'button';
        document.getElementById('download-xml-button').className = 'button';
        document.getElementById('upload-pid-button').className = 'button button-success';
        document.getElementById('download-json-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.json', this.get('pidJsonString'));
            },false);
        document.getElementById('download-xml-button').addEventListener('click', () => {
                this.downloadFile('pid-visualization.xml', this.get('pidXmlString'));
            },false);
        // TODO: Implement uploadFile() and set here as callback function
        document.getElementById('upload-pid-button').addEventListener('click', () => {
                this.uploadXmlFile(this.get('pidXmlString'));
            },false);

        // Reset global variables for next visualization generation (fired on click of generate-pid-button)
        this.resetGlobalVariables();
        this.checkToEnableButton();

        console.groupEnd();
    },


    /**
     * Filters the queried nodes array to include only descendandts of 
     * selected root node and builds hierarchical/nested json object of the
     * instance hierarchy from a flat array via the parent attribute.
     *
     * @param {Array} flatArray Flat array with hierarchy via 'parent' property
     * @returns {Array} Nested array with hierarchy via the 'children' property
     *
     */
    buildHierarchy: function(flatArray) {
        
        console.groupCollapsed("Building hierarchy (pidNodeTree) from pidNodes...");
        let treeArray = [];
        let lookup = [];

        // Starting from selected root node (because flatArray is sorted by ascending pidLevel already) 
        console.groupCollapsed('Getting children (if any) for each node and setting array of children to its children property.');
        flatArray.forEach((node) => {
            const nodeId = node.id; // Select current node's id
            console.groupCollapsed(`${nodeId}: ${node.shortName}`);
            lookup[nodeId] = node; // Clone node to id key of lookup array 
            console.log(lookup[nodeId]);
            node.children = []; // Add a children property (array type)
            console.log('node[\'children\']:');
            console.log(node['children']);
            console.groupEnd();
        });
        console.groupEnd();

        console.groupCollapsed('Building hierarchy for root node and descendants.');
        flatArray.forEach((node) => {
            let nodeParentId = node.parentId;
            // Root node: If root node, skip lookup but push to tree
            if (1 === nodeParentId || undefined === lookup[nodeParentId]) {
                // Skip lookup for topmost node but do push it to tree 
                // (because parent won't be found in the lookup array
                // because hierarchy starts from this node and not his parent) 
                console.log(`${node.shortName} is root node for the hierarchy and wasn't attributed a parent.`);
                console.log(nodeParentId);
                console.log(lookup[nodeParentId]);
                treeArray.push(node);
            } 
            // Rest of nodes: If not root node (and parentId attribute exists) push to parent's children array 
            else {
                //console.log(nodeParentId);
                //console.log(lookup[nodeParentId]);
                console.log(`Pushed ${node.id}: ${node.shortName} as child of ${nodeParentId}: ${lookup[nodeParentId].shortName}`);
                lookup[nodeParentId].children.push(node);
            }
        });
        console.log('tree:');
        console.log(treeArray);
        console.groupEnd();
        console.groupEnd();
        return treeArray;
    },


    /**
     *
     * Takes a tree (hierarchical JS-object with children array) and traverses
     * it (post-order DFS - depth-first search) to return the path of the
     * traversed vertices in the form of an ordered array of JS-objects.
     *
     * @param {*} treeArray
     * @returns
     */
    traverseAndSort: function(treeArray) {
        
        console.groupCollapsed("Traversing pidNodeTree depth-first to find path...");

        let path = [];
        let stack = [];
        let tree = treeArray;

        // For each root vertex (works even if more than one root)
        tree.forEach((v) => {
            // Set/reset pidLevel for roots (NOTE: skips enterprise level)
            let level = 0;
            v.pidLevel = level;
            console.group(v);
            // Add vertex to stack
            stack.push(v);

            // While stack exists and not empty (vertices pending in stack)
            while (stack && stack.length) {
                console.table(stack);
                // Pop next vertex from top of stack
                v = stack.pop();
                console.log(`Popped ${v.id}: ${v.shortName} with pidLevel ${v.pidLevel}`);
                // If pidLevel of current vertex was set already during traversal
                if (v.pidLevel !== "") {
                    // Resets level to level of current vertex
                    console.log(`Level reset from ${level} to ${v.pidLevel}`);
                    level = v.pidLevel;
                }
                // If vertex exists and not already (not found) in path array:
                if (v !== undefined && (!path.find((v) => path.id === v.id))) {
                    // Record vertex (all properties) in path array (flat)
                    path.push(v);
                    console.log(`Recording properties in path array (length: ${path.length})`);
                    console.table(path);
                    // If vertex has children
                    if (v.children && v.children.length) {
                        // Lower level by one (for all children)
                        level += 1;
                        // For all children of vertex
                        v.children.forEach((child) => {
                            child.pidLevel = level;
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
            console.groupEnd();
        });

        // Reverse path to start bottoms-up
        path.reverse();
        console.log('path (reversed): \n')
        console.table(path);
        console.log(path);
        console.groupEnd();
        return path;
    },

    /**
     * Maps each pidNode to its corresponding vertex shape (E/I/G/A) and creates a pidVertex
     * instance with all pidNode and pidShape attributes. For pidNodes without 
     * a shapeName (shapeName === '') like groups, it determines the shapeName
     * according to the pidLevel set in traverseAndSort.
     *
     * @returns
     */
    mapNodesToShapes: function() {
        
        console.groupCollapsed("Mapping nodes to shapes (equipment, instruments, arrows, groups)...");
        const pidShapesCount = this.get('pidShapesLibrary').length;
        const pidNodesCount = this.get('pidNodesInOrder').length;
        let pidVertices = [];
 
        this.get('pidNodesInOrder').forEach((pidNode) => {
            let matchingShape = {};
            let details = JSON.parse(pidNode.details);
            if (details !== null && details !== undefined) pidNode.pidHierarchy = details.isaLevel;
            // Set shapeName Fallback: in case of no name (groups are modelled as nodes but not given a 
            // shapeName so shapeName set based on pidLevel, determined in traverseAndSort)
            if (!pidNode.shapeName || pidNode.shapeName === "" || pidNode.shapeName === null || pidNode.shapeName === undefined) {

                if (pidNode.pidHierarchy === 'Enterprise') {
                    // Skip shapeName setting because no shape exists for Enterprise
                }
                else if (pidNode.pidHierarchy === 'Site') {
                    pidNode.shapeName = "site_group";
                }
                else if (pidNode.pidHierarchy === 'Area') {
                    pidNode.shapeName = "area_group";
                }
                else if (pidNode.pidHierarchy === 'Cell') {
                    pidNode.shapeName = "processCell_group";
                }
                else if (pidNode.pidHierarchy === 'Unit') {
                    pidNode.shapeName = "unit_group";
                }
                else if (pidNode.pidHierarchy === 'EModule') {
                    pidNode.shapeName = "eModule_group"; // EModule Groups
                }
                else {
                    // Skip legato system root node
                }
                console.groupCollapsed(`${pidNode.id}: ${pidNode.shortName} shapeName was empty, now set to ${pidNode.shapeName}`);
                console.log('id:    ' + pidNode.id ? pidNode.id : 'empty');
                console.log('name:  ' + pidNode.shortName ? pidNode.shortName : 'empty');
                console.log('shapeName:  ' + pidNode.shapeName ? pidNode.shapeName : 'empty');
                console.log('pidLevel:    ' + pidNode.pidLevel ? pidNode.pidLevel : 'empty');
                console.log('pidHierarchy:    ' + pidNode.pidHierarchy ? pidNode.pidHierarchy : 'empty');
                console.groupEnd();
            }
            else {
                console.groupCollapsed(`${pidNode.id}: ${pidNode.shortName} had shapeName`);
                console.log('id:    ' + pidNode.id ? pidNode.id : 'empty');
                console.log('name:  ' + pidNode.shortName ? pidNode.shortName : 'empty');
                console.log('shapeName:  ' + pidNode.shapeName ? pidNode.shapeName : 'empty');
                console.log('pidLevel:    ' + pidNode.pidLevel ? pidNode.pidLevel : 'empty');
                console.log('pidHierarchy:    ' + pidNode.pidHierarchy ? pidNode.pidHierarchy : 'empty');
                console.groupEnd();
            }

            //Map node to shape via shapeName attributes
            matchingShape = this.get('pidShapesLibrary').find((shape) => shape.shapeName === pidNode.shapeName);
            //console.log(pidNode);
            //console.log(matchingShape);
            // Clone all properties to NEW target object (which is returned) Alternatively: let pidVertex = Object.assign({}, pidNode, matchingShape);
            let pidVertex = { ...pidNode, ...matchingShape };
            pidVertices.push(pidVertex);
        });

        console.log(`Mapped ${pidNodesCount} node instances to vertex shapes from ${pidShapesCount} total shapes in library.`);
        console.log("pidVertices:");
        console.table(pidVertices);
        console.log(JSON.stringify(pidVertices));
        console.groupEnd();
        return pidVertices;
    },

    /**
     * Maps each pidConnection to its corresponding edge shape and creates a pidEdge
     * instance with all pidConnection and pidShape attributes. Because only 
     * process_flows modelled, additionally determines
     * the shapeName according to certain PID Rules for pidConnections.
     *
     * @returns
     *
     */
    mapConnectionsToShapes: function() {
        
        console.groupCollapsed("Mapping connections to line shapes...");
        
        // 3) Map to shapes: set shapeName property and map to corresponding edge shape in pid shapes library
        let pidEdges = [];
        this.get('pidConnections').forEach((simpleConnection) => {
            // Find corresponding source and target vertices from vertices
            let source = this.get('pidVertices').find((vertex) => vertex.id === simpleConnection.sourceId);
            let target = this.get('pidVertices').find((vertex) => vertex.id === simpleConnection.targetId);

            // Catches possible wrongly non-filtered connections
            if ((source !== null || source !== undefined) && (target !== null || target !== undefined)) {

                /* PID RULES
                    Set shapeName to simpleConnection based on flowType attribute in 
                    database or based on logical PID rules (because for now, all lines
                    are modelled as material_flows provisionally)
                    +---------------+-----------+------------+-------+-------+------+
                    | source\target | equipment | instrument | group | arrow | line |
                    +---------------+-----------+------------+-------+-------+------+
                    |   equipment   |     P     |      P     |   P   |   -   |   -  |
                    +---------------+-----------+------------+-------+-------+------+
                    |   instrument  |     P     |      D     |   D   |   -   |   -  |
                    +---------------+-----------+------------+-------+-------+------+
                    |     group     |     P     |      D     |   P   |   -   |   -  |
                    +---------------+-----------+------------+-------+-------+------+
                    |     arrow     |     -     |      -     |   -   |   -   |   -  |
                    +---------------+-----------+------------+-------+-------+------+
                    |      line     |     -     |      -     |   -   |   -   |   -  |
                    +---------------+-----------+------------+-------+-------+------+
                */
                
                if (
                    simpleConnection.flowType === 'data_flow' || 
                    (source.pidClass === 'instrument' && target.pidClass === 'instrument') || 
                    (source.pidClass === 'instrument' && target.pidClass === 'group') || 
                    (source.pidClass === 'group' && target.pidClass === 'instrument')) {
                    simpleConnection.shapeName = 'data_line';
                }
                else if (simpleConnection.flowType === 'signal_flow') {
                    simpleConnection.shapeName = 'signal_line';
                }
                else if (simpleConnection.flowType === 'connection_flow') {
                    simpleConnection.shapeName = 'connection_line';
                }
                else if (
                    simpleConnection.flowType === 'process_flow' || 
                    (source.pidClass === 'equipment' && target.pidClass === 'equipment') || 
                    (source.pidClass === 'equipment' && target.pidClass === 'instrument') || 
                    (source.pidClass === 'equipment' && target.pidClass === 'group') || 
                    (source.pidClass === 'instrument' && target.pidClass === 'equipment') ||
                    (source.pidClass === 'group' && target.pidClass === 'equipment') || 
                    (source.pidClass === 'group' && target.pidClass === 'group')) {
                    simpleConnection.shapeName = 'pipe_line';
                }
                /*else if ( // Instrument between two equipments
                    (source.pidClass === 'equipment' && target.pidClass === 'instrument') || 
                    (source.pidClass === 'instrument' && target.pidClass === 'equipment')) {
                    // 'Short-circuit' equipment to equipment and create connection_line from pipe_line to instrument
                    const source = this.get('pidVertices').find((vertex) => vertex.id === simpleConnection.sourceId);
                    const target = this.get('pidVertices').find((vertex) => vertex.id === simpleConnection.targetId);
                    simpleConnection.shapeName = 'connection_line';
                } */
                else {
                    // Default to connection line
                    simpleConnection.shapeName = 'connection_line';
                }
                
                let matchingShape = {};
                matchingShape = this.get('pidShapesLibrary').find((shape) => shape.shapeName === simpleConnection.shapeName);
                //console.log(simpleConnection);
                //console.log(matchingShape);
                // Clone all properties to NEW target object (which is returned)
                let pidEdge = Object.assign({}, simpleConnection, matchingShape);
                pidEdges.push(pidEdge);
            }
        });
        console.log(`Mapped ${pidEdges.length} connection instances to edge shapes from ${this.get('pidShapesLibrary').length} total shapes in library:`);
        console.table(pidEdges);

        console.groupEnd();
        return pidEdges;
    },

    /**
     *
     *
     * @param {*} pidVertices
     * @param {*} pidEdges
     * @returns
     *
     */
    vertexPlacement: function(pidVertices, pidEdges) {
        
        console.groupCollapsed("Positioning vertices in graph...");
        let vertices = pidVertices.filter((v) => v.shapeName && v.parentId && v.shapeName !== '' && v.parentId !== 1); // filter out not visualizable vertices (enterprise and legato nodes)
        let edges = pidEdges;

        console.table(vertices);
        console.table(edges);

        /* 
         *   Key:
         *    s: settings - global user defined settings for controlled tunning of the algorithm
         *    m: memory - temporary memory object (reset each iteration) for frequently accessed variables
         *    p: previous - clone of previous object
         *    v: vertex - original instance of vertex object (of current iteration)
        */

        let m = {};
        let p = {};
        let s = {
            cellSpacing: 125, // spacing between 2 shapeCells
            cellMargin: 25,
            margin: 60, // Margin between parent group and the contained block (area from left-and-uppermost cell corner and right-and-lowermost cell corner (calculated with top-, right-, bottom- and left-boundaries))
            groupSpacing: 200, // Spacing between 2 innerGroups
            pageWidth: 1654,
            pageHeight: 1169,
        };

        const pidLevelCount = findMax('pidLevel', vertices);
        let memory = []; // Needed to keep track (permanently until end of algorithm) of frequently accessed and calculated variables
        let stack = []; // Needed to keep track ONLY OF VERTICES WITH #CHILDOFGROUP (temporarily until ANY innerGroup of next level reached, where it is cleared) 
        // of frequently accessed and calculated variables #childOfNonGroup elements are not pushed to stack because they don't need to be offset by margin,
        // only their parent and they move with it with their relative position to their parent
        for (let i = 0; i <= pidLevelCount; i++) {
            stack[i] = []; // Builds two-dimmensional array of stacks (one for each pidLevel)
        }

        console.log(`Instance Hierarchy (pidJson) has a total depth of ${pidLevelCount} pidLevels.`);
        let progress = 0;
        let verticesCount = vertices.length;
        let max = verticesCount;
        console.log(`verticesCount: ${verticesCount}`);
        console.log(`max: ${max}`);


        vertices.forEach((v) => {
            
            this.updateProgressBar(++progress, max);
            console.groupCollapsed(`${v.pidLevel}: ${v.pidClass} (${v.shortName})`);
            console.log(`stack[${v.pidLevel}]`);
            console.table(stack[v.pidLevel]);

            // Frequently accessed variables pushed to memory object ('_' indicates mxGraph private variable)
            m = {
            // Extracted from vertex object (v):
            name: v.shortName,
            lvl: v.pidLevel,
            pidClass: v.pidClass,
            pidHierarchy: v.pidHierarchy,
            id: v.id,
            parent: getParent(v.parentId, vertices),
            siblings: getSiblings(v.parentId, memory),
            children: getChildren(v.id, memory),
            descendants: getDescendants(v.id, memory),
            // To be calculated:
            tags: [],
            x: parseInt(v.mxGeometry._x, 10),
            y: parseInt(v.mxGeometry._y, 10),
            w: parseInt(v.mxGeometry._width, 10) ? parseInt(v.mxGeometry._width, 10) : 1000, // 1000 if empty (temporary for groups)
            h: parseInt(v.mxGeometry._height, 10) ? parseInt(v.mxGeometry._height, 10) : 1000, // 1000 if empty (temporary for groups)
            area: parseInt(v.mxGeometry._width, 10) * parseInt(v.mxGeometry._height, 10),
            left: parseInt(v.mxGeometry._x, 10),
            top: parseInt(v.mxGeometry._y, 10),
            right: parseInt(v.mxGeometry._width, 10),
            bottom: parseInt(v.mxGeometry._height, 10)
            };
            console.warn(m.children);
            console.warn(m.descendants);

            /*************************************************************************
            *                     SPECIFICATION OF CONSTRAINTS:                      *
            **************************************************************************
            * Non-group Tags:
            *  - tag[0]: isShape
            *  - tag[1]: childOfGroup || childOfNonGroup
            *  - tag[2]: [nucleus || funnel || inline] || [centeredAboveParent || aroundParent || insideParent]
            *  
            * Group Tags:
            *  - tag[0]: isGroup
            *  - tag[1]: childOfGroup || childOfNonGroup
            *  - tag[2]: outerGroup || innerGroup
            */

            console.group(`1. Tag:`);

            /********************************SHAPES***********************************/
            if ("equipment" === v.pidClass || "instrument" === v.pidClass || "arrow" === v.pidClass) {
                m.tags.push("isShape");

                if (undefined === m.parent) m.tags.push("rootNode"); // no parent exists
                else if ("group" === m.parent.pidClass) {
                    m.tags.push("childOfGroup");
                    if ("vessels" === v.shapeCategory) m.tags.push(`nucleusGroup`);
                    else if ("funnel" === v.shapeType) m.tags.push("funnel");
                    else if ("instrument" === v.shapeType) m.tags.push("centeredAboveParent");
                    else m.tags.push("inline"); // (all children of groups except vessels)
                } else if ("group" !== m.parent.pidClass) {
                    m.tags.push("childOfNonGroup");
                    if ("engines" === v.shapeCategory) m.tags.push("centeredAboveParent");
                    if ("instruments" === v.shapeCategory) {
                        if ("vessels" !== m.parent.shapeCategory) m.tags.push("centeredAboveParent");
                        else if ("vessels" === m.parent.shapeCategory) m.tags.push("aroundParent");
                    }
                    if ("agitators" === v.shapeCategory) m.tags.push("insideParent");
                }

            }
            /*******************************GROUPS************************************/
            else if ("group" === v.pidClass) {
                m.tags.push("isGroup");

                if (undefined === m.parent) m.tags.push("rootNode"); // no parent exists
                else if ("group" === m.parent.pidClass) m.tags.push("childOfGroup");
                else if ("group" !== m.parent.pidClass) m.tags.push("childOfNonGroup");
                if ("Site" === v.pidHierarchy) m.tags.push("outerGroup");
                else if ("Area" === v.pidHierarchy) m.tags.push("outerGroup");
                else if ("Cell" === v.pidHierarchy) m.tags.push("outerGroup");
                else if ("Unit" === v.pidHierarchy) m.tags.push(`innerGroup`);
                else m.tags.push(`innerGroup`);
            }
            console.log(m.tags);
            console.groupEnd();
            /******************END OF SPECIFICATION OF CONSTRAINTS********************/

            /*************************************************************************
            *       GRAPHING ALGORITHM: (ORTHOGONAL, INCLUSIVE VERTEX PLACEMENT)     *
            *************************************************************************/
            console.group(`2. Graph:`);

            /********************************CELLS************************************/
            if (m.tags.includes('isShape')) {
                console.group("#isShape");

                if (m.tags.includes('rootNode')) {
                    console.group("#rootNode");

                    m.x = s.margin;
                    m.y = s.margin;
                }

                else if (m.tags.includes('childOfGroup')) {
                    console.group("#childOfGroup");

                    let descendantsWithParent = memory.filter((child) => (child.parentId === m.id));
                    descendantsWithParent.push(m); // Push root/parent vertex as well
                    console.warn('descendantsWithParent:')
                    console.warn(descendantsWithParent);

                    if (m.tags.includes("inline")) {
                        console.group("#inline");

                        // Set x,y-coordinates relative to previous cell ) (Using conditional (ternary) Operator)
                        m.x = (() => {
                            if (p.pidClass === undefined || p.pidClass === "group") return 0; // if group set at origin (0, 0)
                            else if (p.lvl === m.lvl) return (p.right + s.cellSpacing); // else if in current inline level space shape from previous one
                            else if (p.lvl < m.lvl) return 0; // skip if child (one level lower than current inline shapes). These children move already relative to their parent (next shape)
                            else if (p.lvl > m.lvl) return 0; // reset when back at level of current inline shapes
                            else return 0;
                        })();
                        m.y = (() => {
                            if (p.pidClass === undefined || p.pidClass === "group") return 0; // if group set at origin (0, 0)
                            else if (p.lvl === m.lvl) return (p.y + (p.h - m.h) / 2); // else if in current inline level space shape from previous one
                            else if (p.lvl < m.lvl) return 0; // skip if child (one level lower than current inline shapes). These children move already relative to their parent (next shape)
                            else if (p.lvl > m.lvl) return s.spacing + Math.abs(measureBlock('height', descendantsWithParent)); // reset to new line when back at level of current inline shapes
                        })();

                        console.log(`Coordinates: (${m.x}, ${m.y})`);
                        console.log(m);
                        console.groupEnd();
                    } else if (m.tags.includes("funnel")) {
                        m.x = p.x + s.margin;
                        m.y = p.y + p.w + s.margin;
                    } else if (m.tags.includes("nucleusGroup")) {
                        console.group(`#nucleusGroup`); // nucleusGroups of all pidLevels
                        console.log(`nucleusGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

                        // Measure:
                        const blockWidth = measureBlock('width', descendantsWithParent);
                        const blockHeight = measureBlock('height', descendantsWithParent);
                        const blockX = getMin('left', descendantsWithParent);
                        const blockY = getMin('top', descendantsWithParent);

                        // Scale:
                        scaleGroup(blockWidth, blockHeight, s.margin, descendantsWithParent);

                        // Shift: needs to directly modify the v._mxGeometry._x and v._mxGeometry._y properties of all children
                        // (and with that, its relatively positioned descendants of the children) so function must be 
                        // passed descendantsWithParent and not m.descendants
                        //shiftNucleusGroup(m.descendants);
                        shiftNucleusGroup(blockX, blockY, m.descendants);

                        console.groupEnd();
                    }

                    console.groupEnd();
                } else if (m.tags.includes('childOfNonGroup')) {
                console.group("#childOfNonGroup");

                if (m.tags.includes('centeredAboveParent')) {
                    console.group("#centeredAboveParent");
                    console.log(`Centering shape above its parent (${m.parent.id}: ${m.parent.shortName}).`);
                    const parentWidth = parseInt(m.parent.mxGeometry._width);
                    console.log(`(${parentWidth} / 2) - (${m.w} / 2)`);
                    m.x = (parentWidth / 2) - (m.w / 2);
                    m.y = -m.h - s.cellSpacing;

                    console.groupEnd();
                } else if (m.tags.includes('aroundParent')) {
                    console.group("#aroundParent");

                    // Set x,y-coordinates relative to previous childOfNonGroup
                    //const stackLength = stack[m.lvl].length;
                    const parentWidth = parseInt(m.parent.mxGeometry._width);

                    if (!p.tags.includes('aroundParent')) { // Case for first aroundParent in current level stack (because of order of vertices)
                    console.log(`1st aroundParent child of ${m.parent.shortName} set to take 1st slot.`);
                    m.x = parentWidth + s.cellSpacing;
                    m.y = s.cellSpacing;
                    } else if (p.tags.includes('childOfNonGroup')) {
                    // Case for second, third, ..., n-th childOfNonGroup in current level stack
                    console.log(`aroundParent child of ${m.parent.shortName} set to take next slot (offset relative to previous).`);
                    m.x = parentWidth + s.cellSpacing;
                    console.warn('p.y:');
                    console.warn(p.y);
                    m.y = p.y + p.h + s.cellMargin;
                    }
                    console.groupEnd();
                }
                console.groupEnd();
                }
            }
            /*******************************GROUPS************************************/
            else if (m.tags.includes('isGroup')) {
                console.group("#isGroup");

                if (m.tags.includes('rootNode')) {
                    console.group("#rootNode");

                    m.x = s.margin;
                    m.y = s.margin;
                }

                else if (m.tags.includes('childOfGroup')) {
                    console.group("#childOfGroup");

                    if (m.tags.includes("innerGroup")) {
                        console.group(`#innerGroup`);
                        console.log(`innerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

                        console.log(m.pidHierarchy);

                        // if ('Unit' === m.pidHierarchy) {
                        //   // innerGroup with only group children (either innerGroups or nucleusGroups)
                        //   let children = getChildren(m.id, memory);
                        //   children.forEach((child) => child.tag2)
                        //   console.log(children);
                        //   let childrenGroups = children.filter((child) => child.tag2 === 'innerGroup' || 'nucleusGroup' === child.tag2);
                        //   console.log('childrenGroups');
                        //   console.log(childrenGroups);
                        //   let scaledGroup = packBlocks(childrenGroups, vertices, memory); // function returns scaled group dimmensions
                        //   m.w = scaledGroup.width;
                        //   m.h = scaledGroup.height;
                        //   // Scale:
                        //   //scaleGroup(blockWidth, blockHeight, s.margin, m.descendants);
                        //   // Center:
                        //   //shiftChildren(blockWidth, blockHeight, m.children);
                        //   // Clear:
                        //   clearStack(stack[p.lvl]);
                        // } else {


                        // innerGroup with at least one shape as children

                        // Measure: get absolute measures of all descendants (relative to current parent/grandparent: m)
                        let descendantSides = getAbsoluteSides(m.descendants, m);

                        let blockLeft = Math.abs(getMin("left", descendantSides));
                        let blockRight = getMax("right", descendantSides);
                        let blockTop = Math.abs(getMin("top", descendantSides));
                        let blockBottom = getMax("bottom", descendantSides);
                        let blockWidth = measureBlock('width', descendantSides);
                        let blockHeight = measureBlock('height', descendantSides);
                        console.log('descendantSides');
                        console.log(descendantSides);
                        console.log(blockLeft);
                        console.log(blockRight);
                        console.log(blockTop);
                        console.log(blockBottom);
                        console.log(blockWidth);
                        console.log(blockHeight);

                        // Scale:
                        scaleGroup(blockWidth, blockHeight, s.margin, descendantSides);
                        // Shift:
                        shiftInnerGroup(stack[m.lvl]);
                        // Center:
                        shiftChildren(blockWidth, blockHeight, m.children);
                        // Clear:
                        clearStack(stack[p.lvl]);
                        // }


                    } else if (m.tags.includes("outerGroup")) {
                        console.group("#outerGroup");
                        console.log(`outerGroup reached (currentLevel: ${m.lvl}, previousLevel: ${p.lvl})`);

                        // Measure:
                        if (m.children.length > 1) {
                        // Case for m: Brewhouse with units as children
                        let scaledGroup = packBlocks(m.children, vertices, memory); // function returns scaled group dimmensions
                        m.w = scaledGroup.width;
                        m.h = scaledGroup.height;
                        } else {
                        m.w = 2 * s.margin + measureBlock('width', m.children);
                        m.h = 2 * s.margin + measureBlock('height', m.children);
                        }

                        // Scale: 
                        //scaleGroup(blockWidth, blockHeight, s.margin, m.children);
                        // Shift:
                        //shiftOuterGroup(stack[m.lvl]);

                        // Center:       before: shiftChildren(blockWidth, blockHeight, m.children);
                        // Clear:
                        clearStack(stack[p.lvl]);
                        // m.w = measureBlock('width', m.children); // get width of the only child
                        // m.h = measureBlock('height', m.children); // get height of the only child
                        // centerBlock(m.children);

                    }

                    console.groupEnd();
                }

                console.groupEnd();

            } else if (m.tags.includes('childOfNonGroup')) {
                console.group("#childOfNonGroup");
                // Shouldn't ever exist
                console.groupEnd();
            }

            console.groupEnd();

            /****************************SET VARIABLES********************************/

            console.group(`3. Set:`);

            // 1) Algorithm variables:
            m.left = m.x;
            m.top = m.y;
            m.right = m.x + m.w;
            m.bottom = m.y + m.h;
            console.log(`Sides updated for new coordinates: \nx: ${m.x}\ny: ${m.y}\nw: ${m.w}\nh: ${m.h}\nleft: ${m.left}\ntop: ${m.top}\nright: ${m.right}\nbottom: ${m.bottom}`);

            // 2) pidJson variables:
            v._children = m.children.map((child) => child.id);
            v.mxGeometry._x = m.x;
            v.mxGeometry._y = m.y;
            if (!m.tags.includes('nucleusGroup')) {
                // Skip setting width of shapeCell to width of group because m.w and
                // m.h of nucleus was set to groupWidth and groupHeight already
                v.mxGeometry._width = m.w;
                v.mxGeometry._height = m.h;
            }

            console.log(`id: ${v.id}`);
            console.log(`parent: ${m.parent !== undefined ? m.parent.shortName : "N/A"}`);
            console.log(`m.x: ${v.mxGeometry._x} -> _x`);
            console.log(`m.y: ${v.mxGeometry._y} -> _y`);
            console.log(`m.w: ${v.mxGeometry._width} -> _width`);
            console.log(`m.h: ${v.mxGeometry._height} -> _height`);
            console.groupEnd();

            /*************************END OF ALGORITHM********************************/
            p = m; // Replace previous vertex p with current and re-iterate]
            //console.log("previous");
            //console.table(p);
            // For vertices with #childOfGroup: push current memory m to current level stack
            if (m.tags.includes('childOfGroup')) stack[m.lvl].push(m);
            // For all vertices: push  current memory m to memory array (#childOfNonGroup as well)
            memory.push({
                lvl: m.lvl,
                id: m.id,
                name: m.name,
                pidClass: m.pidClass,
                parentId: m.parent ? m.parent.id : 1, // catches vertices with no parent (Enterprise level) and sets parentId to 1 ('Legato' root node)
                parent: vertices.find((vertex) => vertex.id === v.parentId),
                siblings: vertices.filter((sibling) => sibling.parentId === v.parentId),
                children: m.children,
                descendants: m.descendants,
                tag0: m.tags[0],
                tag1: m.tags[1],
                tag2: m.tags[2],
                tag3: m.tags[3],
                x: m.x,
                y: m.y,
                w: m.w,
                h: m.h,
                area: m.area,
                left: m.left,
                top: m.top,
                right: m.right,
                bottom: m.bottom,
            });
            console.log(stack[m.lvl]);
            console.groupEnd();
            console.groupEnd();
        
        });

        // FIXME: PROVISIONAL TO PLOT WANTED DATA (LIKE X Y W AND H AS TABLE) AFTER SETTING PIDJSON
        let data = [];
        let verticesData = vertices;
        let tableData;
        verticesData.forEach((v) => {
            tableData = {
            // Constants:
            lvl: v.pidLevel,
            id: v.id,
            name: v.shortName,
            pidClass: v.pidClass,
            pidHierarchy: v.pidHierarchy,
            x: v.mxGeometry._x,
            y: v.mxGeometry._y,
            w: parseInt(v.mxGeometry._width),
            h: parseInt(v.mxGeometry._height),
            };
            data.push(tableData);
        });

        /*************************END OF VERTICES LOOP********************************/

        function getParent(parentId, array) {
            return vertices.find((vertex) => vertex.id === parentId);
        }

        function getSiblings(parentId, array) {
            return memory.filter((sibling) => sibling.parentId === parentId);
        }

        function getChildren(id, array) {
            return array.filter((child) => child.parentId === id);
        }

        function getDescendants(id, array) {
            /**
            * Flattens deeply nested arrays recursively with concat.
            */
            // Termination:
            if (!id) return;
            // Base case:
            let descendants = [];
            // Recursion
            let children = array.filter((child) => child.parentId === id);
            children.forEach((child) => {
            descendants.push(child);
            let grandchildren = getDescendants(child.id, array); // recursive
            descendants = Array.isArray(grandchildren) ? descendants.concat(grandchildren) : descendants; // if grandchildren array is not empty, concatenate it, else, return existing
            });
            return descendants;
        }

        function findMax(variable, array) {
            /**
            * Receives a variable name(string) and an array, maps corresponding values from array
            * to an array and returns the maximum.
            */
            return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
        }

        function totalSum(variable, array) {
            /**
            * Receives a variable name (string) and an array, maps corresponding values from array
            * to an array of values and returns the sum of all elements in array.
            */
            return array.map((obj) => obj[variable]).reduce((totalArea, a) => totalArea + a);
        }

        function getMin(variable, array) {
            /**
            * Receives a variable name (string) and an array, and returns the minimum.
            */
            return array.reduce((min, vertex) => (vertex[variable] < min ? vertex[variable] : min), array[0][variable]);
        }

        function getMax(variable, array) {
            /**
            * Receives a variable name (string) and an array, and returns the maximum.
            */
            return array.reduce((max, vertex) => (vertex[variable] > max ? vertex[variable] : max), array[0][variable]);
        }

        function getAbsoluteSides(descendants, m) {
            /**
            * Gets absolute sides of descendants (considering the parent's/grandparent's position)
            */
            let descendantSides = [];
            descendants.map((descendant) => {
            let cell = {
                left: getAbsolute("left", descendant, m),
                right: getAbsolute("right", descendant, m),
                top: getAbsolute("top", descendant, m),
                bottom: getAbsolute("bottom", descendant, m)
            }
            console.log(cell);
            descendantSides.push(cell);
            });
            return descendantSides;
        }

        function getAbsolute(variable, descendant, parent) {
            /**
            * Receives a variable name (string) and an array and returns the absolute value
            */
            let levelDifference = descendant.lvl - parent.lvl;
            console.log("levelDifference");
            console.log(levelDifference);
            if (1 === levelDifference) return descendant[variable];
            else if (2 === levelDifference) {
            let parent = memory.find((parent) => parent.id === descendant.parentId);
            return descendant[variable] - parent[variable];
            } else if (3 === levelDifference) {
            let parent = memory.find((parent) => parent.id === descendant.parentId);
            let grandparent = memory.find((grandparent) => grandparent.id === parent.id);
            return descendant[variable] - grandparent[variable];
            }
        }

        // function centerBlock(children) {

        //   let child = children[0];
        //   console.log('child:');
        //   console.log(child);

        //   let block = {
        //     // Work with properties of scaled block inside 
        //     id: child.id,
        //     name: child.name,
        //     lvl: child.lvl,
        //     pidClass: child.pidClass,
        //     pidHierarchy: child.pidHierarchy,
        //     w: 2 * s.margin + child.w, // scales block (applies padding)
        //     h: 2 * s.margin + child.h, // scales block (applies padding)
        //     x: s.margin, // Reset x
        //     y: s.margin // Reset y
        //   };

        //   console.log('block:');
        //   console.log(block);

        //   // Get corresponding object in vertices and memory arrays
        //   let originalVertex = vertices.find(v => v.id === block.id);
        //   let memoryVertex = memory.find(v => v.id === block.id);

        //   console.log(originalVertex);
        //   console.log(memoryVertex);

        //   console.log(`Updating coordinates of ${block.id}: ${block.name} to (${block.x}, ${block.y}) ${block.x === null ? '(null)' : ''}`);

        //   // Update properties in vertices array
        //   originalVertex.mxGeometry._x = block.x;
        //   originalVertex.mxGeometry._y = block.y;
        //   originalVertex.mxGeometry._width = block.w;
        //   originalVertex.mxGeometry._height = block.h;
        //   // FIXME: Arreglar que si uncommenteo siguientes dos lineas para que a partir de units w y h no sea NaN desaparecen los units, y si no, no se dibujan los grupos grises
        //   //originalVertex.mxGeometry._width = isNaN(originalVertex.mxGeometry._width) ? memoryVertex.w : block.fit.width;
        //   //originalVertex.mxGeometry._height = isNaN(originalVertex.mxGeometry._height) ? memoryVertex.h : block.fit.height;
        //   // Update properties in memory array
        //   memoryVertex.x = block.x;
        //   memoryVertex.y = block.y;
        //   memoryVertex.w = block.w;
        //   memoryVertex.h = block.h;
        //   memoryVertex.a = block.w * block.h;
        //   memoryVertex.left = block.x;
        //   memoryVertex.top = block.y;
        //   memoryVertex.right = Math.round(block.x + block.w);
        //   memoryVertex.bottom = Math.round(block.y + block.h);
        // }

        function packBlocks(children, vertices, memory) {
            /* Runs algorithm to optimally pack blocks based on passed sorting option,
            * updates the original properties in the vertices and memory arrays 
            * and returns scaled group dimmensions for setting m.w and m.h of current group
            */
            console.group(`Packing blocks.`);

            let root;
            let blocks;

            console.table(children);

            // 1) Measure children blocks with included margin (padded blocks)
            blocks = getScaledBlocks(children);
            // 2) Pre-sort input array by longest block side (either width or height) 
            blocks = sortBlocksBy('maxSide', blocks); // Options: flows, none, width, height, area

            console.log('Before:');
            console.log(blocks);

            // 3) Binary tree bin packing algorithm to calculate x and y
            fit(blocks);
            // 4) Set x and y properties of shapes in original arrays
            updateProperties(blocks, vertices, memory);


            console.log('After:');
            console.log(blocks);

            //////////////////////// FUNCTION DECLARATIONS ////////////////////////////////

            function getScaledBlocks(children) {
            console.log(`Measuring and scaling blocks.`);
            let blocks = [];
            children.forEach((child) => {

                let childDescendants = getDescendants(child.id, memory);
                childDescendants.push(child);

                console.log(child);
                console.log(childDescendants);

                blocks.push({
                // Work with properties of scaled block inside 
                id: child.id,
                name: child.name,
                lvl: child.lvl,
                pidClass: child.pidClass,
                pidHierarchy: child.pidHierarchy,
                descendants: childDescendants,
                w: measureBlock('width', childDescendants), // scales block (applies padding)
                h: measureBlock('height', childDescendants), // scales block (applies padding)
                x: 0, // Reset x
                y: 0, // Reset y
                a: child.w * child.h
                })
            });
            return blocks;
            }

            function sortBlocksBy(sortOrder, blocks) {
                if ('maxSide' === sortOrder) {
                    return blocks.sort((b1, b2) => (b2.w > b2.h ? b2.w : b2.h) - (b1.w > b1.h ? b1.w : b1.h));
                } else if ('flows' === sortOrder) {
                    // not yet implemented
                } else if ('none' === sortOrder) {
                    // note yet implemented
                } else if ('width' === sortOrder) {
                    // note yet implemented
                } else if ('height' === sortOrder) {
                    // note yet implemented
                } else if ('area' === sortOrder) {
                    // note yet implemented
                }
            }

            function fit(blocks) {
                // Credits: copyright(c) 2011, 2012, 2013, 2014, 2015, 2016 Jake Gordon and contributors
                let count = blocks.length;
                let w = count > 0 ? blocks[0].w : 0;
                let h = count > 0 ? blocks[0].h : 0;
                let node;
                root = {
                    x: 0,
                    y: 0,
                    w: w,
                    h: h
                };
                blocks.forEach((block) => {
                    if (node === findNode(root, block.w, block.h))
                        block.fit = splitNode(node, block.w, block.h);
                    else
                        block.fit = scaleNode(block.w, block.h)
                });
            }

            function findNode(root, w, h) {
                if (root.used)
                    return findNode(root.right, w, h) || findNode(root.down, w, h);
                else if ((w <= root.w) && (h <= root.h))
                    return root;
                else
                    return null;
            }

            function splitNode(node, w, h) {
                node.used = true;
                node.down = {
                    x: node.x,
                    y: node.y + h,
                    w: node.w,
                    h: node.h - h
                };
                node.right = {
                    x: node.x + w,
                    y: node.y,
                    w: node.w - w,
                    h: h
                };
                return node;
            }

            function scaleNode(w, h) {
                let canScaleDown = (w <= root.w);
                let canScaleRight = (h <= root.h);

                let shouldScaleDown = canScaleDown && (root.w >= (root.h + h)); // attempt to keep square-ish by scaleing down  when width  is much greater than height
                let shouldScaleRight = canScaleRight && (root.h >= (root.w + w)); // attempt to keep square-ish by scaleing right when height is much greater than width

                if (shouldScaleRight)
                    return scaleRight(w, h);
                else if (shouldScaleDown)
                    return scaleDown(w, h);
                else if (canScaleRight)
                    return scaleRight(w, h);
                else if (canScaleDown)
                    return scaleDown(w, h);
                else
                    return null; // if group has only one child or if sensible root starting size not ensured
            }

            function scaleRight(w, h) {
                root = {
                    used: true,
                    x: 0,
                    y: 0,
                    w: root.w + w,
                    h: root.h,
                    down: root,
                    right: {
                    x: root.w,
                    y: 0,
                    w: w,
                    h: root.h
                    }
                };
                let node;
                if (node === findNode(root, w, h))
                    return splitNode(node, w, h);
                else
                    return null;
            }

            function scaleDown(w, h) {
                root = {
                    used: true,
                    x: 0,
                    y: 0,
                    w: root.w,
                    h: root.h + h,
                    down: {
                    x: 0,
                    y: root.h,
                    w: root.w,
                    h: h
                    },
                    right: root
                };
                let node;
                if (node === findNode(root, w, h))
                    return splitNode(node, w, h);
                else
                    return null;
            }

            function updateProperties(blocks, vertices, memory) {

                blocks.forEach((block) => {
                    console.log(block);
                    // Updates the mxGeometry._x property of the original vertex in vertices

                    // Get corresponding object in vertices and memory arrays
                    let originalVertex = vertices.find(v => v.id === block.id);
                    let memoryVertex = memory.find(v => v.id === block.id);

                    console.log(originalVertex);
                    console.log(memoryVertex);

                    // Get x and y coordinates and catch null values (if one or zero child exist, set to margin)
                    let xWithOffset = block.fit !== null ? Math.round(block.fit.x) + s.margin : s.margin; // offset from parent if one child
                    let yWithOffset = block.fit !== null ? Math.round(block.fit.y) + s.margin : s.margin; // offset from parent if one child

                    console.log(`Updating coordinates of ${block.id}: ${block.name} to (${xWithOffset}, ${yWithOffset}) ${xWithOffset === null ? '(null)' : ''}`);

                    // Update properties in vertices array
                    originalVertex.mxGeometry._x = xWithOffset;
                    originalVertex.mxGeometry._y = yWithOffset;
                    // FIXME: Arreglar que si uncommenteo siguientes dos lineas para que a partir de units w y h no sea NaN desaparecen los units, y si no, no se dibujan los grupos grises
                    //originalVertex.mxGeometry._width = isNaN(originalVertex.mxGeometry._width) ? memoryVertex.w : block.fit.width;
                    //originalVertex.mxGeometry._height = isNaN(originalVertex.mxGeometry._height) ? memoryVertex.h : block.fit.height;
                    // Update properties in memory array
                    memoryVertex.x = xWithOffset;
                    memoryVertex.y = yWithOffset;
                    memoryVertex.a = m.w * m.h;
                    memoryVertex.left = xWithOffset;
                    memoryVertex.top = yWithOffset;
                    memoryVertex.right = xWithOffset + memoryVertex.w;
                    memoryVertex.bottom = yWithOffset + memoryVertex.h;
                });
            }

            let scaledGroup = {
                width: Math.abs(getMin("left", memory)) + getMax("right", memory),
                height: Math.abs(getMin("top", memory)) + getMax("bottom", memory)
            };

            console.log('scaledGroup:');
            console.log(scaledGroup);
            console.groupEnd();

            return scaledGroup;
        }

        function measureBlock(dimension, shapes) {
            /**
            * Get all group descendants (not only those in previous stack: stack[p.lvl])
            * and dimension width and height from top-left to bottom-right corner of block.
            */
            if (dimension === 'width') return Math.abs(getMin("left", shapes)) + getMax("right", shapes);
            if (dimension === 'height') return Math.abs(getMin("top", shapes)) + getMax("bottom", shapes);
        }

        function scaleGroup(blockWidth, blockHeight, margin, shapes) {
            /**
            * Update group dimensions by padding them with the corresponding margin
            */
            const blockArea = blockWidth * blockHeight;
            let groupWidth = 2 * margin + blockWidth;
            let groupHeight = 2 * margin + blockHeight;
            let groupArea = (2 * margin + blockWidth) * (2 * margin + blockHeight);
            console.log(`blockWidth = ${Math.abs(getMin("left", shapes))} + ${getMax("right", shapes)} = ${blockWidth}`);
            console.log(`blockHeight = ${Math.abs(getMin("top", shapes))} + ${getMax("bottom", shapes)} = ${blockHeight}`);
            console.log(`blockArea = ${blockWidth} + ${blockHeight} = ${blockArea}`);
            console.log(`groupArea = (margin + blockWidth + margin) * (margin + blockHeight + margin) = groupArea`);
            console.log(`groupArea = (${margin}+${blockWidth}+${margin}) * (${margin}+${blockHeight}+${margin}) = ${groupArea}`);
            console.log(`sumOfCellAreas = ${totalSum("area", shapes)}  ->  blockArea = ${blockArea}  ->  groupArea = ${groupArea}`);
            m.w = groupWidth;
            m.h = groupHeight;
            m.area = groupArea;
        }

        // 3a) #nucleusGroup

        function shiftNucleusGroup(blockX, blockY, stack) {
            /**
            * Shifts nucleus group from its previous sibling by the corresponding offset,
            * if not first sibling, if else set at origin (0,0) relative to its parent
            */

            const stackLength = stack.length;

            // CHANGE COORDINATE SYSTEM:
            // Get coordinates of nucleus in relation to coordinates of block, because 
            // only nucleus should be shifted (and with that, descendants shift as well together with it)
            // (blockX and blockY are relative to nucleus origin of (0,0) and nucleusX 
            // and nucleusY should be relative to the origin of the parent of the nucleus)

            // Set nucleus corner at origin-blockX so that nucleusGroup corner lands on origin (0, 0) (ex: if nucleusGroup at x=10, sets to 0-10 so that nucleus set to - 10 which leaves the nucleusGroup at origin)
            let nucleusX = 0 - blockX;
            let nucleusY = 0 - blockY;

            // CHANGE COORDINATE SYSTEM:
            // Get coordinates of nucleus in relation to coordinates of block, because 
            // only nucleus should be shifted (and with that, descendants shift as well together with it)
            // (blockX and blockY are relative to nucleus origin of (0,0) and nucleusX 
            // and nucleusY should be relative to the origin of the parent of the nucleus)

            // Set nucleus corner at origin-blockX so that nucleusGroup corner lands on origin (0, 0) (ex: if nucleusGroup at x=10, sets to 0-10 so that nucleus set to - 10 which leaves the nucleusGroup at origin)
            nucleusX = 0 - blockX;
            nucleusY = 0 - blockY;

            if (stackLength === 0) {
            // Case if nucleus is first innerGroup in group of current level
            console.log(`${stackLength + 1}st innerGroup (nucleus) in stack[${m.lvl}].`);

            // Shift NUCLEUS (and with that it's descendants):
            m.x = nucleusX;
            m.y = nucleusY;

            console.log(`nucleusGroup (innerGroup) is first of stack an thus positioned at (${m.x}, ${m.y})`);
            } else if (stackLength >= 1) {
            // Case if nucleus is second, third, ..., n-th innerGroup in 
            console.log(`nucleusGroup (innerGroup) number ${stackLength + 1} in stack[${m.lvl}].`);
            const indexOfPrevious = stackLength - 1;
            console.log(stackLength);
            console.log(indexOfPrevious);
            const xOfPrevious = stack[indexOfPrevious].x;
            const yOfPrevious = stack[indexOfPrevious].y;
            const wOfPrevious = stack[indexOfPrevious].w;
            //const hOfPrevious = stack[indexOfPrevious].h;

            // Shift NUCLEUS (and with that it's descendants): x: offset from previous, y: inline with previous (both analog to #inline)
            m.x = (xOfPrevious + wOfPrevious + s.groupSpacing) + nucleusX;
            m.y = (yOfPrevious) + nucleusY;
            //m.y = (yOfPrevious) + (hOfPrevious / 2) + (hOfPrevious / 2) + nucleusY;

            console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.groupSpacing + nucleusX = ${xOfPrevious} + ${wOfPrevious} + ${s.groupSpacing} + ${nucleusX} = ${m.x}`);
            console.log(`y-Coordinate = yOfPrevious + nucleusY = ${yOfPrevious} + ${nucleusY} = ${m.y}`);
            console.log(`nucleusGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
            }

            console.log(`Coordinates set to: (${m.x}, ${m.y})`);
        }

        // 3b) #innerGroup
        function shiftInnerGroup(stack) {
            /**
            * Shifts nucleus group from its previous sibling by the corresponding offset,
            * if not first sibling, if else set at origin (0,0) relative to its parent
            */

            const stackLength = stack.length;

            if (stackLength === 0) {
            // Case for first innerGroup in stack of current level
            console.log(`${stackLength + 1}st innerGroup in stack[${m.lvl}].`);
            m.x = 0;
            m.y = 0;
            console.log(`innerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`);
            } else if (stackLength >= 1) {
            // Case for second, third, ..., n innerGoup in stack
            console.log(`innerGroup number ${stackLength + 1} in stack[${m.lvl}].`);
            const indexOfPrevious = stackLength - 1;
            console.log(stackLength);
            console.log(indexOfPrevious);
            const xOfPrevious = stack[indexOfPrevious].x;
            const yOfPrevious = stack[indexOfPrevious].y;
            const wOfPrevious = stack[indexOfPrevious].w;
            const hOfPrevious = stack[indexOfPrevious].h;
            console.log(xOfPrevious);
            console.log(yOfPrevious);

            // Set x and y analog to #inline
            m.x = xOfPrevious + wOfPrevious + s.groupSpacing;
            m.y = yOfPrevious + (hOfPrevious - m.h) / 2;

            console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`);
            console.log(`y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`);
            console.log(`innerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
            }

            console.log(`Coordinates set to: (${m.x}, ${m.y})`);
        }

        // // 3c) #outerGroup
        // function shiftOuterGroup(stack) {
        //   /**
        //    * Shifts nucleus group from its previous sibling by the corresponding offset,
        //    * if not first sibling, if else set at origin (0,0) relative to its parent
        //    */

        //   const stackLength = stack.length;

        //   if (stackLength === 0) {
        //     // Case for first outerGroup in stack of current level
        //     console.log(`${stackLength + 1}st outerGroup in stack[${m.lvl}].`);
        //     m.x = 0;
        //     m.y = 0;
        //     console.log(`outerGroup is first of stack an thus positioned at (${m.x}, ${m.y})`);
        //   } else if (stackLength >= 1) {
        //     // Case for second, third, ..., n innerGoup in stack
        //     console.log(`outerGroup number ${stackLength + 1} in stack[${m.lvl}].`);
        //     const indexOfPrevious = stackLength - 1;
        //     console.log(stackLength);
        //     console.log(indexOfPrevious);
        //     const xOfPrevious = stack[indexOfPrevious].x;
        //     const yOfPrevious = stack[indexOfPrevious].y;
        //     const wOfPrevious = stack[indexOfPrevious].w;
        //     const hOfPrevious = stack[indexOfPrevious].h;
        //     console.log(xOfPrevious);
        //     console.log(yOfPrevious);
        //     // Set x and y analog to #inline
        //     m.x = (xOfPrevious === undefined ? 0 : xOfPrevious + wOfPrevious + s.groupSpacing);
        //     m.y = (yOfPrevious === undefined ? 0 : yOfPrevious + (hOfPrevious - m.h) / 2);
        //     console.log(`x-Coordinate = xOfPrevious + wOfPrevious + s.cellSpacing = ${xOfPrevious} + ${wOfPrevious} + ${s.cellSpacing} = ${m.x}`);
        //     console.log(`y-Coordinate = yOfPrevious + (hOfPrevious - m.h) / 2 = ${xOfPrevious} + (${hOfPrevious} - ${m.h}) / 2 = ${xOfPrevious} + ${hOfPrevious - m.h} / 2 = ${m.y}`);
        //     console.log(`outerGroup shifted relative to previous in stack: (${xOfPrevious}, ${yOfPrevious})  -->  (${m.x}, ${m.y})`);
        //   }

        //   console.log(`Coordinates set to: (${m.x}, ${m.y})`);
        // }

        function shiftChildren(blockWidth, blockHeight, stack) {
            /**
            * Center block inside group: offset all contained vertices within the group individually
            */

            stack.forEach((child) => {
            if ("group" !== child.pidClass) {
                // Case for non-group children (ex. nucleus or lone shapes)
                // APPLY margin
                console.group(`Applying margin offset of ${s.margin} to ${child.name} for x and y.`);

                // Get all descendants (block)
                let descendantsWithParent = getDescendants(child.id, memory);
                descendantsWithParent.push(child); // Push root/parent vertex as well

                //let rights = descendantsWithParent.map((descendant) => descendant.right);
                //let lefts = descendantsWithParent.map((descendant) => descendant.left);
                //let tops = descendantsWithParent.map((descendant) => descendant.top);
                //let bottoms = descendantsWithParent.map((descendant) => descendant.bottom);

                // Measure block of all descendants
                let blockWidth = measureBlock('width', m.descendants);
                let blockHeight = measureBlock('height', m.descendants);

                // Calculate relative offset for inline alignment of siblings (shift relative to previous sibling):
                const xShift = ((m.w / 2) - (blockWidth / 2));
                const yShift = ((m.h / 2) - (child.h / 2));
                console.warn(`xShift = ${m.w} / 2 - ${blockWidth} / 2 = ${xShift}`);
                console.warn(`yShift = ${m.h} / 2 - ${child.h} / 2 = ${yShift}`);

                // Apply Offset:
                applyOffset("x", xShift, child);
                applyOffset("y", yShift, child);

                // Calculate absolute offset to center siblings in group (relative to containing group):
                const yCenteringOffset = ((m.h / 2) - (child.h / 2) - child.y); // subtracts starting offset of child in parent
                console.warn(`yCenteringOffset = ${blockHeight} / 2 - ${child.h} / 2 = ${yCenteringOffset}`);

                // Apply absolute offset (center vertically in group)
                applyOffset("y", yCenteringOffset, child);

                console.groupEnd();
            } else if ("group" === child.pidClass) {
                // Case for children that are group (ex.innerGroups that have other innerGroups as chidlren like units, and maybe emodules).
                console.group(`Applying margin offset of ${s.margin} to ${child.name} for x and y.`);
                const xOffset = ((m.w / 2) - (blockWidth / 2));
                const yOffset = ((m.h / 2) - (child.h / 2));
                console.warn(`xOffset = ${m.w} / 2 - ${blockWidth} / 2 = ${xOffset}`);
                console.warn(`yOffset = ${m.h} / 2 - ${child.h} / 2 = ${yOffset}`);

                applyOffset("x", xOffset, child);
                applyOffset("y", yOffset, child);
                console.groupEnd();
            }
            if (m.id === child.id) console.warn(`WARNING: Group container not excluded from for each because ids match: ${m.id} === ${child.id} --> TRUE`);
            });

        }

        function clearStack(previousStack) {
            /**
            * Clear stack[p.lvl] of previousPidLevel after offsetting them relative to their parent(currentPidLevel)
            */

            previousStack.length = 0; // clears array and its references globally (areas = [] creates a new but might not delete previous, may lead to errors with references to previous array)
            console.log(`Cleared stack[${p.lvl}] of previous pidLevel (${p.lvl}) after offsetting the children relative to their parent (current vertex with pidLevel ${m.lvl})`);
        }

        function applyOffset(coordinate, offset, vertex) {

            if (coordinate === "x") {
            // Add x-offset to the mxGeometry._x property of the original vertex in vertices (and return value for setting to m.x)
            vertex.x += offset;
            let originalVertex = vertices.find(v => v.id === vertex.id);
            console.log(`Offsetting x-Coordinate by ${offset}: (${originalVertex.mxGeometry._x}) ->  (${vertex.x})`);
            originalVertex.mxGeometry._x = vertex.x;
            m.left = m.x;
            m.top = m.y;
            m.right = m.x + m.w;
            m.bottom = m.y + m.h;
            } else if (coordinate === "y") {
            // Add y-offset directly to the mxGeometry._y property of the original vertex in vertices (and return value for setting to m.x)
            vertex.y += offset;
            let originalVertex = vertices.find(v => v.id === vertex.id);
            console.log(`Offsetting y-Coordinate by ${offset}: (${originalVertex.mxGeometry._y}) ->  (${vertex.y})`);
            originalVertex.mxGeometry._y = vertex.y;
            }
        }


        let pidJson = [...vertices, ...edges];
        console.log('memory:');
        console.table(memory);
        console.log('data:');
        console.table(data);
        console.log('pidJson:');
        console.table(pidJson);
        console.groupEnd();
        console.groupEnd();
        return pidJson;
    },

    /**
     * Generates the XML string of the visualization by looping through the
     * pidJson instances and creating each XML object individually for each 
     * (uses ES6 template literals)
     *
     * @param {*} pidJson JS Object of the visualization (all vertices and edge instances)
     * @returns XML String of P&ID visualization (pidXml, input for Legato Graphic Designer)
     *
     */
    generatePidXmlString: function(pidJson) {
        
        console.groupCollapsed("Generating pidXmlString from pidJson...");
        console.log('pidJson:');
        console.table(pidJson);

        // Filter nodes by their individual pidClasses and create new individual objects
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

        console.log(`pidEquipments: ${pidEquipments.length}`);
        console.log(`pidInstruments: ${pidInstruments.length}`);
        console.log(`pidArrows: ${pidArrows.length}`);
        console.log(`pidGroups: ${pidGroups.length}`);
        console.log(`pidLines: ${pidLines.length}`);

        const graphSettings = {
            dx: 0,
            dy: 0,
            grid: 0,
            gridSize: 10,
            guides: 1,
            tooltips: 1,
            connect: 1,
            arrows: 1,
            fold: 1,
            page: 0,
            pageScale: 1,
            pageWidth: 1654,
            pageHeight: 1169,
            background: 'none',
            math: 0,
            shadow: 0,
            defaultPadding: 15 // In case _x and _y values are invalid (NaN)
        };

        console.groupCollapsed("XML String generation started...");

         // TODO: Set labels in value attribute in pid-shapes-library and set label=${pidEquipment.value} in template literals
        const htmlLabel = `&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%sapient-bind%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;`;
        const htmlLabelInstrument = `&lt;table cellpadding=&quot;4&quot; cellspacing=&quot;0&quot; border=&quot;0&quot; style=&quot;font-size:1em;width:100%;height:100%;&quot;&gt;&lt;tr&gt;&lt;td&gt;%pid-function%&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;%pid-number%&lt;/td&gt;&lt;/table&gt;`;
        const htmlLabelGroup = `%pid-hierarchy%: %pid-label%`;
        const htmlLabelLine = `&lt;b&gt;%pid-label%&lt;br&gt;&lt;span style=&quot;background-color: rgb(0 , 255 , 0)&quot;&gt;&lt;font color=&quot;#ffffff&quot;&gt;&amp;nbsp;%sapient-bind%&amp;nbsp;&lt;/font&gt;&lt;/span&gt;&lt;/b&gt;&lt;br&gt;`;
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
            xmlString += `
        <object id="${pidEquipment.id ? pidEquipment.id : pidEquipment._id}" label="${pidEquipment._value !== '' ? pidEquipment._value : htmlLabel}" placeholders="1" pid-label="${pidEquipment.pidLabel ? pidEquipment.pidLabel : (pidEquipment.shortName ? pidEquipment.shortName : (pidEquipment.name ? pidEquipment.name : null))}" pid-current-value="" pid-function="${pidEquipment.pidFunction}" pid-number="${pidEquipment.pidNumber}" sapient-bind="${this.getSapientBind(pidEquipment)}">
            <mxCell style="${this.concatenateStyles(pidEquipment.styleObject)}" vertex="${pidEquipment._vertex}" connectable="1" parent="${pidEquipment.parentId ? pidEquipment.parentId : pidEquipment._parent}">
                <mxGeometry x="${pidEquipment.mxGeometry._x ? pidEquipment.mxGeometry._x : 50}" y="${pidEquipment.mxGeometry._y ? pidEquipment.mxGeometry._y : 50}" width="${pidEquipment.mxGeometry._width}" height="${pidEquipment.mxGeometry._height}" as="${pidEquipment.mxGeometry._as}"></mxGeometry>
            </mxCell>
        </object>`;
        });

        const instrumentCount = pidInstruments.length;
        console.log(`Generating XML-tags for ${instrumentCount} instrument instances...`);
        pidInstruments.forEach((pidInstrument) => {
            xmlString += `
        <object id="${pidInstrument.id ? pidInstrument.id : pidInstrument._id}" label="${htmlLabelInstrument}" placeholders="1" pid-label="${pidInstrument.pidLabel ? pidInstrument.pidLabel : (pidInstrument.shortName ? pidInstrument.shortName : (pidInstrument.name ? pidInstrument.name : null))}" pid-current-value="" pid-function="${pidInstrument.pidFunction}" pid-number="${pidInstrument.pidNumber}" sapient-bind="${this.getSapientBind(pidInstrument)}">
            <mxCell style="${this.concatenateStyles(pidInstrument.styleObject)}" vertex="${pidInstrument._vertex}" connectable="1" parent="${pidInstrument.parentId ? pidInstrument.parentId : pidInstrument._parent}">
                <mxGeometry x="${pidInstrument.mxGeometry._x ? pidInstrument.mxGeometry._x : 50}" y="${pidInstrument.mxGeometry._y ? pidInstrument.mxGeometry._y : 50}" width="${pidInstrument.mxGeometry._width}" height="${pidInstrument.mxGeometry._height}" as="${pidInstrument.mxGeometry._as}"></mxGeometry>
            </mxCell>
        </object>`;
        });

        const arrowCount = pidArrows.length;
        console.log(`Generating XML-tags for ${arrowCount} arrow instances...`);
        pidArrows.forEach((pidArrow) => {
            xmlString += `
        <object id="${pidArrow.id ? pidArrow.id : pidArrow._id}" label="${pidArrow._value !== '' ? pidArrow._value : htmlLabel}" placeholders="1" pid-label="${pidArrow.pidLabel ? pidArrow.pidLabel : (pidArrow.shortName ? pidArrow.shortName : (pidArrow.name ? pidArrow.name : null))}" pid-current-value="" pid-function="${pidArrow.pidFunction}" pid-number="${pidArrow.pidNumber}" sapient-bind="${this.getSapientBind(pidArrow)}">
            <mxCell style="${this.concatenateStyles(pidArrow.styleObject)}" vertex="${pidArrow._vertex}" connectable="1" parent="${pidArrow.parentId ? pidArrow.parentId : pidArrow._parent}">
                <mxGeometry x="${pidArrow.mxGeometry._x ? pidArrow.mxGeometry._x : 50}" y="${pidArrow.mxGeometry._y ? pidArrow.mxGeometry._y : 50}" width="${pidArrow.mxGeometry._width}" height="${pidArrow.mxGeometry._height}" as="${pidArrow.mxGeometry._as}"></mxGeometry>
            </mxCell>
        </object>`;
        });

        const groupCount = pidGroups.length;
        console.log(`Generating XML-tags for ${groupCount} group instances...`);
        pidGroups.forEach((pidGroup) => {
            xmlString += `
        <object id="${pidGroup.id ? pidGroup.id : pidGroup._id}" label="${pidGroup._value !== '' ? pidGroup._value : htmlLabelGroup}" placeholders="1" pid-label="${pidGroup.pidLabel ? pidGroup.pidLabel : (pidGroup.shortName ? pidGroup.shortName : (pidGroup.name ? pidGroup.name : null))}" pid-hierarchy="${pidGroup.pidHierarchy}" pid-current-value="" pid-function="${pidGroup.pidFunction}" pid-number="${pidGroup.pidNumber}" sapient-bind="${this.getSapientBind(pidGroup)}">
            <mxCell style="${this.concatenateStyles(pidGroup.styleObject)}" vertex="${pidGroup._vertex}" connectable="${pidGroup._connectable}" parent="${pidGroup.parentId ? pidGroup.parentId : pidGroup._parent}">
                <mxGeometry x="${pidGroup.mxGeometry._x ? pidGroup.mxGeometry._x : graphSettings.defaultPadding}" y="${pidGroup.mxGeometry._y ? pidGroup.mxGeometry._y : graphSettings.defaultPadding}" width="${pidGroup.mxGeometry._width}" height="${pidGroup.mxGeometry._height}" as="${pidGroup.mxGeometry._as}"></mxGeometry>
            </mxCell>
        </object>`;
        });

        // Add edges:
        const lineCount = pidLines.length;
        console.log(`Generating XML-tags for ${lineCount} line instances...`);
        pidLines.forEach((pidLine) => {
            // Find parent of source vertex and set the edge parent to it as well (edges won't work with distinct parent as their source)
            const source = pidJson.find((vertex) => vertex.id === pidLine.sourceId);
            //const target = pidJson.find((vertex) => vertex.id === pidLine.targetId);
            const parent = pidJson.find((parent) => parent.id === source.id);
            xmlString += `
        <object id="${pidLine.id ? pidLine.id : pidLine._id}" label="${pidLine._value !== '' ? pidLine._value : htmlLabelLine}" placeholders="1" pid-label="${pidLine.pidLabel ? pidLine.pidLabel : (pidLine.shortName ? pidLine.shortName : (pidLine.name ? pidLine.name : 'Beer'))}" pid-current-value="" pid-function="${pidLine.pidFunction}" pid-number="${pidLine.pidNumber}" sapient-bind="${this.getSapientBind(pidLine)}">
            <mxCell id="${pidLine.id ? pidLine.id : pidLine._id}" style="${this.concatenateStyles(pidLine.styleObject)}" edge="${pidLine._edge}" source="${pidLine.sourceId}" target="${pidLine.targetId}" parent="${parent.id ? parent.id : pidLine._parent}">
                <mxGeometry relative="${pidLine.mxGeometry._relative ? pidLine.mxGeometry._relative : 1}" as="${pidLine.mxGeometry._as ? pidLine.mxGeometry._as : 'geometry'}"></mxGeometry>
            </mxCell>
        </object>`;
        });

        // Add boilerplate closing tags
        xmlString += `
    </root>
</mxGraphModel>`;

        console.log('pidXmlString');
        console.log(xmlString);
        console.groupEnd();
        console.groupEnd();
        return xmlString;
    },


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


    /**
     * Creates sapientBind object depending on shape.shapeCategory and shape.fDataType
     *
     * @param {Object} shape Vertex instance for whom to build the sapientBind object
     *
     */
    getSapientBind: function(shape) {

        /*
            Key of Properties for Values to Display:

            Vertices (Equipment/Instruments/Arrows/Groups):

            id:             {Int}       Primary Key
            shortName:      {String}    A shortened version of the name
            isInstrument:   {Bool}      User defined boolean (default is false)
            shapeName:      {String}    Shape Name that maps to P&ID shapes library (required!)
            pidLabel:       {String}    Optional label for shapes
            pidFunction:    {String}    User defined instrument function (required for instruments)
            pidNumber:      {String}    User defined instrument number (required for instruments)
            cValueId:       {Int}       Primary Key of value (in p_values_config and p_values_current)
            tValueType:     {Sring}     (air consumptuion, energy consumption, ...)
            tValueFormat:   {Sring}     (limit, actual piece counter, ...)
            uUnitSymbol:    {String}    (Nm, J, kPa, °C, ...)
            uName:          {String}    (Newtonmeter, Joule, Kilopascal, ...)
            uFactor:        {String}    (1000, /1000, 10000, ,277778, ...)

            Edges (Lines):

            id:             {Int}       Primary Key
            isContinuous:   {Boolean}   If flow ins continuous
            flowType:       {String}    Type of flow (material_flow, ...)
            pProduct:       {String}    Product of flow (bier, chair, wheel, ...)
            cValueId:       {Int}       Primary Key of value (in p_values_config and p_values_current)
            tValueType:     {Sring}     (air consumptuion, energy consumption, ...)
            tValueFormat:   {Sring}     (limit, actual piece counter, ...)
            uUnitSymbol:    {String}    (Nm, J, kPa, °C, ...)
            uName:          {String}    (Newtonmeter, Joule, Kilopascal, ...)
            uFactor:        {String}    (1000, /1000, 10000, ,277778, ...)

        */

        let sapientBind = {};
        console.log(shape);

        // Return empty sapientBind if shape has no binded value
        if (null === shape.cValueId || undefined === shape.cValueId) sapientBind = '';

        else if ('numeric' === shape.fDataType) {
            if ('valve' === shape.shapeCategory || 'instruments' === shape.shapeCategory) {
                sapientBind = {
                    datasources: {
                        text: {
                            source: "var",
                            params: {
                                id: shape.cValueId
                            }
                        }
                    },
                    bindings: {
                        text: {
                            value: {
                                source: "dataref",
                                defaultValue: "---",
                                params: {
                                    ref: "text"
                                }
                            }
                        }
                    }
                };
            }
        }
        else if ('boolean' === shape.fDataType) {
            if ('valve' === shape.shapeCategory) {
                sapientBind = {
                    datasources: {
                        text: {
                            source: "var",
                            params: {
                                id: shape.cValueId
                            }
                        }
                    },
                    bindings: {
                        text: {
                            value: {
                                source: "dataref",
                                defaultValue: "---",
                                params: {
                                    ref: "text"
                                }
                            }
                        }
                    }
                };
            }
            else if ('engines' === shape.shapeCategory || 'instruments' === shape.shapeCategory || 'compressors_-_iso' === shape.shapeCategory || 'pumps_-_iso' === shape.shapeCategory) {
                sapientBind = {
                    datasources: {
                        text: {
                            source: "var",
                            params: {
                                id: shape.cValueId
                            }
                        }
                    },
                    bindings: {
                        text: {
                            value: {
                                source: "dataref",
                                defaultValue: "---",
                                params: {
                                    ref: "text"
                                }
                            }
                        }
                    }
                };
            }
        }
        else if ('string' === shape.fDataType) {
            sapientBind = {
                datasources: {
                    text: {
                        source: "var",
                        params: {
                            id: shape.cValueId
                        }
                    }
                },
                bindings: {
                    text: {
                        value: {
                            source: "dataref",
                            defaultValue: "---",
                            params: {
                                ref: "text"
                            }
                        }
                    }
                }
            };
        }

        
        let sapientBindString = JSON.stringify(sapientBind);
        let escapedSapientBind = this.escapeToHtmlValid(sapientBindString);
        //console.log(sapientBind);
        console.log(sapientBindString);
        //console.log(escapedSapientBind);
        return escapedSapientBind;
    },


    renderXml: function(xmlString) {
        // let copyButton = document.getElementById("copyButton");
        // copyButton.disabled = false;
        // copyButton.addEventListener("click", function() {
        //     copyToClipboard(document.getElementById("copyTarget"));
        // });
        // Formats raw XML-string to pretty print
        let formattedXmlString = this.formatXml(xmlString, '  ');
        // Encodes XML string to valid HTML string (HTML characters)
        let formattedHtmlString = this.escapeToHtmlValid(formattedXmlString);
        //console.log(`pidHtmlString = \n${formattedHtmlString}`);
        document.getElementById('xml-viewer-div').innerHTML = formattedHtmlString;
    },


    formatXml: function(xml, tab) {
        // Formats the passed XML string (tab parameter defines tab size) 
        var formatted = '',
            indent = '';
        tab = tab || '\t'; // tab = optional indent value, default is tab (\t)
        xml.split(/>\s*</).forEach((node) => {
            if (node.match(/^\/\w/))
                indent = indent.substring(tab.length); // decrease indent by one 'tab'
            formatted += indent + "<" + node + ">\r\n";
            if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab; // increase indent
        });
        return formatted.substring(1, formatted.length - 3);
    },


    escapeToHtmlValid: function(string) {
        // Escapes illegal chararacters of passed string
        let htmlString = String(string)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/ /g, "&nbsp;")
            .replace(/\n/g, "<br />")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&quot;")
        return htmlString;
    },


    parseXml: function(xmlString) {
        // Parses and XML String into an XML File
        var domParser = new DOMParser();
        try {
            var xmlDocument = domParser.parseFromString(xmlString, 'application/xml');
            console.log('pidXmlString parsed to pidXml File');
            return xmlDocument;
        } catch (error) {
            console.error(error);
        }
    },


    downloadFile: function(filename, text) {
        // Downloads P&ID file either as JSON or XML
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

        // TODO: not yet implemented (no way found yet of uploading file directly to file system of sapient engine
        // because of security reasons)

        const xmlSavePath = `C:\\devsource\\research-sapient-app\\public\\assets\\detail-layout`;
        const alertMessage = `Upload function is yet to be implemented. Please manually download and save XML file of P&ID visualization under corresponding path configured for the Legato Graphic Designer Boardlet: \n${xmlSavePath}`;
        window.alert(alertMessage);

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
    }

});

    component.reopenClass({
        parameters: {
            // For single node selection from Node Tree Boardlet
            node: {
                displayKey: 'parameters.node-id',
                value: null,
                parameterType: 'Integer',
                context: ParameterContext.InOut,
                category: 'filters',
                editor: {
                    component: 'input-component',
                    parameters: {
                        placeholder: 'Add node ID...',
                        hasIcon: true
                    }
                }
            },

            // For multiple node selection from Node Tree Boardlet
            nodeList: {
                displayKey: 'parameters.selected-nodes',
                value: [],
                parameterType: 'NumberArray',
                context: ParameterContext.InOut,
                category: 'filters',
                editor: {
                    component: 'input-multi-component',
                    parameters: {
                        placeholder: 'Add node IDs...',
                        hasIcon: true
                    }
                }
            }
        }
    });

export default component;
