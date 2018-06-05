
import Evented from '@ember/object/evented';
import BoardletBase from 'core/objects/boardlet-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';

class ModelParseHelper  {
    constructor(){
        this.counter = 0;
        this.model = null;
        this.nodeNumber = 0;
        this.nodeQueue = null;
        this.propertyNumber = 0;
        this.log = "";
        this.activeLog = "";
        this.root = 1;
        this.startParseNodes = function(modelToTransform,parentNode){   
            this.model = modelToTransform;
            this.nodeNumber = modelToTransform.nodes.length;
            this.counter = 0;
            this.nodeQueue = new Array();
            //Todo: Update Root Nodes, actual constraint: root node is always on array position 0
            let actNode = this.model.nodes[0];
            //Add actual chosen Node for this namespace as parent. If null choose legato root node.
            actNode.parent.dbId=(parentNode==null) ?1:parentNode;
            if (actNode.parent.dbId == null) actNode.parent.dbId = 1;
            actNode.parent.modelId = null;
            //this.activeLog = this.activeLog +" with parent "+actNode.parent.dbId+"...";
            this.nodeQueue.push(actNode);
            this.parseNodes();
        };
        this.parseNodes = function(){
            if(this.counter<this.nodeNumber) {
                console.log("Uploading Node ["+(this.counter+1)+"/"+this.nodeNumber+"]");
                let actNode = this.nodeQueue.shift();
                let childNodes = this.startNodeRequest(this.model,actNode,this);
                childNodes.forEach(cn=>this.nodeQueue.push(cn));
                this.counter++;
            }
            else {
                console.log("Parsed all nodes.");
                //this.startParseProperties(this.model);
            } 
        };
        
        this.startNodeRequest = function(model,actNode,parseObj){
            //start Upload, upload's return starts the upload of child objects and returns the (new) database-ID
            
            console.debug("actNode after call:");
            console.debug(actNode);
            var requestData = {
                id: 1,
                method:"/jsonrpc/template_from_model/createNode",
                params:actNode
            }
            //Building XMLHttpRequest for Uploading Nodes
            this.startRequest(
                requestData,
                function(result,parseObj){
                    parseObj.addNodeDbId(result);
                    parseObj.parseNodes();
                },
                function(errText){
                    console.error(errText);
                },
                parseObj
            );
            console.debug(model.nodes.filter(n => n.parent.modelId === actNode.modelId));
            return model.nodes.filter(c => c.parent.modelId === actNode.modelId);
        };

        this.addNodeDbId = function(idObj){
            //Find the class, the idObj is from
            let thisClass = this.model.nodes.find(o => o.modelId === idObj.model_id);
            //add database id
            if (idObj.db_id) thisClass.dbId = idObj.db_id;

            //add database id and valuePrefix to all child classes
            this.model.nodes.filter(c => c.parent.modelId === idObj.model_id).forEach(c => {
                c.parent.dbId = thisClass.dbId;
                if (idObj.value_prefix) c.valPrefix = idObj.value_prefix + c.name + ".";
                if (idObj.connection) c.connection = idObj.connection;
            });

            //find child properties
            thisClass.properties.forEach(p => {
                //add database id as parentNode.dbId to child properties
                p.parentNode.dbId = thisClass.dbId;
                //add the child properties' database ids and relation ids
                if (p.appliedStereotypes.find((str => str == "SfmPrf:VarScope"))){
                    var valId = idObj.values.find(v => v.model_id == p.modelId);
                    if (valId&&valId.db_id) p.dbId = valId.db_id;
                    if (valId&&valId.relation_id) p.parentNode.relationId = valId.relation_id;
                }
                if (p.appliedStereotypes.find((str => str == "SfmPrf:MsgScope"))){
                    var msgId = idObj.alarms.find(m => m.model_id == p.modelId);
                    if (msgId&&msgId.db_id) p.dbId = msgId.db_id;
                }
            });
            //Todo: Do the same for this.model.productFlows.port0&port1
            console.debug(this.model);
        };

        this.startRequest = function(requestData,cbSuccess,cbError,parseObj){
            var request = new XMLHttpRequest();
            console.debug(requestData);
            request.parseObj = parseObj;
            request.cbSuccess = cbSuccess;
            request.cbError = cbError;
            request.onreadystatechange = function(){
                    console.debug(this);
                    switch (this.readyState) {
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            break;
                        case 4:
                            if (this.status == 200) {
                                let response = JSON.parse(this.response);
                                console.debug(response);
                                if (!response.result) console.error(response.error);
                                else this.cbSuccess(response.result,parseObj);
                            } else {
                                this.cbError(this.statusText,parseObj);
                            }
                            break;
                    }
            };
            var url = String(document.URL).replace(/(.*:\/\/[^\/]+\/)(?:.+)/, '$1call/');
            request.open("POST", url, true);
            request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
            requestData.jsonrpc = "2.0";
            request.send(JSON.stringify(requestData));
            delete requestData.jsonrpc;
        };
    }
}


var boardlet = BoardletBase.extend(Evented,{
        classNames: ['boardlet-test-male'],
        classNameBindings: ['inBar:boardlet', 'inBar:boardlet-test-male'],
        toastService: service('toast-messages-service'),
        styleObject:null,
        modelObject:null,
        modelParseObject: null,
        jsonString:null,
        jsonObject:null,
        loading:false,
        init(){
            this._super(...arguments);
            this.set('modelParseObject',new ModelParseHelper);
        },
        actions:{
            loadSuccess: function(objHash,response){
                console.log("Response added to obj...");
                this.set(objHash,response);
                console.log(objHash + ": " + this.get(objHash));
            },
            loadError: function(err){
                console.log("Error during File Upload...\n");
                console.log(err);
            },
            startTransformation: function(){
                this.set('loading',true);
                console.log("Transformation started...");
                let jsonText;
                try{
                    //TODO: Find a way to do the transformation without browser specific components
                    let processor = new XSLTProcessor;
                    processor.importStylesheet(this.get('styleObject'));
                    console.debug("XSLTProcessor loaded...");
                    let xmlFileInput = this.get('modelObject');
                    let jsonFileOutput = processor.transformToDocument(xmlFileInput);
                    jsonText = jsonFileOutput.getElementsByTagName("transformiix:result")[0].childNodes[0].nodeValue;
                } catch(error){
                    console.error("Error during XSL-Transformation: ");
                    console.error(error);
                }
                try{
                    this.set('jsonString',jsonText);
                    console.log("JSON-string saved...");
                    let jsonData = JSON.parse(jsonText);
                    this.set('jsonObject',jsonData);
                    console.log("JSON-object saved...");
                } catch(error) {
                    console.error("Error during JSON-Parse: ");
                    console.error(error);
                }
                this.set('loading',false);
                this.get('toastService').showSuccessToast({title: "Model fully loaded!", boardlet:"Model transformation boardlet",showDuration: false, duration: 1000});
            },
            startUpload: function(){
                //Todo: Wrap in model
                let jsonObject = this.get('jsonObject');
                if (!this.get('jsonObject')) { 
                    this.get('toastService').showWarningToast({title: "No model loaded!", boardlet:"Model transformation boardlet",showDuration: false, duration: 1000});
                    return;
                }

                if (!jsonObject.nodes||!jsonObject.nodes[0]) { 
                    this.get('toastService').showWarningToast({title: "No node-classes in model!", boardlet:"Model transformation boardlet",showDuration: false, duration: 1000});
                    return;
                }
                
                const parser = this.get('modelParseObject');

                //Building XMLHttpRequest for Uploading Nodes
                parser.startParseNodes(jsonObject,this.get('parameters.node.value'));
            }
        }
    });


    boardlet.reopenClass({
        parameters: {
            title: {
                displayKey: 'parameters.title',
                value: 'System model upload',
                parameterType: 'String',
                context: ParameterContext.Local,
                category: 'settings',
                editor: {
                    component: 'input-component',
                    parameters: {
                        placeholder: 'Add title...'
                    }
                }
            },
    
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
export default boardlet;