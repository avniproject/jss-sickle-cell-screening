const moment = require("moment");
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
const RuleHelper = require('./RuleHelper');

const ScreeningViewFilter = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "ViewFilter");
const RegistrationViewFilter = RuleFactory("d8e956f9-c34b-4e38-a50a-786d4ab08737", "ViewFilter");
const WithStatusBuilder = StatusBuilderAnnotationFactory('programEncounter', 'formElement');
const WithRegistrationStatusBuilder = StatusBuilderAnnotationFactory('individual', 'formElement');
const ScreeningVisitRule = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "VisitSchedule");
const PostEnrolmentVisitRule = RuleFactory("da35a2b3-0d8f-4f12-b6a3-64cf1353284e", "VisitSchedule");
const Decision = RuleFactory('0723fd75-dc66-4aae-a3c9-31a09c9c4c7a', 'Decision');

const ProgramEncounterTypeName = {
    BASE_SCREENING: "Base screening",
    SAMPLE_SHIPMENT: "Sample shipment",
    LAB_RESULTS_ENTRY: "Lab results entry",
    HPLC_SAMPLE_COLLECTION: "HPLC sample collection"
};

let resultFromOldElectrophoresisOther = function (programEncounter) {
    return new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether result from old electrophoresis report is Other").is.yes.matches();
};

let scConfirmatoryTestAvailable = function (programEncounter) {
    return new RuleCondition({programEncounter: programEncounter}).when
        .valueInEncounter("Whether SC confirmatory report available").is.yes.matches();
};


let oldElectrophoresisResultAvailable = function (programEncounter) {
    return new RuleCondition({programEncounter: programEncounter}).when
        .valueInEncounter("Whether old electrophoresis report available").is.yes.matches();
};

let sampleToBeCollectedForHPLC = function (programEncounter) {
    let electrophoresisOther = new RuleCondition({programEncounter: programEncounter}).when
        .latestValueInPreviousEncounters("Electrophoresis result").containsAnswerConceptName("Other").or
        .valueInEncounter("Whether result from old electrophoresis report is Other").is.yes.matches();

    let btCheckPassAndElectrophoresisOther = new RuleCondition({programEncounter: programEncounter})
        .when.valueInEncounter("Whether BT done in last 3 months").is.no
        .and.whenItem(electrophoresisOther).is.truthy.matches();

    return (programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING || programEncounter.encounterType.name === ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION) && btCheckPassAndElectrophoresisOther;
};

let sampleToBeCollectedForSolubilityAndElectrophoresis = function (programEncounter) {
    let btCheckPassAndElectroResultNotAvailable = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether BT done in last 3 months").is.no
        .and.latestValueInPreviousEncounters("Electrophoresis result").is.notDefined
        .and.valueInEncounter("Whether result from old electrophoresis report is Other").is.notDefined.matches();

    return programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING && btCheckPassAndElectroResultNotAvailable;
};

let sampleToBeShipped = function (programEncounter) {

    if (sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter)){
        const solubilityFromFieldPositive = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes
            .and.valueInEncounter("Solubility result from field").containsAnswerConceptName("Positive").matches();
        const solubilityFromFieldUnavailable = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether prep and/or solubility result from field available").is.no.matches();

        return solubilityFromFieldUnavailable || solubilityFromFieldPositive;
    }
    return sampleToBeCollectedForHPLC(programEncounter);
};

@ScreeningViewFilter("78aaf13f-04f2-47cc-b4da-914f204793a9", "JSS Sickle Cell Screening Encounter View Filter", 100.0, {})
class SickleCellScreeningHandlerJSS {
    static exec(programEncounter, formElementGroup, today) {
        return FormElementsStatusHelper
            .getFormElementsStatusesWithoutDefaults(new SickleCellScreeningHandlerJSS(), programEncounter, formElementGroup, today);
    }

    sickleCellScreeningHistory(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.latestValueInPreviousEncounters("Whether SC confirmatory report available").is.notDefined;
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
            return (!scConfirmatoryTestAvailable(programEncounter) && (!oldElectrophoresisResultAvailable(programEncounter) || resultFromOldElectrophoresisOther(programEncounter)));
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

    @WithStatusBuilder
    whetherOldElectrophoresisReportAvailable([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no;
    }

    @WithStatusBuilder
    whetherResultFromOldElectrophoresisReportIsOther([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether old electrophoresis report available").is.yes;
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
    scConfirmatoryReportAvailable([], statusBuilder) {
        statusBuilder.show().when.latestValueInPreviousEncounters("Whether SC confirmatory report available").is.notDefined;
    }

    @WithStatusBuilder
    hemoglobinGenotypeFromOldReport([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.yes;
    }


    @WithStatusBuilder
    btDate([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    collectSampleForHbSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().whenItem(sampleToBeCollectedForSolubilityAndElectrophoresis(statusBuilder.context.programEncounter)).is.truthy;
    }

    @WithStatusBuilder
    collectSampleForHplc([], statusBuilder) {
        statusBuilder.show().whenItem(sampleToBeCollectedForHPLC(statusBuilder.context.programEncounter)).is.truthy;
    }

    @WithStatusBuilder
    btCheckFailedRevisitInstruction([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes
            .and.valueInEncounter("BT date").is.defined;
    }

    fieldTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(sampleToBeCollectedForSolubilityAndElectrophoresis(statusBuilder.context.programEncounter)).is.truthy;
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
            .and.valueInEncounter("Solubility result").containsAnswerConceptName("Positive");
    }

    @WithStatusBuilder
    sendSampleForSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether prep and/or solubility result from field available").is.no;
    }


    sampleCollectionShipmentDetails(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(sampleToBeShipped(programEncounter)).is.truthy;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    sampleSentTo([], statusBuilder) {
        statusBuilder.show().whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.SAMPLE_SHIPMENT).is.truthy;
    }

    @WithStatusBuilder
    hb([], statusBuilder) {
        statusBuilder.show().when.latestValueInPreviousEncounters("Hb").is.notDefined;
    }

    @WithStatusBuilder
    bloodGroup([], statusBuilder) {
        statusBuilder.show().when.latestValueInPreviousEncounters("Blood group").is.notDefined;
    }

    @WithStatusBuilder
    medicalHistory([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.latestValueInPreviousEncounters("Medical history").is.notDefined
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
        statusBuilder.skipAnswers('Sickle Cell');
    }

    @WithStatusBuilder
    whetherThisIsAHighRiskPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInRegistration("Whether registration for pregnant woman").is.yes
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
    }

    @WithStatusBuilder
    dangerSignsInCurrentPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;
    }

    @WithStatusBuilder
    complicationsInPastPregnancy([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether this is a high risk pregnancy").is.yes
            .and.latestValueInPreviousEncounters("Complications in past pregnancy").is.notDefined
            .and.whenItem(statusBuilder.context.programEncounter.name === ProgramEncounterTypeName.BASE_SCREENING).is.truthy;

    }
}

@ProgramRule({
    name: "Sickle cell screening program summary",
    uuid: "7fed3ab2-1a5e-4667-a7bf-e8d9ed66e615",
    programUUID: "e93303fa-f465-4db7-a945-d4fd6295f2b9",
    executionOrder: 100.0,
    metadata: {}
})

class SickleCellScreeningProgramRuleJSS {
    static exec(programEnrolment, summaries, context, today) {
        const hb = programEnrolment.findObservationInEntireEnrolment('Hb');
        if (!_.isNil(hb)) {
            summaries.push({name: 'Hb', value: hb.getValue()});
        }
        const bloodGroup = programEnrolment.findObservationInEntireEnrolment('Blood group');
        if (!_.isNil(bloodGroup)) {
            summaries.push({name: 'Blood group', value: bloodGroup.getValue()});
        }
        const genotype = programEnrolment.findObservationInEntireEnrolment('Hemoglobin genotype');
        if (!_.isNil(genotype)) {
            summaries.push({name: 'Hemoglobin genotype', value: genotype.getValue()});
        } else {
            const electrophoresisResult = programEnrolment.findObservationInEntireEnrolment('Electrophoresis result');
            if (!_.isNil(electrophoresisResult)) {
                summaries.push({name: 'Electrophoresis result', value: electrophoresisResult.getValue()});
            }
        }
    }
}

@ScreeningVisitRule("b0e1b1b1-3fe1-45fe-b813-9471ed2561c8", "JSS Sickle cell screening visit schedule", 100.0, {})
class SickleCellScreeningVisitScheduleJSS {
    static exec(programEncounter, visitSchedule = [], scheduleConfig) {

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING){
            let btDate = programEncounter.getObservationReadableValue('BT date');

            if (!_.isNil(btDate)){
                const dateAfter3MonthsOfBT = moment(btDate).add(3, 'months').toDate();
                let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
                RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.BASE_SCREENING, ProgramEncounterTypeName.BASE_SCREENING, dateAfter3MonthsOfBT, 3);
                return scheduleBuilder.getAllUnique("encounterType");
            }
        }

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.SAMPLE_SHIPMENT){
            let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
            RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.LAB_RESULTS_ENTRY, ProgramEncounterTypeName.LAB_RESULTS_ENTRY, programEncounter.encounterDateTime, 3);
            return scheduleBuilder.getAllUnique("encounterType");
        }

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.LAB_RESULTS_ENTRY){
            let electrophoresisResult = programEncounter.getObservationReadableValue('Electrophoresis result');
            if (!_.isNil(electrophoresisResult) && electrophoresisResult === 'Other') {
                let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
                RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION, ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION, programEncounter.encounterDateTime, 3);
                return scheduleBuilder.getAllUnique("encounterType");
            }
        }

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION){
            let btDate = programEncounter.getObservationReadableValue('BT date');

            if (!_.isNil(btDate)){
                const dateAfter3MonthsOfBT = moment(btDate).add(3, 'months').toDate();
                let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
                RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION, ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION, dateAfter3MonthsOfBT, 3);
                return scheduleBuilder.getAllUnique("encounterType");
            }
        }

        let sampleNumber = programEncounter.getObservationReadableValue('Sample number');
        if (!_.isNil(sampleNumber)){
            let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
            RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.SAMPLE_SHIPMENT, ProgramEncounterTypeName.SAMPLE_SHIPMENT, programEncounter.encounterDateTime, 3);
            return scheduleBuilder.getAllUnique("encounterType");
        }


        return visitSchedule;
    }
}

@PostEnrolmentVisitRule("a1c048e1-64b6-4d5d-b16f-55947bf21cf5", "JSS Sickle cell post enrolment visit schedule", 100.0, {})
class SickleCellScreeningPostEnrolmentVisitScheduleJSS {
    static exec(programEnrolment, visitSchedule = [], scheduleConfig) {

        let scheduleBuilder = RuleHelper.createEnrolmentScheduleBuilder(programEnrolment, visitSchedule);
        RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.BASE_SCREENING, ProgramEncounterTypeName.BASE_SCREENING, programEnrolment.enrolmentDateTime, 1);
        return scheduleBuilder.getAllUnique("encounterType");
    }
}

@Decision('df47c9d5-88af-4a20-be5b-f639a6e2fae4', 'JSS Sickle cell screening form decisions', 100.0, {})
class SickleCellScreeningFormDecisionsJSS {

    static exec(programEncounter, decisions, context, today) {

        if(programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING){

            //Emptying to handle edit scenario
            decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[]});

            let hemoglobinGenotypeFromOldReport = programEncounter.getObservationReadableValue('Hemoglobin genotype from old report');
            if(!_.isNil(hemoglobinGenotypeFromOldReport)){
                decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:[hemoglobinGenotypeFromOldReport]});
            }

            let electrophoresisResultFromOldReport = programEncounter.getObservationReadableValue('Whether result from old electrophoresis report is Other');
            if(!_.isNil(electrophoresisResultFromOldReport) && electrophoresisResultFromOldReport === 'Yes'){
                decisions.encounterDecisions.push({name:"Electrophoresis result",value:["Other"]});
            }

            let solubilityResultFromField = programEncounter.getObservationReadableValue('Solubility result from field');
            if(!_.isNil(solubilityResultFromField)){
                decisions.encounterDecisions.push({name:"Solubility result",value:[solubilityResultFromField]});
                if(solubilityResultFromField === 'Negative'){
                    decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:["AA"]});
                }
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

        return decisions;
    }

}

@RegistrationViewFilter("4a329f64-e131-4946-9b94-d2f988cc45be", "JSS Sickle Cell Screening Registration View Filter", 100.0, {})
class SickleCellRegistrationViewHandlerJSS {
    static exec(individual, formElementGroup) {
        return FormElementsStatusHelper
            .getFormElementsStatusesWithoutDefaults(new SickleCellRegistrationViewHandlerJSS(), individual, formElementGroup);
    }

    @WithRegistrationStatusBuilder
    otherVillage([], statusBuilder) {
        statusBuilder.show().whenItem(_.startsWith(statusBuilder.context.individual.lowestAddressLevel.name, "Other")).is.truthy;
    }

}

module.exports = {SickleCellScreeningHandlerJSS, SickleCellScreeningProgramRuleJSS, SickleCellScreeningVisitScheduleJSS,SickleCellScreeningFormDecisionsJSS, SickleCellScreeningPostEnrolmentVisitScheduleJSS, SickleCellRegistrationViewHandlerJSS};

