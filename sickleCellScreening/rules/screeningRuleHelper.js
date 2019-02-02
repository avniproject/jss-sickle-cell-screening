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

const ProgramEncounterTypeName = {
    BASE_SCREENING: 'Base screening',
    SAMPLE_SHIPMENT: 'Sample shipment',
    LAB_RESULTS_ENTRY: 'Lab results entry',
    HPLC_SAMPLE_COLLECTION: 'HPLC sample collection'
};


class ScreeningRuleHelper {

    static resultFromOldReportIsElectrophoresisUnconfirmed(programEncounter) {
        return new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Result from old sickle cell test report").containsAnswerConceptName("Unconfirmed (Electrophoresis)").matches();
    }

    static oldReportAvailable(programEncounter) {
        return new RuleCondition({programEncounter: programEncounter}).when
            .valueInEncounter("Whether old report available").is.yes.matches();
    }

    static hplcTestRequired(programEncounter) {
        return new RuleCondition({programEncounter: programEncounter}).when
            .latestValueInPreviousEncounters("Electrophoresis result").containsAnswerConceptName("Other").or
            .whenItem(ScreeningRuleHelper.resultFromOldReportIsElectrophoresisUnconfirmed(programEncounter)).is.truthy.matches();

    }

    static electrophoresisTestRequired(programEncounter) {
        return !ScreeningRuleHelper.oldReportAvailable(programEncounter);
    }

    static sampleToBeCollectedForHPLC(programEncounter) {
        let hplcTestRequiredAndBTCheckPassed = new RuleCondition({programEncounter: programEncounter})
            .when.valueInEncounter("Whether BT done in last 3 months").is.no
            .and.whenItem(ScreeningRuleHelper.hplcTestRequired(programEncounter)).is.truthy.matches();

        return (programEncounter.encounterType.name === ProgramEncounterTypeName.BASE_SCREENING || programEncounter.encounterType.name === ProgramEncounterTypeName.HPLC_SAMPLE_COLLECTION) && hplcTestRequiredAndBTCheckPassed;
    };

    static sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter) {
        if(programEncounter.encounterType.name !== ProgramEncounterTypeName.BASE_SCREENING){
            return false;
        }
        let electrophoresisTestRequiredAndBTcheckPassed = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether BT done in last 3 months").is.no
            .and.whenItem(ScreeningRuleHelper.electrophoresisTestRequired(programEncounter)).is.truthy.matches();

        return electrophoresisTestRequiredAndBTcheckPassed;
    }

    static sampleToBeShipped(programEncounter) {

        if (ScreeningRuleHelper.sampleToBeCollectedForSolubilityAndElectrophoresis(programEncounter)){
            const solubilityFromFieldPositive = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether prep and/or solubility result from field available").is.yes
                .and.valueInEncounter("Solubility result from field").containsAnswerConceptName("Positive").matches();
            const solubilityFromFieldUnavailable = new RuleCondition({programEncounter: programEncounter}).when.valueInEncounter("Whether prep and/or solubility result from field available").is.no.matches();

            return solubilityFromFieldUnavailable || solubilityFromFieldPositive;
        }
        return ScreeningRuleHelper.sampleToBeCollectedForHPLC(programEncounter);
    }

}

module.exports = {ScreeningRuleHelper};

