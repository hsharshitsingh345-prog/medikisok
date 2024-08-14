/**
 * MediKiosk - HL7 FHIR R4 Bundle Generator for ABDM Integration
 * Converts clinical history, patient identity, and document extractions
 * into standard ABDM Health Information Exchange (HIE) compliant FHIR Bundles.
 */

export function generateFhirR4Bundle(clinicalSummary) {
  const bundleId = 'urn:uuid:' + Math.random().toString(36).substring(2, 11);
  const patientId = 'urn:uuid:pat-' + (clinicalSummary.abhaId || '91482919203341').replace(/[^0-9]/g, '');
  const encounterId = 'urn:uuid:enc-' + Date.now();

  const fhirBundle = {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1.0',
      lastUpdated: new Date().toISOString(),
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
    },
    identifier: {
      system: 'https://abdm.gov.in/facilities/opd-kiosk',
      value: clinicalSummary.tokenNumber || 'OPD-TOKEN-108'
    },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      // 1. Patient Resource (with ABHA ID)
      {
        fullUrl: patientId,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          identifier: [
            {
              type: {
                coding: [
                  {
                    system: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/IdentifierType',
                    code: 'ABHA',
                    display: 'Ayushman Bharat Health Account'
                  }
                ]
              },
              system: 'https://healthid.ndhm.gov.in',
              value: clinicalSummary.abhaId
            }
          ],
          name: [
            {
              use: 'official',
              text: clinicalSummary.patientName
            }
          ],
          gender: clinicalSummary.ageGender?.toLowerCase().includes('female') ? 'female' : 'male',
          birthDate: clinicalSummary.dob || undefined,
          extension: clinicalSummary.bloodGroup ? [
            {
              url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup',
              valueString: clinicalSummary.bloodGroup
            }
          ] : undefined,
          telecom: [
            clinicalSummary.phone ? {
              system: 'phone',
              value: clinicalSummary.phone,
              use: 'mobile'
            } : null,
            clinicalSummary.email ? {
              system: 'email',
              value: clinicalSummary.email,
              use: 'home'
            } : null
          ].filter(Boolean)
        }
      },

      // 2. Encounter Resource
      {
        fullUrl: encounterId,
        resource: {
          resourceType: 'Encounter',
          id: encounterId,
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory / outpatient'
          },
          subject: {
            reference: patientId,
            display: clinicalSummary.patientName
          },
          serviceType: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: clinicalSummary.isAyushMode ? '394801008' : '394802001',
                display: clinicalSummary.department
              }
            ]
          }
        }
      },

      // 3. Condition / Chief Complaint Resource
      {
        fullUrl: 'urn:uuid:cond-chief-complaint',
        resource: {
          resourceType: 'Condition',
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active'
              }
            ]
          },
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                  code: 'problem-list-item',
                  display: 'Problem List Item'
                }
              ]
            }
          ],
          code: {
            text: clinicalSummary.clinicalSections.chiefComplaint
          },
          subject: {
            reference: patientId
          }
        }
      }
    ]
  };

  // Add Observations for Labs
  if (clinicalSummary.clinicalSections.investigationsSummary?.length > 0) {
    clinicalSummary.clinicalSections.investigationsSummary.forEach((lab, idx) => {
      fhirBundle.entry.push({
        fullUrl: `urn:uuid:obs-lab-${idx}`,
        resource: {
          resourceType: 'Observation',
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'laboratory',
                  display: 'Laboratory'
                }
              ]
            }
          ],
          code: {
            text: lab.test
          },
          subject: {
            reference: patientId
          },
          valueString: `${lab.value} ${lab.unit || ''}`,
          interpretation: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: lab.alertLevel?.includes('HIGH') ? 'H' : (lab.alertLevel?.includes('LOW') ? 'L' : 'N'),
                  display: lab.alertLevel
                }
              ]
            }
          ]
        }
      });
    });
  }

  // Add MedicationStatements
  if (clinicalSummary.clinicalSections.medicationHistory?.length > 0) {
    clinicalSummary.clinicalSections.medicationHistory.forEach((med, idx) => {
      fhirBundle.entry.push({
        fullUrl: `urn:uuid:med-${idx}`,
        resource: {
          resourceType: 'MedicationStatement',
          status: 'active',
          medicationCodeableConcept: {
            text: `${med.name} ${med.dosage || ''}`
          },
          subject: {
            reference: patientId
          },
          dosage: [
            {
              text: med.frequency || 'As directed'
            }
          ]
        }
      });
    });
  }

  // Add Vital Signs Observations (Weight, Height, BMI)
  if (clinicalSummary.weight) {
    fhirBundle.entry.push({
      fullUrl: 'urn:uuid:obs-weight',
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Body weight'
          }],
          text: 'Body Weight'
        },
        subject: { reference: patientId },
        valueString: clinicalSummary.weight
      }
    });
  }

  if (clinicalSummary.height) {
    fhirBundle.entry.push({
      fullUrl: 'urn:uuid:obs-height',
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8302-2',
            display: 'Body height'
          }],
          text: 'Body Height'
        },
        subject: { reference: patientId },
        valueString: clinicalSummary.height
      }
    });
  }

  if (clinicalSummary.bmi) {
    fhirBundle.entry.push({
      fullUrl: 'urn:uuid:obs-bmi',
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '39156-5',
            display: 'Body mass index (BMI) [Ratio]'
          }],
          text: 'Body Mass Index'
        },
        subject: { reference: patientId },
        valueString: clinicalSummary.bmi
      }
    });
  }

  // Add Blood Group Observation (LOINC 883-9)
  if (clinicalSummary.bloodGroup) {
    fhirBundle.entry.push({
      fullUrl: 'urn:uuid:obs-bloodgroup',
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '883-9',
            display: 'ABO and Rh group [Type] in Blood'
          }],
          text: 'Blood Group'
        },
        subject: { reference: patientId },
        valueString: clinicalSummary.bloodGroup
      }
    });
  }

  // Add Previous Hospital Referral Request if provided
  if (clinicalSummary.previousHospital && !clinicalSummary.previousHospital.toLowerCase().includes('walk-in')) {
    fhirBundle.entry.push({
      fullUrl: 'urn:uuid:referral-source',
      resource: {
        resourceType: 'ServiceRequest',
        status: 'completed',
        intent: 'order',
        code: {
          text: `Referral from facility: ${clinicalSummary.previousHospital}`
        },
        subject: { reference: patientId }
      }
    });
  }

  return fhirBundle;
}
