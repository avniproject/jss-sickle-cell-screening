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
const WithStatusBuilder = StatusBuilderAnnotationFactory('programEncounter', 'formElement');
const ScreeningVisitRule = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "VisitSchedule");
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
            statusBuilder.show().when.valueInEntireEnrolment("Whether SC confirmatory report available").is.notDefined;
            return statusBuilder.build();
        });
    }

    labTestResults(programEncounter, formElementGroup) {
        console.log("labTestResults");
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.latestValueInPreviousEncounters("Sample number").is.defined;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    solubilityResult([], statusBuilder) {
        statusBuilder.show().when.valueInEntireEnrolment("Solubility result").is.notDefined
            .and.latestValueInPreviousEncounters("Sample number").is.defined;
    }


    @WithStatusBuilder
    whetherElectrophoresisResultAvailable([], statusBuilder) {
        console.log("whetherElectrophoresisResultAvailable");
        statusBuilder.show().when.valueInEntireEnrolment("Electrophoresis result").is.notDefined
            .and.latestValueInPreviousEncounters("Sample number").is.defined;
    }

    @WithStatusBuilder
    electrophoresisResult([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether Electrophoresis result available").is.yes;
    }

    @WithStatusBuilder
    whetherHplcResultAvailable([], statusBuilder) {
        statusBuilder.show().when.latestValueInPreviousEncounters("Sample number").is.defined;
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
    btCheckReason([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no
            .or.latestValueInPreviousEncounters("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    btDoneInLast3Months([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether SC confirmatory report available").is.no
            .or.latestValueInPreviousEncounters("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    btDate([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes;
    }

    @WithStatusBuilder
    collectSampleForHbSolubilityAndElectrophoresis([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no;
    }

    @WithStatusBuilder
    btCheckFailedRevisitInstruction([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.yes
            .and.valueInEncounter("BT date").is.defined;
    }

    fieldTestResults(programEncounter, formElementGroup) {
        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no
                .and.latestValueInPreviousEncounters("Whether prep and/or solubility result from field available").is.defined;
            return statusBuilder.build();
        });
    }


    @WithStatusBuilder
    isSolubilityResultAvailableFromField([], statusBuilder) {
        statusBuilder.show().when.valueInEncounter("Whether BT done in last 3 months").is.no;
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
        console.log('sampleCollectionShipmentDetails');
        const ruleCondition = new RuleCondition({programEncounter: programEncounter});
        const solubilityFromFieldPositive = ruleCondition.when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes
            .and.valueInEncounter("Solubility result").containsAnswerConceptName("Positive").matches();
        console.log(solubilityFromFieldPositive);

        return formElementGroup.formElements.map(fe=>{
            let statusBuilder = new FormElementStatusBuilder({programEncounter:programEncounter, formElement:fe});
            statusBuilder.show().whenItem(solubilityFromFieldPositive).is.truthy
                .or.valueInEncounter("Whether prep and/or solubility result from field available").is.no;
            return statusBuilder.build();
        });
    }

    @WithStatusBuilder
    hb([], statusBuilder) {
        statusBuilder.show().when.valueInEntireEnrolment("Hb").is.notDefined;
    }

    @WithStatusBuilder
    bloodGroup([], statusBuilder) {
        statusBuilder.show().when.valueInEntireEnrolment("Blood group").is.notDefined;
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
        }
    }
}

@ScreeningVisitRule("b0e1b1b1-3fe1-45fe-b813-9471ed2561c8", "JSS Sickle cell screening visit schedule", 100.0, {})
class SickleCellScreeningVisitScheduleJSS {
    static exec(programEncounter, visitSchedule = [], scheduleConfig) {

        let btDate = programEncounter.getObservationReadableValue('BT date');

        if (!_.isNil(btDate)){
            const dateAfter3MonthsOfBT = moment(btDate).add(3, 'months').toDate();
            let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
            RuleHelper.addSchedule(scheduleBuilder, 'Sickle cell screening', 'Sickle cell screening', dateAfter3MonthsOfBT, 3);
            return scheduleBuilder.getAllUnique("encounterType");
        }
        return visitSchedule;
    }
}

@Decision('df47c9d5-88af-4a20-be5b-f639a6e2fae4', 'JSS Sickle cell screening form decisions', 100.0, {})
class SickleCellScreeningFormDecisionsJSS {

    static exec(programEncounter, decisions, context, today) {
        let solubilityResult = programEncounter.getObservationReadableValue('Solubility result');
        if(!_.isNil(solubilityResult) && solubilityResult === 'Negative'){
            decisions.encounterDecisions.push({name:"Hemoglobin genotype",value:["AA"]});
        }
        return decisions;
    }

}

module.exports = {SickleCellScreeningHandlerJSS, SickleCellScreeningProgramRuleJSS, SickleCellScreeningVisitScheduleJSS,SickleCellScreeningFormDecisionsJSS};

