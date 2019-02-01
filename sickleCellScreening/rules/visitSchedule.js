const moment = require("moment");
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
const RuleHelper = require('../../RuleHelper');


const ScreeningVisitRule = RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "VisitSchedule");

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

        if(sampleToBeShipped(programEncounter)){
            let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
            RuleHelper.addSchedule(scheduleBuilder, ProgramEncounterTypeName.SAMPLE_SHIPMENT, ProgramEncounterTypeName.SAMPLE_SHIPMENT, programEncounter.encounterDateTime, 3);
            return scheduleBuilder.getAllUnique("encounterType");
        }
        return visitSchedule;
    }
}


module.exports = {SickleCellScreeningVisitScheduleJSS};