const _ = require("lodash");
import {
    RuleFactory,
    FormElementsStatusHelper,
    FormElementStatusBuilder,
    StatusBuilderAnnotationFactory,
    FormElementStatus,
    VisitScheduleBuilder,
    ProgramRule,
    RuleCondition
} from 'rules-config/rules';

import {ScreeningRuleHelper} from './screeningRuleHelper';

const ProgramEncounterTypeName = {
    BASE_SCREENING: 'Base screening',
    SAMPLE_SHIPMENT: 'Sample shipment',
    LAB_RESULTS_ENTRY: 'Lab results entry',
    HPLC_SAMPLE_COLLECTION: 'HPLC sample collection'
};


const ScreeningViewFilter = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "ViewFilter");
const WithStatusBuilder = StatusBuilderAnnotationFactory('programEncounter', 'formElement');
const Decision = RuleFactory('0723fd75-dc66-4aae-a3c9-31a09c9c4c7a', 'Decision');

@ScreeningViewFilter("78aaf13f-04f2-47cc-b4da-914f204793a9", "JSS Sickle Cell Screening Encounter View Filter", 100.0, {})
class SickleCellScreeningHandlerJSS {
    static exec(programEncounter, formElementGroup, today) {
        return FormElementsStatusHelper
            .getFormElementsStatusesWithoutDefaults(new SickleCellScreeningHandlerJSS(), programEncounter, formElementGroup, today);
    }

    sickleCellScreeningHistory(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING)
                .and.latestValueInPreviousEncounters("Whether old report available").is.notDefined;
            return statusBuilder.build();
        });
    }

    labTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(programEncounter.encounterType.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY).is.truthy;
            return statusBuilder.build();
        });
    }

    static bloodTransfusionCheckNeeded(programEncounter){
        if (programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING) {
            return (ScreeningRuleHelper.electrophoresisTestRequired(programEncounter) || ScreeningRuleHelper.hplcTestRequired(programEncounter));
        }
        return programEncounter.encounterType.name === ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION;
    }


    bloodTransfusionCheck(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            let bloodTransfusionCheckNeeded = SickleCellScreeningHandlerJSS.bloodTransfusionCheckNeeded(programEncounter);
            statusBuilder.show().whenItem(bloodTransfusionCheckNeeded).is.truthy;
            return statusBuilder.build();
        });
    }

    hbBloodGroup(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            return new FormElementStatus(fe.uuid, programEncounter.encounterType.name !== ProgramEncounterTypeName.SAMPLE_SHIPMENT);
        });
    }

    @WithStatusBuilder
    resultFromOldReport([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether old report available").is.yes;
    }
    
    @WithStatusBuilder
    hplcOtherResultDetails([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Result from old sickle cell test report").containsAnswerConceptName("Other (HPLC)")
            .or.valueInEncounter("HPLC result").containsAnswerConceptName("Other");
    }

    @WithStatusBuilder
    solubilityResult([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY).is.truthy
            .and.latestValueInPreviousEncounters("Solubility result").is.notDefined
            .and.latestValueInPreviousEncounters("Electrophoresis result").is.notDefined;
    }


    @WithStatusBuilder
    whetherElectrophoresisResultAvailable([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY).is.truthy
            .and.latestValueInPreviousEncounters("Electrophoresis result").is.notDefined;
    }

    @WithStatusBuilder
    electrophoresisResult([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether Electrophoresis result available").is.yes;
    }

    @WithStatusBuilder
    whetherHplcResultAvailable([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY).is.truthy
            .and.latestValueInPreviousEncounters("HPLC Result").is.notDefined;
    }

    @WithStatusBuilder
    hplcResult([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether HPLC result available").is.yes;
    }


    @WithStatusBuilder
    btDate([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    collectSampleForHbSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().whenItem(ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(statusBuilder.context.programEncounter)).is.truthy;
    }

    @WithStatusBuilder
    collectSampleForHplc([], statusBuilder) {
        statusBuilder.show().whenItem(ScreeningRuleHelper.sampleToBeCollectedForHPLC(statusBuilder.context.programEncounter)).is.truthy;
    }

    @WithStatusBuilder
    btCheckFailedRevisitInstruction([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes
            .and.valueInEncounter("BT date").is.defined;
    }

    fieldTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(statusBuilder.context.programEncounter)).is.truthy;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    solubilityResultFromField([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes;
    }

    @WithStatusBuilder
    sendSampleForElectrophoresis([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes
            .and.valueInEncounter("Solubility result from field").containsAnswerConceptName("Positive");
    }

    @WithStatusBuilder
    sendSampleForSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether prep and/or solubility result from field available").is.no;
    }


    sampleCollectionShipmentDetails(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(ScreeningRuleHelper.sampleToBeShipped(programEncounter)).is.truthy;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    sampleNumber([], statusBuilder) {
        let status = statusBuilder.build();
        let programEncounter = statusBuilder.context.programEncounter;
        if(ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter) || ScreeningRuleHelper.sampleToBeCollectedForHPLC(programEncounter)){
            status.value = programEncounter.programEnrolment.getObservationValue("Enrolment number");
            status.visibility = true;
        } else {
            status.visibility = false;
        }
        return status;
    }

    @WithStatusBuilder
    sampleSentTo([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.SAMPLE_SHIPMENT).is.truthy;
    }

    @WithStatusBuilder
    bloodGroup([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name !== ProgramEncounterTypeName.SAMPLE_SHIPMENT).is.truthy
            .and.latestValueInPreviousEncounters("Blood group").is.notDefined;
    }

    @WithStatusBuilder
    medicalHistory([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.latestValueInPreviousEncounters("Medical history").is.notDefined
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
        statusBuilder.skipAnswers('Sickle Cell', 'Nephrotic syndrome', 'Renal Disease', 'Asthma', 'HIV/AIDS', 'Hepatitis B Positive');
    }

    @WithStatusBuilder
    whetherThisIsAHighRiskPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInRegistration("Whether registration for pregnant woman").is.yes
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
    }
    
    @WithStatusBuilder
    otherMedicalHistory([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Medical history").containsAnswerConceptName("Other");
    }

    @WithStatusBuilder
    dangerSignsInCurrentPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
        statusBuilder.skipAnswers('Eclampsia');
    }

    @WithStatusBuilder
    otherDangerSignsInCurrentPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Danger signs in current pregnancy").containsAnswerConceptName("Other");
    }

    @WithStatusBuilder
    complicationsInPastPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.latestValueInPreviousEncounters("Complications in past pregnancy").is.notDefined
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
        statusBuilder.skipAnswers('Seizures');
    }
    
    @WithStatusBuilder
    otherComplicationsInPastPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Complications in past pregnancy").containsAnswerConceptName("Other");
    }

}

@Decision('df47c9d5-88af-4a20-be5b-f639a6e2fae4', 'JSS Sickle cell screening form decisions', 100.0, {})
class SickleCellScreeningFormDecisionsJSS {

    static exec(programEncounter, decisions, context, today) {

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING){

            //Emptying to handle edit scenario
            decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[]});

            let resultFromOldReport = programEncounter.getObservationReadableValue('Result from old sickle cell test report');
            if(!_.isNil(resultFromOldReport)){
                (resultFromOldReport === "Unconfirmed (Electrophoresis)") ? decisions.encounterDecisions.push({name:"Electrophoresis result",value:["Other"]})
                : decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[resultFromOldReport]});
            }

            let solubilityResultFromField = programEncounter.getObservationReadableValue('Solubility result from field');
            if(!_.isNil(solubilityResultFromField)){
                decisions.encounterDecisions.push({name:"Solubility result",value:[solubilityResultFromField]});
                if(solubilityResultFromField === 'Negative'){
                    decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:["AA"]});
                }
            }

            let btDoneInLast3Months = programEncounter.getObservationReadableValue('Whether BT done in last 3 months');
            if (btDoneInLast3Months === 'No') {
                decisions.encounterDecisions.push({name: "BT check status", value: ["Passed.Sample can be collected"]});
            } else if (btDoneInLast3Months === 'Yes'){
                decisions.encounterDecisions.push({
                    name: "BT check status",
                    value: ["Failed.Revisit in 3 months from BT date"]
                });
            }



            if (ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter) || ScreeningRuleHelper.sampleToBeCollectedForHPLC(programEncounter)) {
                decisions.encounterDecisions.push(getCollectionDecision(programEncounter));
            }
        }

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY){

            //Emptying to handle edit scenario
            decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[]});

            let solubilityResult = programEncounter.getObservationReadableValue('Solubility result');
            if(!_.isNil(solubilityResult) && solubilityResult === 'Negative'){
                decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:["AA"]});
            }

            let electrophoresisResult = programEncounter.getObservationReadableValue('Electrophoresis result');
            if(!_.isNil(electrophoresisResult) && electrophoresisResult !== 'Other'){
                decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[electrophoresisResult]});
            }

            let hplcResult = programEncounter.getObservationReadableValue('HPLC result');
            if(!_.isNil(hplcResult)){
                decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[hplcResult === "Other" ? "Other (HPLC)" : hplcResult]});
            }
        }

        if (programEncounter.encounterType.name === ProgramEncounterTypeName.SAMPLE_SHIPMENT) {
                decisions.encounterDecisions.push(getShipmentDecision(programEncounter));
        }

        if (programEncounter.encounterType.name === ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION) {

            let btDoneInLast3Months = programEncounter.getObservationReadableValue('Whether BT done in last 3 months');
            if (btDoneInLast3Months === 'No') {
                decisions.encounterDecisions.push({name: "BT check status", value: ["Passed.Sample can be collected"]});
            } else {
                decisions.encounterDecisions.push({
                    name: "BT check status",
                    value: ["Failed.Revisit in 3 months from BT date"]
                });
            }


            if (ScreeningRuleHelper.sampleToBeCollectedForHPLC(programEncounter)) {
                decisions.encounterDecisions.push({name: 'Sample collected for', value: ['HPLC']});
            }
        }
        return decisions;
    }

}

const sampleNumberExists = (programEncounter) => new RuleCondition({programEncounter})
    .when.valueInEncounter('Sample number').is.defined
    .matches();

const getShipmentDecision = (programEncounter) => {
    const latestSampleCollectedFor = (ans) => new RuleCondition({programEncounter})
        .when.latestValueInPreviousEncounters('Sample collected for').containsAnyAnswerConceptName(ans)
        .matches();

    const sampleBeingShippedFor = [];
    const solubilityResultNeeded = new RuleCondition({programEncounter})
        .when.latestValueInPreviousEncounters('Solubility result').is.notDefined
        .matches();
    if (solubilityResultNeeded && latestSampleCollectedFor('Solubility')) {
        sampleBeingShippedFor.push('Solubility');
    }
    if (latestSampleCollectedFor('Electrophoresis')) {
        sampleBeingShippedFor.push('Electrophoresis');
    }
    if (latestSampleCollectedFor('HPLC')) {
        sampleBeingShippedFor.push('HPLC');
    }
    return {name: 'Sample shipped for', value: sampleBeingShippedFor};
};
const getCollectionDecision = (programEncounter) => {
    let sampleCollectedFor = [];

    if (ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter)) {
        sampleCollectedFor = ['Solubility', 'Electrophoresis'];
    }
    if (ScreeningRuleHelper.sampleToBeCollectedForHPLC(programEncounter)) {
        sampleCollectedFor = ['HPLC'];
    }
    return {name: 'Sample collected for', value: sampleCollectedFor};
};

module.exports = {SickleCellScreeningHandlerJSS,SickleCellScreeningFormDecisionsJSS};

