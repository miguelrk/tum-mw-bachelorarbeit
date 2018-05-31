import Evented from '@ember/object/evented';
import SapientComponent from 'core/objects/component-base';
import ParameterContext from 'core/objects/parameter-context';
import { inject as service } from '@ember/service';



var component = SapientComponent.extend(Evented,{
        classNames: ['xml-json-transform-component'],
        classNameBindings: ['inBar:component', 'inBar:xml-json-transform-component'],
        toastMessagesService: service('toast-messages-service'),
        styleObject:null,
        modelObject:null,
        jsonString:null,
        jsonObject:null,
        init(){
            this._super(...arguments);
            this.set('jsonObject', null);
            this.set('jsonString', "");
        },
        actions : {
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
                let toastDismissFunction = this.get("toastMessagesService").showLoadingToast({title: "UML-Datei wird transformiert: " + this.get('modelObject').name, boardlet:"Model input boardlet",
                    callback: (success) => {
                        if (!success) {
                            this.get("toastMessagesService").showFailedToast({title: "XML-Transformation fehlgeschlagen!"});
                        }
                    }
                });
                try{
                    //TODO: Find a way to do the transformation without browser specific components
                    let processor = new XSLTProcessor;
                    processor.importStylesheet(this.get('styleObject'));
                    console.debug("XSLTProcessor loaded...");
                    let xmlFileInput = this.get('modelObject');
                    let jsonFileOutput = processor.transformToDocument(xmlFileInput);
                    jsonText = jsonFileOutput.getElementsByTagName("transformiix:result")[0].childNodes[0].nodeValue;
                    toastDismissFunction(true);
                } catch(error){
                    toastDismissFunction(false);
                    console.error("Error during XSL-Transformation: ");
                    console.error(error);
                    return;
                }
                let toastDismissFunction2 = this.get("toastMessagesService").showLoadingToast({title: "JSON-Objekt wird gebildet...", boardlet:"Model input boardlet",
                    callback: (success) => {
                        if (success) {
                            this.get("toastMessagesService").showSuccessToast({title: "Modell vollständig geladen!", showDuration: false, duration: 1000});
                        } else {
                            this.get("toastMessagesService").showFailedToast({title: "JSON-Parse fehlgeschlagen!"});
                        }
                    }
                });
                try{
                    this.set('jsonString',jsonText);
                    console.log("JSON-string saved...");
                    var jsonData = JSON.parse(jsonText);
                    this.set('jsonObject',jsonData);
                    console.log("JSON-object saved...");
                    toastDismissFunction2(true);
                    this.get('onModelLoad') && this.get('onModelLoad')(jsonData);
                } catch(error) {
                    toastDismissFunction2(false);
                    console.error("Error during JSON-Parse: ");
                    console.error(error);
                }
            }
        }
    });

    component.reopenClass({
        parameters: {
            jsonModel: {
                displayKey: 'parameters.jsonModel',
                value: null,
                parameterType: 'Object',
                context: ParameterContext.InOut,
                category: 'settings'
            }
        }
    });

export default component;
